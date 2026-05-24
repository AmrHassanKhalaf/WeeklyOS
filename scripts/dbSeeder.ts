import crypto from 'crypto';

/**
 * Database Seeder - Generate test data for database population
 * Use this to fill the database with realistic test data
 */

export interface SeederOptions {
  userCount?: number;
  weeksPerUser?: number;
  tasksPerWeek?: number;
  brainDumpsPerUser?: number;
  pinnedTasksPerUser?: number;
}

export const defaultOptions: SeederOptions = {
  userCount: 1,
  weeksPerUser: 5,
  tasksPerWeek: 10,
  brainDumpsPerUser: 5,
  pinnedTasksPerUser: 5,
};

/**
 * Generate random UUID
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate random email
 */
function generateEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate random priority
 */
function randomPriority(): 'high' | 'medium' | 'low' {
  const priorities = ['high', 'medium', 'low'] as const;
  return priorities[Math.floor(Math.random() * priorities.length)];
}

/**
 * Generate random day of week
 */
function randomDay(): string {
  const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  return days[Math.floor(Math.random() * days.length)];
}

/**
 * Generate random task status
 */
function randomTaskStatus(): 'pending' | 'in_progress' | 'completed' {
  const statuses = ['pending', 'in_progress', 'completed'] as const;
  return statuses[Math.floor(Math.random() * statuses.length)];
}

/**
 * Generate random tags
 */
function randomTags(): string[] {
  const allTags = ['urgent', 'important', 'bug', 'feature', 'refactor', 'documentation', 'testing', 'review'];
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...allTags].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Generate seed data for a user
 */
export function generateUserData(options: SeederOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  const users = [];
  for (let u = 0; u < (opts.userCount || 1); u++) {
    const userId = generateId();
    users.push({
      id: userId,
      email: generateEmail(),
      created_at: new Date().toISOString(),
    });

    // Generate weeks for this user
    const weeks = [];
    for (let w = 0; w < (opts.weeksPerUser || 5); w++) {
      const weekId = generateId();
      weeks.push({
        id: weekId,
        user_id: userId,
        week_number: w + 1,
        year: 2026,
        score: Math.random() * 100,
        activities: Math.floor(Math.random() * 20),
        created_at: new Date().toISOString(),
      });

      // Generate tasks for this week
      for (let t = 0; t < (opts.tasksPerWeek || 10); t++) {
        // Task will be stored separately
      }
    }

    // Generate brain dumps for this user
    for (let b = 0; b < (opts.brainDumpsPerUser || 5); b++) {
      // Brain dump will be stored separately
    }

    // Generate pinned tasks for this user
    for (let p = 0; p < (opts.pinnedTasksPerUser || 5); p++) {
      // Pinned task will be stored separately
    }
  }

  return users;
}

/**
 * Generate tasks for a specific week
 */
export function generateWeekTasks(userId: string, weekId: string, count: number = 10) {
  const tasks = [];

  for (let i = 0; i < count; i++) {
    tasks.push({
      id: generateId(),
      user_id: userId,
      week_id: weekId,
      title: `Task ${i + 1}`,
      description: `Description for task ${i + 1}`,
      priority: randomPriority(),
      day: randomDay(),
      status: randomTaskStatus(),
      tags: randomTags(),
      pinned_task_id: null,
      created_at: new Date().toISOString(),
    });
  }

  return tasks;
}

/**
 * Generate brain dump entries
 */
export function generateBrainDumps(userId: string, count: number = 5) {
  const dumps = [];

  for (let i = 0; i < count; i++) {
    dumps.push({
      id: generateId(),
      user_id: userId,
      title: `Brain Dump ${i + 1}`,
      description: `Description for brain dump ${i + 1}`,
      tags: randomTags(),
      status: randomTaskStatus(),
      created_at: new Date().toISOString(),
    });
  }

  return dumps;
}

/**
 * Generate pinned tasks
 */
export function generatePinnedTasks(userId: string, count: number = 5) {
  const tasks = [];

  for (let i = 0; i < count; i++) {
    tasks.push({
      id: generateId(),
      user_id: userId,
      title: `Pinned Task ${i + 1}`,
      description: `Description for pinned task ${i + 1}`,
      priority: randomPriority(),
      day_of_week: randomDay(),
      start_time: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:00`,
      end_time: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:00`,
      tags: randomTags(),
      is_active: Math.random() > 0.3,
      until_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    });
  }

  return tasks;
}

/**
 * Generate complete dataset (for testing/seeding)
 */
export function generateCompleteDataset(options: SeederOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  const users = [];
  const weeks = [];
  const tasks = [];
  const brainDumps = [];
  const pinnedTasks = [];

  for (let u = 0; u < (opts.userCount || 1); u++) {
    const userId = generateId();
    users.push({
      id: userId,
      email: generateEmail(),
      created_at: new Date().toISOString(),
    });

    // Generate weeks
    for (let w = 0; w < (opts.weeksPerUser || 5); w++) {
      const weekId = generateId();
      weeks.push({
        id: weekId,
        user_id: userId,
        week_number: w + 1,
        year: 2026,
        score: Math.random() * 100,
        activities: Math.floor(Math.random() * 20),
        created_at: new Date().toISOString(),
      });

      // Generate tasks
      const weekTasks = generateWeekTasks(userId, weekId, opts.tasksPerWeek || 10);
      tasks.push(...weekTasks);
    }

    // Generate brain dumps
    const userBrainDumps = generateBrainDumps(userId, opts.brainDumpsPerUser || 5);
    brainDumps.push(...userBrainDumps);

    // Generate pinned tasks
    const userPinnedTasks = generatePinnedTasks(userId, opts.pinnedTasksPerUser || 5);
    pinnedTasks.push(...userPinnedTasks);
  }

  return {
    users,
    weeks,
    tasks,
    brainDumps,
    pinnedTasks,
    stats: {
      totalUsers: users.length,
      totalWeeks: weeks.length,
      totalTasks: tasks.length,
      totalBrainDumps: brainDumps.length,
      totalPinnedTasks: pinnedTasks.length,
    },
  };
}

/**
 * Export seed data to JSON format
 */
export function exportToJSON(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Print seed statistics
 */
export function printStats(dataset: ReturnType<typeof generateCompleteDataset>): void {
  console.log('\n📊 Seed Data Statistics:');
  console.log(`  Users: ${dataset.stats.totalUsers}`);
  console.log(`  Weeks: ${dataset.stats.totalWeeks}`);
  console.log(`  Tasks: ${dataset.stats.totalTasks}`);
  console.log(`  Brain Dumps: ${dataset.stats.totalBrainDumps}`);
  console.log(`  Pinned Tasks: ${dataset.stats.totalPinnedTasks}`);
  console.log('');
}
