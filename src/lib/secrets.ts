// src/lib/secrets.ts - Production secrets management
import crypto from 'crypto';

export interface SecretConfig {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  validator?: (value: string) => boolean;
}

export interface SecretsValidationResult {
  isValid: boolean;
  missingRequired: string[];
  invalidSecrets: string[];
  warnings: string[];
}

class SecretsManager {
  private static instance: SecretsManager;
  private secrets: Map<string, string> = new Map();
  private secretConfigs: SecretConfig[] = [
    {
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      required: true,
      description: 'Supabase project URL',
      validator: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
    },
    {
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      required: true,
      description: 'Supabase anonymous key',
      validator: (value) => value.startsWith('eyJ') && value.length > 100,
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      required: true,
      description: 'Supabase service role key (sensitive)',
      validator: (value) => value.startsWith('eyJ') && value.length > 100,
    },
    {
      name: 'JWT_SECRET',
      required: true,
      description: 'JWT signing secret',
      validator: (value) => value.length >= 32,
    },
    {
      name: 'RAZORPAY_KEY_ID',
      required: true,
      description: 'Razorpay key ID',
      validator: (value) => value.startsWith('rzp_') && value.length > 10,
    },
    {
      name: 'RAZORPAY_KEY_SECRET',
      required: true,
      description: 'Razorpay key secret (sensitive)',
      validator: (value) => value.length >= 20,
    },
    {
      name: 'NEXT_PUBLIC_RAZORPAY_KEY_ID',
      required: true,
      description: 'Razorpay public key ID',
      validator: (value) => value.startsWith('rzp_') && value.length > 10,
    },
    {
      name: 'RAZORPAY_WEBHOOK_SECRET',
      required: true,
      description: 'Razorpay webhook secret',
      validator: (value) => value.length >= 20,
    },
    {
      name: 'CRON_API_SECRET_KEY',
      required: true,
      description: 'Cron API secret key',
      validator: (value) => value.length >= 32,
    },
    {
      name: 'RESEND_API_KEY',
      required: true,
      description: 'Resend API key',
      validator: (value) => value.startsWith('re_') && value.length > 20,
    },
    {
      name: 'RESEND_FROM_EMAIL',
      required: true,
      description: 'Email from address',
      validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    },
    {
      name: 'NOTIFICATION_EMAILS',
      required: true,
      description: 'Notification email addresses',
      validator: (value) => value.split(',').every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())),
    },
    {
      name: 'GOOGLE_CLIENT_ID',
      required: true,
      description: 'Google OAuth client ID',
      validator: (value) => value.includes('.apps.googleusercontent.com'),
    },
    {
      name: 'GOOGLE_CLIENT_SECRET',
      required: true,
      description: 'Google OAuth client secret (sensitive)',
      validator: (value) => value.startsWith('GOCSPX-') || value.length >= 20,
    },
    {
      name: 'NEXT_PUBLIC_API_BASE_URL',
      required: true,
      description: 'API base URL',
      validator: (value) => value.startsWith('https://') || value.startsWith('http://localhost'),
    },
    {
      name: 'VERCEL_URL',
      required: false,
      description: 'Vercel deployment URL',
      defaultValue: 'https://tender-data.vercel.app',
    },
    {
      name: 'NODE_ENV',
      required: true,
      description: 'Node environment',
      defaultValue: 'development',
      validator: (value) => ['development', 'staging', 'production'].includes(value),
    },
    {
      name: 'SERVICE_NAME',
      required: false,
      description: 'Service name for logging',
      defaultValue: 'tender-data-app',
    },
  ];

  private constructor() {
    this.loadSecrets();
  }

  static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  private loadSecrets(): void {
    this.secretConfigs.forEach(config => {
      const value = process.env[config.name] || config.defaultValue;
      if (value) {
        this.secrets.set(config.name, value);
      }
    });
  }

  get(secretName: string): string | undefined {
    return this.secrets.get(secretName);
  }

  getRequired(secretName: string): string {
    const value = this.secrets.get(secretName);
    if (!value) {
      throw new Error(`Required secret '${secretName}' is not set`);
    }
    return value;
  }

  validateSecrets(): SecretsValidationResult {
    const missingRequired: string[] = [];
    const invalidSecrets: string[] = [];
    const warnings: string[] = [];

    this.secretConfigs.forEach(config => {
      const value = this.secrets.get(config.name);

      // Check if required secret is missing
      if (config.required && !value) {
        missingRequired.push(`${config.name}: ${config.description}`);
        return;
      }

      // Skip validation if secret is not set and not required
      if (!value && !config.required) {
        return;
      }

      // Validate secret format
      if (value && config.validator && !config.validator(value)) {
        invalidSecrets.push(`${config.name}: Invalid format`);
      }

      // Check for development/test values in production
      if (process.env.NODE_ENV === 'production' && value) {
        if (value.includes('test') || value.includes('dev') || value.includes('localhost')) {
          warnings.push(`${config.name}: Contains development/test values in production`);
        }
      }
    });

    return {
      isValid: missingRequired.length === 0 && invalidSecrets.length === 0,
      missingRequired,
      invalidSecrets,
      warnings,
    };
  }

  generateSecretKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateJWTSecret(): string {
    return crypto.randomBytes(64).toString('base64');
  }

  generateAPIKey(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `api_${timestamp}_${randomBytes}`;
  }

  maskSecret(secret: string): string {
    if (secret.length <= 8) {
      return '*'.repeat(secret.length);
    }
    return secret.slice(0, 4) + '*'.repeat(secret.length - 8) + secret.slice(-4);
  }

  getSecretsReport(): Record<string, any> {
    const report: Record<string, any> = {};
    
    this.secretConfigs.forEach(config => {
      const value = this.secrets.get(config.name);
      const isSensitive = config.description.includes('sensitive') || 
                         config.name.includes('SECRET') || 
                         config.name.includes('PRIVATE') ||
                         config.name.includes('PASSWORD');
      
      report[config.name] = {
        set: !!value,
        required: config.required,
        description: config.description,
        value: value && !isSensitive ? value : value ? this.maskSecret(value) : undefined,
        masked: isSensitive,
      };
    });

    return report;
  }

  rotateSecret(secretName: string, newValue: string): boolean {
    const config = this.secretConfigs.find(c => c.name === secretName);
    if (!config) {
      return false;
    }

    if (config.validator && !config.validator(newValue)) {
      return false;
    }

    this.secrets.set(secretName, newValue);
    return true;
  }

  // Environment-specific helpers
  isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  isStaging(): boolean {
    return this.get('NODE_ENV') === 'staging';
  }

  // Database connection helpers
  getSupabaseConfig() {
    return {
      url: this.getRequired('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: this.getRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      serviceRoleKey: this.getRequired('SUPABASE_SERVICE_ROLE_KEY'),
    };
  }

  // Payment configuration helpers
  getRazorpayConfig() {
    return {
      keyId: this.getRequired('RAZORPAY_KEY_ID'),
      keySecret: this.getRequired('RAZORPAY_KEY_SECRET'),
      publicKeyId: this.getRequired('NEXT_PUBLIC_RAZORPAY_KEY_ID'),
      webhookSecret: this.getRequired('RAZORPAY_WEBHOOK_SECRET'),
    };
  }

  // Email configuration helpers
  getEmailConfig() {
    return {
      apiKey: this.getRequired('RESEND_API_KEY'),
      fromEmail: this.getRequired('RESEND_FROM_EMAIL'),
      notificationEmails: this.getRequired('NOTIFICATION_EMAILS').split(',').map(email => email.trim()),
    };
  }

  // OAuth configuration helpers
  getGoogleOAuthConfig() {
    return {
      clientId: this.getRequired('GOOGLE_CLIENT_ID'),
      clientSecret: this.getRequired('GOOGLE_CLIENT_SECRET'),
    };
  }

  // Security configuration helpers
  getSecurityConfig() {
    return {
      jwtSecret: this.getRequired('JWT_SECRET'),
      cronApiSecret: this.getRequired('CRON_API_SECRET_KEY'),
      apiBaseUrl: this.getRequired('NEXT_PUBLIC_API_BASE_URL'),
    };
  }
}

// Export singleton instance
export const secrets = SecretsManager.getInstance();

// Validation function for startup
export function validateEnvironmentSecrets(): void {
  const result = secrets.validateSecrets();
  
  if (!result.isValid) {
    console.error('❌ Environment validation failed!');
    
    if (result.missingRequired.length > 0) {
      console.error('\n📋 Missing required secrets:');
      result.missingRequired.forEach(secret => {
        console.error(`  - ${secret}`);
      });
    }
    
    if (result.invalidSecrets.length > 0) {
      console.error('\n🔍 Invalid secrets:');
      result.invalidSecrets.forEach(secret => {
        console.error(`  - ${secret}`);
      });
    }
    
    if (result.warnings.length > 0) {
      console.warn('\n⚠️  Warnings:');
      result.warnings.forEach(warning => {
        console.warn(`  - ${warning}`);
      });
    }
    
    console.error('\n🔧 Please fix the above issues before starting the application.');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed!');
  
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
  }
}

// Helper to create secure .env.example file
export function generateEnvExample(): string {
  const lines = [
    '# Environment Variables Configuration',
    '# Copy this file to .env.local and fill in your values',
    '',
  ];
  
  secrets.secretConfigs.forEach(config => {
    lines.push(`# ${config.description}`);
    if (config.required) {
      lines.push(`${config.name}=`);
    } else {
      lines.push(`# ${config.name}=${config.defaultValue || ''}`);
    }
    lines.push('');
  });
  
  return lines.join('\n');
}

export default secrets;