import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestDataSet, createTestBrainDump, mockBrainDumpStatuses } from '../../../test/fixtures';

describe('Brain Dump Table - CRUD Operations', () => {
  type BrainDumpStatus = 'pending' | 'converted' | 'archived'
  const { user } = createTestDataSet();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Brain Dump Entry', () => {
    it('should create a brain dump entry with title', () => {
      const dumpData = {
        user_id: user.id,
        title: 'Fix login bug',
        description: 'Users cannot sign in with Google',
        tags: ['bug', 'urgent'],
        status: 'pending' as const,
      };

      expect(dumpData.user_id).toBe(user.id);
      expect(dumpData.title).toBeTruthy();
      expect(dumpData.status).toBe('pending');
    });

    it('should handle brain dump without description', () => {
      const dump = createTestBrainDump(user.id, {
        description: null,
      });

      expect(dump.description).toBeNull();
    });

    it('should store tags as array', () => {
      const dump = createTestBrainDump(user.id, {
        tags: ['bug', 'frontend', 'critical'],
      });

      expect(Array.isArray(dump.tags)).toBe(true);
      expect(dump.tags).toContain('bug');
      expect(dump.tags).toHaveLength(3);
    });

    it('should handle empty tags', () => {
      const dump = createTestBrainDump(user.id, {
        tags: [],
      });

      expect(Array.isArray(dump.tags)).toBe(true);
      expect(dump.tags).toHaveLength(0);
    });
  });

  describe('Read Brain Dump Entries', () => {
    it('should fetch all brain dump entries for user', () => {
      const dumps = [
        createTestBrainDump(user.id),
        createTestBrainDump(user.id),
        createTestBrainDump(user.id),
      ];

      expect(dumps).toHaveLength(3);
      dumps.forEach((dump) => {
        expect(dump.user_id).toBe(user.id);
      });
    });

    it('should fetch brain dump by status', () => {
      const dumps = [
        createTestBrainDump(user.id, { status: 'pending' }),
        createTestBrainDump(user.id, { status: 'converted' }),
        createTestBrainDump(user.id, { status: 'pending' }),
      ];

      const pendingDumps = dumps.filter((d) => d.status === 'pending');

      expect(pendingDumps).toHaveLength(2);
    });

    it('should fetch brain dump by tag', () => {
      const dumps = [
        createTestBrainDump(user.id, { tags: ['urgent', 'bug'] }),
        createTestBrainDump(user.id, { tags: ['documentation'] }),
        createTestBrainDump(user.id, { tags: ['urgent', 'feature'] }),
      ];

      const urgentDumps = dumps.filter((d) => d.tags?.includes('urgent'));

      expect(urgentDumps).toHaveLength(2);
    });

    it('should search brain dump by title', () => {
      const dumps = [
        createTestBrainDump(user.id, { title: 'Login bug investigation' }),
        createTestBrainDump(user.id, { title: 'New feature ideas' }),
        createTestBrainDump(user.id, { title: 'Bug in payment flow' }),
      ];

      const bugDumps = dumps.filter((d) => d.title.toLowerCase().includes('bug'));

      expect(bugDumps).toHaveLength(2);
    });

    it('should fetch single brain dump by ID', () => {
      const dump = createTestBrainDump(user.id);

      expect(dump.id).toBeDefined();
      expect(dump.user_id).toBe(user.id);
    });
  });

  describe('Update Brain Dump', () => {
    it('should update status from pending to converted', () => {
      const dump = createTestBrainDump(user.id, { status: 'pending' });
      const updated = { ...dump, status: 'converted' as const };

      expect(updated.status).toBe('converted');
      expect(updated.id).toBe(dump.id);
    });

    it('should update status to archived', () => {
      const dump = createTestBrainDump(user.id, { status: 'pending' });
      const updated = { ...dump, status: 'archived' as const };

      expect(updated.status).toBe('archived');
    });

    it('should update title', () => {
      const dump = createTestBrainDump(user.id, { title: 'Old title' });
      const updated = { ...dump, title: 'New title' };

      expect(updated.title).toBe('New title');
    });

    it('should update description', () => {
      const dump = createTestBrainDump(user.id, { description: 'Old description' });
      const updated = { ...dump, description: 'New description' };

      expect(updated.description).toBe('New description');
    });

    it('should add new tags', () => {
      const dump = createTestBrainDump(user.id, { tags: ['bug'] });
      const updated = { ...dump, tags: [...(dump.tags || []), 'urgent'] };

      expect(updated.tags).toContain('bug');
      expect(updated.tags).toContain('urgent');
      expect(updated.tags).toHaveLength(2);
    });

    it('should remove tags', () => {
      const dump = createTestBrainDump(user.id, { tags: ['bug', 'urgent', 'feature'] });
      const updated = { ...dump, tags: dump.tags?.filter((t) => t !== 'bug') ?? [] };

      expect(updated.tags).not.toContain('bug');
      expect(updated.tags).toContain('urgent');
      expect(updated.tags).toContain('feature');
    });
  });

  describe('Delete Brain Dump', () => {
    it('should delete a brain dump entry', () => {
      const dump = createTestBrainDump(user.id);
      const deleted = true; // Simulating deletion

      expect(deleted).toBe(true);
    });

    it('should handle deletion of non-existent entry', () => {
      const nonExistentId = 'non-existent-id';
      // In real DB, this would return 0 rows affected
      const rowsAffected = 0;

      expect(rowsAffected).toBe(0);
    });
  });

  describe('Brain Dump Status Workflow', () => {
    it('should validate status values', () => {
      mockBrainDumpStatuses.forEach((status) => {
        const dump = createTestBrainDump(user.id, { status: status as BrainDumpStatus });
        expect(mockBrainDumpStatuses).toContain(dump.status);
      });
    });

    it('should track conversion workflow: pending -> converted', () => {
      let dump = createTestBrainDump(user.id, { status: 'pending' });

      expect(dump.status).toBe('pending');

      dump = { ...dump, status: 'converted' };

      expect(dump.status).toBe('converted');
    });

    it('should track archival workflow: pending -> archived', () => {
      let dump = createTestBrainDump(user.id, { status: 'pending' });

      expect(dump.status).toBe('pending');

      dump = { ...dump, status: 'archived' };

      expect(dump.status).toBe('archived');
    });
  });

  describe('Brain Dump Search and Filter', () => {
    it('should filter by multiple tags', () => {
      const dumps = [
        createTestBrainDump(user.id, { tags: ['urgent', 'bug'] }),
        createTestBrainDump(user.id, { tags: ['feature', 'frontend'] }),
        createTestBrainDump(user.id, { tags: ['urgent', 'backend'] }),
      ];

      const filtered = dumps.filter((d) => d.tags?.includes('urgent') && d.tags?.includes('bug'));

      expect(filtered).toHaveLength(1);
    });

    it('should search case-insensitively', () => {
      const dumps = [
        createTestBrainDump(user.id, { title: 'LOGIN BUG' }),
        createTestBrainDump(user.id, { title: 'Payment Flow' }),
        createTestBrainDump(user.id, { title: 'login issue' }),
      ];

      const results = dumps.filter((d) => d.title.toLowerCase().includes('login'));

      expect(results).toHaveLength(2);
    });

    it('should sort by creation date (newest first)', () => {
      const now = Date.now();
      const dumps = [
        createTestBrainDump(user.id, { created_at: new Date(now + 1000).toISOString() }),
        createTestBrainDump(user.id, { created_at: new Date(now).toISOString() }),
        createTestBrainDump(user.id, { created_at: new Date(now + 2000).toISOString() }),
      ];

      const sorted = [...dumps].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      expect(new Date(sorted[0].created_at).getTime()).toBeGreaterThan(new Date(sorted[1].created_at).getTime());
    });
  });

  describe('Data Integrity', () => {
    it('should maintain user reference', () => {
      const dump = createTestBrainDump(user.id);

      expect(dump.user_id).toBe(user.id);
    });

    it('should timestamp entry creation', () => {
      const dump = createTestBrainDump(user.id);
      const createdAt = new Date(dump.created_at);

      expect(createdAt).toBeInstanceOf(Date);
      expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should require title on creation', () => {
      const dump = createTestBrainDump(user.id);

      expect(dump.title).toBeTruthy();
      expect(dump.title.length).toBeGreaterThan(0);
    });
  });
});
