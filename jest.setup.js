import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
      has: jest.fn(),
      getAll: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
      entries: jest.fn(),
      forEach: jest.fn(),
      toString: jest.fn(),
    }
  },
  usePathname: () => '/',
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes'
process.env.RAZORPAY_KEY_ID = 'rzp_test_key_id'
process.env.RAZORPAY_KEY_SECRET = 'test-razorpay-secret'
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_key_id'
process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-secret'
process.env.CRON_API_SECRET_KEY = 'test-cron-secret-key'
process.env.RESEND_API_KEY = 're_test_key'
process.env.RESEND_FROM_EMAIL = 'test@example.com'
process.env.NOTIFICATION_EMAILS = 'test@example.com'
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret'
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000'
process.env.NODE_ENV = 'test'

// Mock fetch globally
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: jest.fn(),
    assign: jest.fn(),
    replace: jest.fn(),
  },
  writable: true,
})

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    pushState: jest.fn(),
    replaceState: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    go: jest.fn(),
  },
  writable: true,
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Suppress specific warnings
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})