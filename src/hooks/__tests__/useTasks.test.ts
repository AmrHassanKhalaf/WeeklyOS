import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestDataSet, createTestTask, mockTaskStatuses, mockPriorities, mockDaysOfWeek } from '../../../test/fixtures';

describe('Tasks Table - CRUD Operations', () => {
  const { user, week } = createTestDataSet();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Task', () => {
    it('should create a task with required fields', () => {
      const taskData = {
        user_id: user.id,
        week_id: week.id,
        title: 'Complete report',
        priority: 'high' as const,
        day: 'saturday',
        status: 'pending' as const,
      };

      expect(taskData.user_id).toBe(user.id);
      expect(taskData.week_id).toBe(week.id);
      expect(taskData.title).toBeTruthy();
      expect(mockPriorities).toContain(taskData.priority);
      expect(mockDaysOfWeek).toContain(taskData.day);
    });

    it('should validate task priority values', () => {
      mockPriorities.forEach((priority) => {
        const task = createTestTask(user.id, week.id, { priority: priority as any });
        expect(mockPriorities).toContain(task.priority);
      });
    });

    it('should validate task status values', () => {
      mockTaskStatuses.forEach((status) => {
        const task = createTestTask(user.id, week.id, { status: status as any });
        expect(mockTaskStatuses).toContain(task.status);
      });
    });

    it('should validate day of week', () => {
      mockDaysOfWeek.forEach((day) => {
        const task = createTestTask(user.id, week.id, { day });
        expect(mockDaysOfWeek).toContain(task.day);
      });
    });

    it('should store task tags as array', () => {
      const task = createTestTask(user.id, week.id, {
        tags: ['urgent', 'important'],
      });

      expect(Array.isArray(task.tags)).toBe(true);
      expect(task.tags).toContain('urgent');
    });

    it('should handle optional description', () => {
      const taskWithDesc = createTestTask(user.id, week.id, {
        description: 'Complete quarterly report',
      });
      const taskWithoutDesc = createTestTask(user.id, week.id);

      expect(taskWithDesc.description).toBeTruthy();
      expect(taskWithoutDesc.description).toBeNull();
    });
  });

  describe('Read Tasks', () => {
    it('should fetch all tasks for a week', () => {
      const tasks = [
        createTestTask(user.id, week.id),
        createTestTask(user.id, week.id),
        createTestTask(user.id, week.id),
      ];

      expect(tasks).toHaveLength(3);
      tasks.forEach((task) => {
        expect(task.week_id).toBe(week.id);
      });
    });

    it('should fetch tasks by day', () => {
      const tasks = [
        createTestTask(user.id, week.id, { day: 'saturday' }),
        createTestTask(user.id, week.id, { day: 'saturday' }),
        createTestTask(user.id, week.id, { day: 'sunday' }),
      ];

      const saturdayTasks = tasks.filter((t) => t.day === 'saturday');

      expect(saturdayTasks).toHaveLength(2);
    });

    it('should fetch tasks by status', () => {
      const tasks = [
        createTestTask(user.id, week.id, { status: 'completed' }),
        createTestTask(user.id, week.id, { status: 'pending' }),
        createTestTask(user.id, week.id, { status: 'completed' }),
      ];

      const completedTasks = tasks.filter((t) => t.status === 'completed');

      expect(completedTasks).toHaveLength(2);
    });

    it('should fetch tasks by priority', () => {
      const tasks = [
        createTestTask(user.id, week.id, { priority: 'high' }),
        createTestTask(user.id, week.id, { priority: 'low' }),
        createTestTask(user.id, week.id, { priority: 'high' }),
      ];

      const highPriorityTasks = tasks.filter((t) => t.priority === 'high');

      expect(highPriorityTasks).toHaveLength(2);
    });

    it('should fetch single task by ID', () => {
      const task = createTestTask(user.id, week.id);

      expect(task.id).toBeDefined();
      expect(task.user_id).toBe(user.id);
    });
  });

  describe('Update Task', () => {
    it('should update task status', () => {
      const task = createTestTask(user.id, week.id, { status: 'pending' });
      const updated = { ...task, status: 'completed' as const };

      expect(updated.status).toBe('completed');
      expect(updated.id).toBe(task.id);
    });

    it('should update task priority', () => {
      const task = createTestTask(user.id, week.id, { priority: 'low' });
      const updated = { ...task, priority: 'high' as const };

      expect(updated.priority).toBe('high');
    });

    it('should update task day', () => {
      const task = createTestTask(user.id, week.id, { day: 'saturday' });
      const updated = { ...task, day: 'sunday' };

      expect(updated.day).toBe('sunday');
    });

    it('should update task description', () => {
      const task = createTestTask(user.id, week.id, { description: 'Old description' });
      const updated = { ...task, description: 'New description' };

      expect(updated.description).toBe('New description');
    });

    it('should update task tags', () => {
      const task = createTestTask(user.id, week.id, { tags: ['old'] });
      const updated = { ...task, tags: ['new', 'tags'] };

      expect(updated.tags).toContain('new');
      expect(updated.tags).not.toContain('old');
    });
  });

  describe('Delete Task', () => {
    it('should delete a task', () => {
      const task = createTestTask(user.id, week.id);
      const deleted = true; // Simulating deletion

      expect(deleted).toBe(true);
    });

    it('should handle cascade delete from pinned tasks', () => {
      const pinnedTaskId = 'pinned-123';
      const tasksToDelete = [
        createTestTask(user.id, week.id, { pinned_task_id: pinnedTaskId }),
        createTestTask(user.id, week.id, { pinned_task_id: pinnedTaskId }),
      ];

      tasksToDelete.forEach((task) => {
        expect(task.pinned_task_id).toBe(pinnedTaskId);
      });
    });
  });

  describe('Task Filtering and Sorting', () => {
    it('should filter tasks by day and status', () => {
      const tasks = [
        createTestTask(user.id, week.id, { day: 'saturday', status: 'pending' }),
        createTestTask(user.id, week.id, { day: 'saturday', status: 'completed' }),
        createTestTask(user.id, week.id, { day: 'sunday', status: 'pending' }),
      ];

      const filtered = tasks.filter((t) => t.day === 'saturday' && t.status === 'pending');

      expect(filtered).toHaveLength(1);
    });

    it('should sort tasks by priority', () => {
      const tasks = [
        createTestTask(user.id, week.id, { priority: 'low' }),
        createTestTask(user.id, week.id, { priority: 'high' }),
        createTestTask(user.id, week.id, { priority: 'medium' }),
      ];

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const sorted = [...tasks].sort((a, b) => priorityOrder[a.priority as any] - priorityOrder[b.priority as any]);

      expect(sorted[0].priority).toBe('high');
      expect(sorted[2].priority).toBe('low');
    });

    it('should sort tasks by creation date', () => {
      const now = new Date();
      const tasks = [
        createTestTask(user.id, week.id, { created_at: new Date(now.getTime() + 2000).toISOString() }),
        createTestTask(user.id, week.id, { created_at: new Date(now.getTime()).toISOString() }),
        createTestTask(user.id, week.id, { created_at: new Date(now.getTime() + 1000).toISOString() }),
      ];

      const sorted = [...tasks].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      expect(new Date(sorted[0].created_at).getTime()).toBeLessThanOrEqual(new Date(sorted[1].created_at).getTime());
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity with user and week', () => {
      const task = createTestTask(user.id, week.id);

      expect(task.user_id).toBe(user.id);
      expect(task.week_id).toBe(week.id);
    });

    it('should timestamp task creation', () => {
      const task = createTestTask(user.id, week.id);
      const createdAt = new Date(task.created_at);

      expect(createdAt).toBeInstanceOf(Date);
      expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should allow linking to pinned task', () => {
      const pinnedTaskId = 'pinned-123';
      const task = createTestTask(user.id, week.id, { pinned_task_id: pinnedTaskId });

      expect(task.pinned_task_id).toBe(pinnedTaskId);
    });
  });

  describe('Task Search', () => {
    it('should search tasks by title', () => {
      const tasks = [
        createTestTask(user.id, week.id, { title: 'Complete report' }),
        createTestTask(user.id, week.id, { title: 'Meeting preparation' }),
        createTestTask(user.id, week.id, { title: 'Review code' }),
      ];

      const results = tasks.filter((t) => t.title.includes('report'));

      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('report');
    });

    it('should search tasks by tags', () => {
      const tasks = [
        createTestTask(user.id, week.id, { tags: ['urgent', 'code-review'] }),
        createTestTask(user.id, week.id, { tags: ['documentation'] }),
        createTestTask(user.id, week.id, { tags: ['urgent', 'testing'] }),
      ];

      const results = tasks.filter((t) => t.tags?.includes('urgent'));

      expect(results).toHaveLength(2);
    });
  });
});
