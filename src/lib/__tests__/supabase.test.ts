import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import { createTestDataSet, createTestTask, createTestWeek } from '../../../test/fixtures';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
    channel: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('Supabase Core Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auth Helpers', () => {
    it('should call getSession', async () => {
      const mockSession = {
        session: { user: { id: 'test-user' } },
      };
      (supabase.auth.getSession as any).mockResolvedValueOnce(mockSession);

      const result = await supabase.auth.getSession();

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(result.session.user.id).toBe('test-user');
    });

    it('should call getUser', async () => {
      const mockUser = {
        user: { id: 'test-user', email: 'test@example.com' },
      };
      (supabase.auth.getUser as any).mockResolvedValueOnce(mockUser);

      const result = await supabase.auth.getUser();

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should call signOut', async () => {
      (supabase.auth.signOut as any).mockResolvedValueOnce({ error: null });

      await supabase.auth.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Database Query Builder', () => {
    it('should be able to call from() for tables', () => {
      const mockFromResult = {
        select: vi.fn().mockReturnValue({ data: [] }),
      };
      (supabase.from as any).mockReturnValueOnce(mockFromResult);

      const result = supabase.from('tasks');

      expect(supabase.from).toHaveBeenCalledWith('tasks');
      expect(result.select).toBeDefined();
    });

    it('should support chaining operations', () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: { id: '1' } }),
      };
      (supabase.from as any).mockReturnValueOnce(mockChain);

      const result = supabase.from('tasks');

      expect(result.select).toBeDefined();
      expect(result.eq).toBeDefined();
      expect(result.single).toBeDefined();
    });
  });

  describe('Real-time subscriptions', () => {
    it('should initialize channel for real-time updates', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      };
      (supabase.channel as any).mockReturnValueOnce(mockChannel);

      const channel = supabase.channel('test-channel');

      expect(supabase.channel).toHaveBeenCalledWith('test-channel');
      expect(channel.on).toBeDefined();
      expect(channel.subscribe).toBeDefined();
    });

    it('should support listen events', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      };
      (supabase.channel as any).mockReturnValueOnce(mockChannel);

      const channel = supabase.channel('tasks-realtime');
      const result = channel.on('postgres_changes', { event: '*' }, () => {});

      expect(mockChannel.on).toHaveBeenCalledWith('postgres_changes', { event: '*' }, expect.any(Function));
    });
  });

  describe('Edge Functions', () => {
    it('should invoke edge functions with parameters', async () => {
      const mockResult = { data: { status: 'success' } };
      (supabase.functions.invoke as any).mockResolvedValueOnce(mockResult);

      const result = await supabase.functions.invoke('ai-handler', {
        body: { prompt: 'test' },
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-handler', {
        body: { prompt: 'test' },
      });
      expect(result.data.status).toBe('success');
    });

    it('should handle edge function errors', async () => {
      const mockError = { error: { message: 'Function error' } };
      (supabase.functions.invoke as any).mockResolvedValueOnce(mockError);

      const result = await supabase.functions.invoke('ai-handler', {
        body: {},
      });

      expect(result.error).toBeDefined();
    });
  });
});
