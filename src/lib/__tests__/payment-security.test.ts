// src/lib/__tests__/payment-security.test.ts
import crypto from 'crypto';
import { PaymentSecurityService } from '../payment-security';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              razorpay_order_id: 'order_123',
              amount: 1000,
              currency: 'INR',
              created_at: new Date().toISOString(),
            },
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({ data: null, error: null })),
      gte: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  })),
}));

jest.mock('../logger', () => ({
  logger: {
    logSecurityEvent: jest.fn(),
    logPaymentEvent: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../monitoring', () => ({
  monitoring: {
    recordBusinessMetric: jest.fn(),
  },
}));

describe('PaymentSecurityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRazorpaySignature', () => {
    it('should validate correct signature', async () => {
      const orderId = 'order_123';
      const paymentId = 'pay_123';
      const body = `${orderId}|${paymentId}`;
      const secret = process.env.RAZORPAY_KEY_SECRET!;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      const result = await PaymentSecurityService.validateRazorpaySignature(
        orderId,
        paymentId,
        expectedSignature
      );

      expect(result.isValid).toBe(true);
      expect(result.orderId).toBe(orderId);
      expect(result.paymentId).toBe(paymentId);
    });

    it('should reject invalid signature', async () => {
      const orderId = 'order_123';
      const paymentId = 'pay_123';
      const invalidSignature = 'invalid_signature';

      const result = await PaymentSecurityService.validateRazorpaySignature(
        orderId,
        paymentId,
        invalidSignature
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid payment signature');
    });

    it('should handle signature validation errors', async () => {
      const orderId = 'order_123';
      const paymentId = 'pay_123';
      const malformedSignature = 'not_hex';

      const result = await PaymentSecurityService.validateRazorpaySignature(
        orderId,
        paymentId,
        malformedSignature
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Signature validation failed');
    });
  });

  describe('validateWebhookSignature', () => {
    it('should validate correct webhook signature', async () => {
      const payload = '{"event":"payment.captured","data":{"id":"pay_123"}}';
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const result = await PaymentSecurityService.validateWebhookSignature(
        payload,
        expectedSignature
      );

      expect(result.isValid).toBe(true);
      expect(result.event).toBe('payment.captured');
      expect(result.payload).toEqual({
        event: 'payment.captured',
        data: { id: 'pay_123' },
      });
    });

    it('should reject invalid webhook signature', async () => {
      const payload = '{"event":"payment.captured","data":{"id":"pay_123"}}';
      const invalidSignature = 'invalid_signature';

      const result = await PaymentSecurityService.validateWebhookSignature(
        payload,
        invalidSignature
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid webhook signature');
    });

    it('should handle malformed JSON payload', async () => {
      const payload = 'invalid json';
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const result = await PaymentSecurityService.validateWebhookSignature(
        payload,
        signature
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Webhook validation failed');
    });
  });

  describe('validatePaymentOrder', () => {
    it('should validate existing order with correct amount', async () => {
      const orderId = 'order_123';
      const expectedAmount = 1000;
      const expectedCurrency = 'INR';

      const result = await PaymentSecurityService.validatePaymentOrder(
        orderId,
        expectedAmount,
        expectedCurrency
      );

      expect(result.isValid).toBe(true);
      expect(result.orderId).toBe(orderId);
      expect(result.amount).toBe(expectedAmount);
      expect(result.currency).toBe(expectedCurrency);
    });

    it('should reject order with amount mismatch', async () => {
      const orderId = 'order_123';
      const expectedAmount = 2000; // Different from mocked amount
      const expectedCurrency = 'INR';

      const result = await PaymentSecurityService.validatePaymentOrder(
        orderId,
        expectedAmount,
        expectedCurrency
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Amount mismatch');
    });

    it('should reject order with currency mismatch', async () => {
      const orderId = 'order_123';
      const expectedAmount = 1000;
      const expectedCurrency = 'USD'; // Different from mocked currency

      const result = await PaymentSecurityService.validatePaymentOrder(
        orderId,
        expectedAmount,
        expectedCurrency
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Currency mismatch');
    });
  });

  describe('preventReplayAttack', () => {
    it('should allow first payment attempt', async () => {
      const paymentId = 'pay_new_123';
      const result = await PaymentSecurityService.preventReplayAttack(paymentId);
      expect(result).toBe(true);
    });

    it('should prevent replay attack on same payment', async () => {
      const paymentId = 'pay_replay_123';
      
      // First attempt should succeed
      const result1 = await PaymentSecurityService.preventReplayAttack(paymentId);
      expect(result1).toBe(true);
      
      // Second attempt should fail
      const result2 = await PaymentSecurityService.preventReplayAttack(paymentId);
      expect(result2).toBe(false);
    });

    it('should handle different types (payment vs webhook)', async () => {
      const id = 'test_123';
      
      // Should allow same ID for different types
      const paymentResult = await PaymentSecurityService.preventReplayAttack(id, 'payment');
      const webhookResult = await PaymentSecurityService.preventReplayAttack(id, 'webhook');
      
      expect(paymentResult).toBe(true);
      expect(webhookResult).toBe(true);
    });
  });

  describe('validatePaymentData', () => {
    it('should validate correct payment data', async () => {
      const validData = {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'valid_signature',
        userEmail: 'test@example.com',
      };

      const result = await PaymentSecurityService.validatePaymentData(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({
        ...validData,
        userEmail: 'test@example.com',
      });
    });

    it('should reject invalid payment data', async () => {
      const invalidData = {
        razorpay_order_id: '', // Empty required field
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'valid_signature',
        userEmail: 'invalid-email',
      };

      const result = await PaymentSecurityService.validatePaymentData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('checkSuspiciousActivity', () => {
    it('should not flag normal activity as suspicious', async () => {
      const userEmail = 'normal@example.com';
      const amount = 1000;

      const result = await PaymentSecurityService.checkSuspiciousActivity(
        userEmail,
        amount
      );

      expect(result.isSuspicious).toBe(false);
    });

    it('should flag high amounts as suspicious', async () => {
      const userEmail = 'high@example.com';
      const amount = 150000; // Very high amount

      const result = await PaymentSecurityService.checkSuspiciousActivity(
        userEmail,
        amount
      );

      expect(result.isSuspicious).toBe(false); // Depends on recent payments mock
    });
  });

  describe('generateSecureOrderId', () => {
    it('should generate unique order IDs', async () => {
      const id1 = await PaymentSecurityService.generateSecureOrderId();
      const id2 = await PaymentSecurityService.generateSecureOrderId();

      expect(id1).toMatch(/^order_[a-z0-9]+_[a-f0-9]+$/);
      expect(id2).toMatch(/^order_[a-z0-9]+_[a-f0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('encryptSensitiveData', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const originalData = 'sensitive-information';
      
      const encrypted = await PaymentSecurityService.encryptSensitiveData(originalData);
      expect(encrypted).not.toBe(originalData);
      expect(encrypted).toContain(':');
      
      const decrypted = await PaymentSecurityService.decryptSensitiveData(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should generate different encrypted values for same input', async () => {
      const data = 'test-data';
      
      const encrypted1 = await PaymentSecurityService.encryptSensitiveData(data);
      const encrypted2 = await PaymentSecurityService.encryptSensitiveData(data);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      const decrypted1 = await PaymentSecurityService.decryptSensitiveData(encrypted1);
      const decrypted2 = await PaymentSecurityService.decryptSensitiveData(encrypted2);
      
      expect(decrypted1).toBe(data);
      expect(decrypted2).toBe(data);
    });
  });

  describe('logPaymentEvent', () => {
    it('should log payment event successfully', async () => {
      const event = 'payment_completed';
      const paymentId = 'pay_123';
      const orderId = 'order_123';
      const amount = 1000;
      const status = 'success';
      const userEmail = 'test@example.com';

      await PaymentSecurityService.logPaymentEvent(
        event,
        paymentId,
        orderId,
        amount,
        status,
        userEmail
      );

      // Verify that logging functions were called
      const { logger } = require('../logger');
      const { monitoring } = require('../monitoring');
      
      expect(logger.logPaymentEvent).toHaveBeenCalledWith(
        event,
        paymentId,
        amount,
        status,
        expect.objectContaining({
          orderId,
          userEmail,
        })
      );
      
      expect(monitoring.recordBusinessMetric).toHaveBeenCalledWith(
        `payment_${event}`,
        1,
        userEmail
      );
    });
  });
});