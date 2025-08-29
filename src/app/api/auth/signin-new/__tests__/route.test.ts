// src/app/api/auth/signin-new/__tests__/route.test.ts
import { NextRequest } from 'next/server';
import { handleSignIn } from '../route';
import { supabase } from '@/lib/supabase';
import { logger } from '@/infrastructure/monitoring/logger';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('@/infrastructure/monitoring/logger', () => ({
  logger: {
    child: jest.fn(() => ({
      logRequest: jest.fn(),
      logResponse: jest.fn(),
      logAuthEvent: jest.fn(),
      logAudit: jest.fn(),
      warn: jest.fn(),
    })),
  },
  createRequestLogger: jest.fn(() => ({
    logRequest: jest.fn(),
    logResponse: jest.fn(),
    logAuthEvent: jest.fn(),
    logAudit: jest.fn(),
    warn: jest.fn(),
  })),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('/api/auth/signin-new', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/signin-new', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'test-request-id',
      },
      body: JSON.stringify(body),
    });
  };

  describe('successful sign-in', () => {
    it('should successfully sign in a user with valid credentials', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'validPassword123',
      };

      const mockAuthData = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' },
        },
        session: {
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-123',
          expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        },
      };

      const mockProfile = {
        user_id: 'user-123',
        full_name: 'Test User',
        role: 'user',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation(mockFrom);

      const request = createMockRequest(requestBody);

      // Act
      const response = await handleSignIn(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.user.id).toBe('user-123');
      expect(responseData.data.user.email).toBe('test@example.com');
      expect(responseData.data.user.fullName).toBe('Test User');
      expect(responseData.data.session.accessToken).toBe('access-token-123');
      
      // Verify Supabase was called correctly
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'validPassword123',
      });
    });

    it('should create user profile if it does not exist', async () => {
      // Arrange
      const requestBody = {
        email: 'newuser@example.com',
        password: 'validPassword123',
      };

      const mockAuthData = {
        user: {
          id: 'user-456',
          email: 'newuser@example.com',
          user_metadata: { full_name: 'New User' },
        },
        session: {
          access_token: 'access-token-456',
          refresh_token: 'refresh-token-456',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      };

      const mockNewProfile = {
        user_id: 'user-456',
        full_name: 'New User',
        role: 'user',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      // Mock profile not found, then successful creation
      const mockFrom = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null, // Profile doesn't exist
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockNewProfile,
                error: null,
              }),
            }),
          }),
        });

      mockSupabase.from.mockImplementation(mockFrom);

      const request = createMockRequest(requestBody);

      // Act
      const response = await handleSignIn(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.user.fullName).toBe('New User');
      
      // Verify profile creation was attempted
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
    });
  });

  describe('validation errors', () => {
    it('should return 400 for invalid email', async () => {
      // Arrange
      const requestBody = {
        email: 'invalid-email',
        password: 'validPassword123',
      };

      const request = createMockRequest(requestBody);

      // Act & Assert
      await expect(handleSignIn(request)).rejects.toThrow('Invalid email format');
    });

    it('should return 400 for missing password', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        // password missing
      };

      const request = createMockRequest(requestBody);

      // Act & Assert
      await expect(handleSignIn(request)).rejects.toThrow('Password is required');
    });

    it('should return 400 for weak password during validation', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: '123', // Too weak
      };

      const request = createMockRequest(requestBody);

      // Act & Assert
      await expect(handleSignIn(request)).rejects.toThrow();
    });
  });

  describe('authentication errors', () => {
    it('should return 401 for invalid credentials', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'wrongPassword123',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const request = createMockRequest(requestBody);

      // Act & Assert
      await expect(handleSignIn(request)).rejects.toThrow('Invalid credentials');
    });

    it('should handle Supabase service errors', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'validPassword123',
      };

      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Service temporarily unavailable')
      );

      const request = createMockRequest(requestBody);

      // Act & Assert
      await expect(handleSignIn(request)).rejects.toThrow('Service temporarily unavailable');
    });
  });

  describe('edge cases', () => {
    it('should handle malformed JSON request body', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/auth/signin-new', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'test-request-id',
        },
        body: 'invalid json{',
      });

      // Act & Assert
      await expect(handleSignIn(request)).rejects.toThrow();
    });

    it('should continue sign-in even if profile operations fail', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'validPassword123',
      };

      const mockAuthData = {
        user: {
          id: 'user-789',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' },
        },
        session: {
          access_token: 'access-token-789',
          refresh_token: 'refresh-token-789',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      // Mock profile fetch failure
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation(mockFrom);

      const request = createMockRequest(requestBody);

      // Act
      const response = await handleSignIn(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.user.id).toBe('user-789');
      // Should still work even without profile
    });
  });

  describe('security', () => {
    it('should sanitize input to prevent injection attacks', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: '<script>alert("xss")</script>validPassword123',
      };

      const mockAuthData = {
        user: {
          id: 'user-999',
          email: 'test@example.com',
        },
        session: {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockAuthData,
        error: null,
      });

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { user_id: 'user-999', role: 'user' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation(mockFrom);

      const request = createMockRequest(requestBody);

      // Act
      const response = await handleSignIn(request);

      // Assert
      expect(response.status).toBe(200);
      
      // Verify that the password was sanitized before being passed to Supabase
      const lastCall = mockSupabase.auth.signInWithPassword.mock.calls[0][0];
      expect(lastCall.password).not.toContain('<script>');
      expect(lastCall.password).not.toContain('alert');
    });
  });
});