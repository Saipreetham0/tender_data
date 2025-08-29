// src/infrastructure/security/security-headers.middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
  strictTransportSecurity?: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  frameOptions?: {
    enabled: boolean;
    policy: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    allowFrom?: string;
  };
  contentTypeOptions?: {
    enabled: boolean;
  };
  referrerPolicy?: {
    enabled: boolean;
    policy: string;
  };
  permissionsPolicy?: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-eval'", // Required for Next.js development
        "'unsafe-inline'", // Required for inline styles
        'https://checkout.razorpay.com',
        'https://api.razorpay.com',
        'https://accounts.google.com',
        'https://www.gstatic.com',
        'https://vercel.live',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS
        'https://fonts.googleapis.com',
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://lh3.googleusercontent.com', // Google profile images
        'https://djbjiqanbuyciptstrqc.supabase.co', // Supabase storage
      ],
      'connect-src': [
        "'self'",
        'https://djbjiqanbuyciptstrqc.supabase.co',
        'https://api.razorpay.com',
        'https://accounts.google.com',
        'https://oauth2.googleapis.com',
        'wss://djbjiqanbuyciptstrqc.supabase.co', // Supabase realtime
      ],
      'frame-src': [
        "'self'",
        'https://api.razorpay.com',
        'https://checkout.razorpay.com',
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
    },
  },
  strictTransportSecurity: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameOptions: {
    enabled: true,
    policy: 'DENY',
  },
  contentTypeOptions: {
    enabled: true,
  },
  referrerPolicy: {
    enabled: true,
    policy: 'strict-origin-when-cross-origin',
  },
  permissionsPolicy: {
    enabled: true,
    directives: {
      'camera': ['()'],
      'microphone': ['()'],
      'geolocation': ['()'],
      'payment': ['self'],
      'usb': ['()'],
      'accelerometer': ['()'],
      'gyroscope': ['()'],
      'magnetometer': ['()'],
    },
  },
};

export class SecurityHeadersMiddleware {
  private config: SecurityHeadersConfig;

  constructor(config: Partial<SecurityHeadersConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
  }

  public applyHeaders(request: NextRequest, response: NextResponse): NextResponse {
    try {
      // Apply CSP headers
      if (this.config.contentSecurityPolicy?.enabled) {
        const cspHeader = this.buildCSPHeader(this.config.contentSecurityPolicy.directives);
        response.headers.set('Content-Security-Policy', cspHeader);
      }

      // Apply HSTS headers
      if (this.config.strictTransportSecurity?.enabled) {
        const hstsValue = this.buildHSTSHeader(this.config.strictTransportSecurity);
        response.headers.set('Strict-Transport-Security', hstsValue);
      }

      // Apply X-Frame-Options
      if (this.config.frameOptions?.enabled) {
        response.headers.set('X-Frame-Options', this.config.frameOptions.policy);
      }

      // Apply X-Content-Type-Options
      if (this.config.contentTypeOptions?.enabled) {
        response.headers.set('X-Content-Type-Options', 'nosniff');
      }

      // Apply Referrer Policy
      if (this.config.referrerPolicy?.enabled) {
        response.headers.set('Referrer-Policy', this.config.referrerPolicy.policy);
      }

      // Apply Permissions Policy
      if (this.config.permissionsPolicy?.enabled) {
        const permissionsValue = this.buildPermissionsHeader(this.config.permissionsPolicy.directives);
        response.headers.set('Permissions-Policy', permissionsValue);
      }

      // Additional security headers
      response.headers.set('X-DNS-Prefetch-Control', 'off');
      response.headers.set('X-Download-Options', 'noopen');
      response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
      response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
      response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

      // Remove server information
      response.headers.delete('Server');
      response.headers.delete('X-Powered-By');

      return response;
    } catch (error) {
      console.error('Error applying security headers:', error);
      return response;
    }
  }

  private buildCSPHeader(directives: Record<string, string[]>): string {
    return Object.entries(directives)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive;
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .join('; ');
  }

  private buildHSTSHeader(config: NonNullable<SecurityHeadersConfig['strictTransportSecurity']>): string {
    let value = `max-age=${config.maxAge}`;
    
    if (config.includeSubDomains) {
      value += '; includeSubDomains';
    }
    
    if (config.preload) {
      value += '; preload';
    }
    
    return value;
  }

  private buildPermissionsHeader(directives: Record<string, string[]>): string {
    return Object.entries(directives)
      .map(([directive, allowList]) => {
        const sources = allowList.length > 0 ? allowList.join(' ') : '()';
        return `${directive}=(${sources})`;
      })
      .join(', ');
  }

  private mergeConfig(defaultConfig: SecurityHeadersConfig, userConfig: Partial<SecurityHeadersConfig>): SecurityHeadersConfig {
    const merged = { ...defaultConfig };
    
    Object.keys(userConfig).forEach(key => {
      const configKey = key as keyof SecurityHeadersConfig;
      if (userConfig[configKey]) {
        merged[configKey] = { ...defaultConfig[configKey], ...userConfig[configKey] } as any;
      }
    });
    
    return merged;
  }

  // Helper method to update CSP for development
  public static createDevelopmentConfig(): Partial<SecurityHeadersConfig> {
    return {
      contentSecurityPolicy: {
        enabled: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': [
            "'self'",
            "'unsafe-eval'",
            "'unsafe-inline'",
            'https://checkout.razorpay.com',
            'https://api.razorpay.com',
            'https://accounts.google.com',
            'https://www.gstatic.com',
            'https://vercel.live',
            'http://localhost:*', // Allow localhost for development
          ],
          'connect-src': [
            "'self'",
            'https://djbjiqanbuyciptstrqc.supabase.co',
            'https://api.razorpay.com',
            'https://accounts.google.com',
            'https://oauth2.googleapis.com',
            'wss://djbjiqanbuyciptstrqc.supabase.co',
            'http://localhost:*', // Allow localhost for development
            'ws://localhost:*', // Allow websockets for development
          ],
        },
      },
    };
  }

  // Helper method to create production config
  public static createProductionConfig(): Partial<SecurityHeadersConfig> {
    return {
      contentSecurityPolicy: {
        enabled: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': [
            "'self'",
            // Remove unsafe-eval and unsafe-inline in production if possible
            'https://checkout.razorpay.com',
            'https://api.razorpay.com',
            'https://accounts.google.com',
            'https://www.gstatic.com',
          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'", // Keep for CSS-in-JS, consider moving to nonce-based
            'https://fonts.googleapis.com',
          ],
          'connect-src': [
            "'self'",
            'https://djbjiqanbuyciptstrqc.supabase.co',
            'https://api.razorpay.com',
            'https://accounts.google.com',
            'https://oauth2.googleapis.com',
            'wss://djbjiqanbuyciptstrqc.supabase.co',
          ],
        },
      },
    };
  }
}

// Export singleton instance
export const securityHeaders = new SecurityHeadersMiddleware(
  process.env.NODE_ENV === 'development' 
    ? SecurityHeadersMiddleware.createDevelopmentConfig()
    : SecurityHeadersMiddleware.createProductionConfig()
);