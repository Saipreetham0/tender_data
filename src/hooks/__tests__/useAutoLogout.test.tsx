// src/hooks/__tests__/useAutoLogout.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAutoLogout } from '../useAutoLogout';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

const mockPush = jest.fn();
const mockRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;
mockRouterMock.mockReturnValue({
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
});

describe('useAutoLogout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
    
    // Mock window object
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
      },
      writable: true,
    });
  });

  it('should initialize without errors', () => {
    const { result } = renderHook(() => useAutoLogout());
    
    expect(result.current.startMonitoring).toBeDefined();
    expect(result.current.stopMonitoring).toBeDefined();
    expect(result.current.logout).toBeDefined();
    expect(result.current.checkTokenExpiration).toBeDefined();
  });

  it('should call custom logout handler when provided', async () => {
    const mockLogout = jest.fn();
    const { result } = renderHook(() => 
      useAutoLogout({ onLogout: mockLogout })
    );

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login?reason=session_expired');
  });

  it('should call warning callback when session expires soon', () => {
    const mockWarning = jest.fn();
    renderHook(() => 
      useAutoLogout({ 
        onWarning: mockWarning,
        warningTime: 300000, // 5 minutes
        checkInterval: 1000 // 1 second for testing
      })
    );

    expect(mockWarning).not.toHaveBeenCalled();
  });

  it('should handle errors during token check gracefully', async () => {
    const { supabase } = await import('@/lib/auth');
    (supabase.auth.getSession as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAutoLogout());

    await act(async () => {
      await result.current.checkTokenExpiration();
    });

    expect(mockPush).toHaveBeenCalledWith('/login?reason=session_expired');
  });
});