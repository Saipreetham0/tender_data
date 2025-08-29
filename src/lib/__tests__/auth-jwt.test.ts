// src/lib/__tests__/auth-jwt.test.ts
import { AuthService, AuthError, RateLimiter } from '../auth-jwt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-user-id',
              email: 'test@example.com',
              role: 'user',
              subscription_status: 'active',
              subscription_plan: 'monthly',
              subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const mockSign = jest.mocked(jwt.sign);
      mockSign.mockReturnValue('test-token' as any);

      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const token = AuthService.generateToken(payload);

      expect(token).toBe('test-token');
      expect(mockSign).toHaveBeenCalledWith(
        payload,
        process.env.JWT_SECRET,
        expect.objectContaining({
          expiresIn: '2d',
          issuer: 'tender-data-app',
          audience: 'tender-data-users',
        })
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const mockVerify = jest.mocked(jwt.verify);
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'user' as const,
      };
      mockVerify.mockReturnValue(payload as any);

      const result = AuthService.verifyToken('valid-token');

      expect(result).toEqual(payload);
      expect(mockVerify).toHaveBeenCalledWith(
        'valid-token',
        process.env.JWT_SECRET,
        expect.objectContaining({
          issuer: 'tender-data-app',
          audience: 'tender-data-users',
        })
      );
    });

    it('should throw AuthError for expired token', () => {
      const mockVerify = jest.mocked(jwt.verify);
      mockVerify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      expect(() => AuthService.verifyToken('expired-token')).toThrow(AuthError);
      expect(() => AuthService.verifyToken('expired-token')).toThrow('Token expired');
    });

    it('should throw AuthError for invalid token', () => {
      const mockVerify = jest.mocked(jwt.verify);
      mockVerify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      expect(() => AuthService.verifyToken('invalid-token')).toThrow(AuthError);
      expect(() => AuthService.verifyToken('invalid-token')).toThrow('Invalid token');
    });
  });

  describe('authenticateAdmin', () => {
    it('should authenticate valid admin API key', async () => {
      const result = await AuthService.authenticateAdmin(process.env.CRON_API_SECRET_KEY!);
      expect(result).toBe(true);
    });

    it('should reject invalid admin API key', async () => {
      const result = await AuthService.authenticateAdmin('invalid-key');
      expect(result).toBe(false);
    });
  });

  describe('getUserFromToken', () => {
    it('should return user data for valid token', async () => {
      const mockVerify = jest.mocked(jwt.verify);
      mockVerify.mockReturnValue({
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
      } as any);

      const user = await AuthService.getUserFromToken('valid-token');

      expect(user).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
        subscription: {
          status: 'active',
          plan: 'monthly',
          expiresAt: expect.any(String),
        },
      });
    });

    it('should return null for invalid token', async () => {
      const mockVerify = jest.mocked(jwt.verify);
      mockVerify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      const user = await AuthService.getUserFromToken('invalid-token');
      expect(user).toBeNull();
    });
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear rate limit store
    (RateLimiter as any).rateLimitStore?.clear();
  });

  describe('checkLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await RateLimiter.checkLimit('test-user', 60000, 10);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should deny requests exceeding limit', async () => {
      const identifier = 'test-user';
      const windowMs = 60000;
      const maxRequests = 2;

      // Make requests up to the limit
      await RateLimiter.checkLimit(identifier, windowMs, maxRequests);
      await RateLimiter.checkLimit(identifier, windowMs, maxRequests);

      // This should be denied
      const result = await RateLimiter.checkLimit(identifier, windowMs, maxRequests);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset counter after window expires', async () => {
      const identifier = 'test-user';
      const windowMs = 100; // Short window for testing
      const maxRequests = 1;

      // Make request
      const result1 = await RateLimiter.checkLimit(identifier, windowMs, maxRequests);
      expect(result1.allowed).toBe(true);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, windowMs + 10));

      // Should be allowed again
      const result2 = await RateLimiter.checkLimit(identifier, windowMs, maxRequests);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('requireRateLimit', () => {
    it('should not throw for requests within limit', async () => {
      await expect(RateLimiter.requireRateLimit('test-user', 60000, 10)).resolves.not.toThrow();
    });

    it('should throw AuthError for requests exceeding limit', async () => {
      const identifier = 'test-user';
      const windowMs = 60000;
      const maxRequests = 1;

      // First request should succeed
      await RateLimiter.requireRateLimit(identifier, windowMs, maxRequests);

      // Second request should throw
      await expect(RateLimiter.requireRateLimit(identifier, windowMs, maxRequests))
        .rejects.toThrow(AuthError);
    });
  });
});

describe('AuthError', () => {
  it('should create error with message and code', () => {
    const error = new AuthError('Test error', 'TEST_CODE');
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('AuthError');
  });
});