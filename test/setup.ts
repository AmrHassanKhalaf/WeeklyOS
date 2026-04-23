import { vi, beforeAll, afterEach } from 'vitest';

// ─── Mock environment variables ─────────────────────────────────────────────

beforeAll(() => {
  // Set test environment variables
  import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  import.meta.env.VITE_GEMINI_API_KEY = 'test-gemini-key';
});

// ─── Mock Supabase module globally ─────────────────────────────────────────

vi.mock('../src/lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signUp: vi.fn(),
        signIn: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        getUser: vi.fn(),
        onAuthStateChange: vi.fn(),
      },
      from: vi.fn(),
      channel: vi.fn(),
      functions: {
        invoke: vi.fn(),
      },
    },
  };
});

// ─── Mock window.matchMedia ────────────────────────────────────────────────

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ─── Clean up after each test ──────────────────────────────────────────────

afterEach(() => {
  vi.clearAllMocks();
});
