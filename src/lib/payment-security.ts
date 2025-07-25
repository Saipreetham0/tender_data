// src/lib/payment-security.ts - Production-ready payment validation
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';
import { monitoring } from './monitoring';
import { validateAndSanitize, paymentVerificationSchema, paymentOrderSchema } from './validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface PaymentValidationResult {
  isValid: boolean;
  error?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  paymentId?: string;
}

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
  event?: string;
  payload?: any;
}

export class PaymentSecurityService {
  private static readonly WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;
  private static readonly RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
  private static readonly PAYMENT_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  
  // Idempotency tracking
  private static readonly processedPayments = new Set<string>();
  private static readonly processedWebhooks = new Set<string>();

  static async validateRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<PaymentValidationResult> {
    try {
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        logger.logSecurityEvent('payment_signature_invalid', 'high', {
          orderId,
          paymentId,
          providedSignature: signature,
        });
        
        return {
          isValid: false,
          error: 'Invalid payment signature',
        };
      }

      return {
        isValid: true,
        orderId,
        paymentId,
      };
    } catch (error) {
      logger.error('Payment signature validation failed', error as Error, {
        orderId,
        paymentId,
      });
      
      return {
        isValid: false,
        error: 'Signature validation failed',
      };
    }
  }

  static async validateWebhookSignature(
    payload: string,
    signature: string
  ): Promise<WebhookValidationResult> {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        logger.logSecurityEvent('webhook_signature_invalid', 'high', {
          providedSignature: signature,
          payloadLength: payload.length,
        });
        
        return {
          isValid: false,
          error: 'Invalid webhook signature',
        };
      }

      const parsedPayload = JSON.parse(payload);
      return {
        isValid: true,
        event: parsedPayload.event,
        payload: parsedPayload,
      };
    } catch (error) {
      logger.error('Webhook signature validation failed', error as Error, {
        signatureLength: signature.length,
        payloadLength: payload.length,
      });
      
      return {
        isValid: false,
        error: 'Webhook validation failed',
      };
    }
  }

  static async validatePaymentOrder(
    orderId: string,
    expectedAmount: number,
    expectedCurrency: string = 'INR'
  ): Promise<PaymentValidationResult> {
    try {
      // Check if order exists in database
      const { data: order, error } = await supabaseAdmin
        .from('payment_orders')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .single();

      if (error || !order) {
        logger.logSecurityEvent('payment_order_not_found', 'medium', {
          orderId,
          expectedAmount,
        });
        
        return {
          isValid: false,
          error: 'Order not found',
        };
      }

      // Validate amount
      if (order.amount !== expectedAmount) {
        logger.logSecurityEvent('payment_amount_mismatch', 'critical', {
          orderId,
          expectedAmount,
          actualAmount: order.amount,
        });
        
        return {
          isValid: false,
          error: 'Amount mismatch',
        };
      }

      // Validate currency
      if (order.currency !== expectedCurrency) {
        logger.logSecurityEvent('payment_currency_mismatch', 'high', {
          orderId,
          expectedCurrency,
          actualCurrency: order.currency,
        });
        
        return {
          isValid: false,
          error: 'Currency mismatch',
        };
      }

      // Check order expiration
      const orderTime = new Date(order.created_at).getTime();
      const currentTime = Date.now();
      
      if (currentTime - orderTime > this.PAYMENT_TIMEOUT) {
        logger.logSecurityEvent('payment_order_expired', 'medium', {
          orderId,
          orderTime,
          currentTime,
          timeout: this.PAYMENT_TIMEOUT,
        });
        
        return {
          isValid: false,
          error: 'Order expired',
        };
      }

      return {
        isValid: true,
        orderId,
        amount: order.amount,
        currency: order.currency,
      };
    } catch (error) {
      logger.error('Payment order validation failed', error as Error, {
        orderId,
        expectedAmount,
      });
      
      return {
        isValid: false,
        error: 'Order validation failed',
      };
    }
  }

  static async preventReplayAttack(
    paymentId: string,
    type: 'payment' | 'webhook' = 'payment'
  ): Promise<boolean> {
    const key = `${type}_${paymentId}`;
    const storage = type === 'payment' ? this.processedPayments : this.processedWebhooks;
    
    if (storage.has(key)) {
      logger.logSecurityEvent('replay_attack_detected', 'critical', {
        type,
        paymentId,
      });
      
      return false;
    }
    
    storage.add(key);
    
    // Clean up old entries (keep last 1000)
    if (storage.size > 1000) {
      const entries = Array.from(storage);
      entries.slice(0, 500).forEach(entry => storage.delete(entry));
    }
    
    return true;
  }

  static async validatePaymentData(data: any): Promise<{ isValid: boolean; error?: string; data?: any }> {
    try {
      const validatedData = validateAndSanitize(paymentVerificationSchema, data);
      return {
        isValid: true,
        data: validatedData,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid payment data',
      };
    }
  }

  static async validateOrderData(data: any): Promise<{ isValid: boolean; error?: string; data?: any }> {
    try {
      const validatedData = validateAndSanitize(paymentOrderSchema, data);
      return {
        isValid: true,
        data: validatedData,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid order data',
      };
    }
  }

  static async logPaymentEvent(
    event: string,
    paymentId: string,
    orderId: string,
    amount: number,
    status: string,
    userEmail?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      // Log to application logs
      logger.logPaymentEvent(event, paymentId, amount, status, {
        orderId,
        userEmail,
        ...additionalData,
      });

      // Record metrics
      await monitoring.recordBusinessMetric(`payment_${event}`, 1, userEmail);
      
      // Store in payment history
      await supabaseAdmin.from('payment_history').insert({
        payment_id: paymentId,
        order_id: orderId,
        event,
        amount,
        status,
        user_email: userEmail,
        metadata: additionalData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to log payment event', error as Error, {
        event,
        paymentId,
        orderId,
      });
    }
  }

  static async checkSuspiciousActivity(
    userEmail: string,
    amount: number,
    ip?: string
  ): Promise<{ isSuspicious: boolean; reason?: string }> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Check for multiple payments from same user
      const { data: recentPayments, error } = await supabaseAdmin
        .from('payment_history')
        .select('*')
        .eq('user_email', userEmail)
        .gte('timestamp', twentyFourHoursAgo.toISOString())
        .eq('status', 'completed');

      if (error) {
        logger.error('Failed to check suspicious activity', error, { userEmail });
        return { isSuspicious: false };
      }

      // Check for too many payments
      if (recentPayments && recentPayments.length > 5) {
        logger.logSecurityEvent('suspicious_payment_frequency', 'high', {
          userEmail,
          paymentCount: recentPayments.length,
          timeWindow: '24h',
        });
        
        return {
          isSuspicious: true,
          reason: 'Too many payments in 24 hours',
        };
      }

      // Check for unusually high amount
      const totalAmount = recentPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      if (totalAmount > 100000) { // 1 lakh rupees
        logger.logSecurityEvent('suspicious_payment_amount', 'high', {
          userEmail,
          totalAmount,
          currentAmount: amount,
        });
        
        return {
          isSuspicious: true,
          reason: 'Unusually high payment amount',
        };
      }

      return { isSuspicious: false };
    } catch (error) {
      logger.error('Suspicious activity check failed', error as Error, {
        userEmail,
        amount,
      });
      
      return { isSuspicious: false };
    }
  }

  static async generateSecureOrderId(): Promise<string> {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `order_${timestamp}_${randomBytes}`;
  }

  static async encryptSensitiveData(data: string): Promise<string> {
    const algorithm = 'aes-256-gcm';
    const key = crypto.createHash('sha256').update(this.RAZORPAY_KEY_SECRET).digest();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  static async decryptSensitiveData(encryptedData: string): Promise<string> {
    const algorithm = 'aes-256-gcm';
    const key = crypto.createHash('sha256').update(this.RAZORPAY_KEY_SECRET).digest();
    
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export default PaymentSecurityService;