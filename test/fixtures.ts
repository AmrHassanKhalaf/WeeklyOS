import crypto from 'crypto';

// Helper function to generate UUIDs
const generateUUID = (): string => {
  return crypto.randomUUID();
};

// ─── Type definitions for test data ────────────────────────────────────────

export interface TestUser {
  id: string;
  email: string;
  created_at: string;
}

export interface TestWeek {
  id: string;
  user_id: string;
  week_number: number;
  year: number;
  score: number | null;
  activities: number | null;
  created_at: string;
}

export interface TestTask {
  id: string;
  user_id: string;
  week_id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  day: string;
  status: 'pending' | 'in_progress' | 'completed';
  tags: string[] | null;
  pinned_task_id: string | null;
  created_at: string;
}

export interface TestBrainDump {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  status: 'pending' | 'converted' | 'archived';
  created_at: string;
}

export interface TestPinnedTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  tags: string[] | null;
  is_active: boolean;
  until_date: string | null;
  created_at: string;
}

export interface TestUserSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  week_start_day: string;
  auto_download_completed_week_report: boolean;
  updated_at: string;
}

export interface TestAISettings {
  user_id: string;
  default_provider: string | null;
  active_model: string | null;
  fallback_enabled: boolean;
  updated_at: string;
}

export interface TestAIKey {
  id: string;
  user_id: string;
  provider: string;
  api_key: string;
  vault_secret_id: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Fixture factories ─────────────────────────────────────────────────────

export const createTestUser = (overrides?: Partial<TestUser>): TestUser => ({
  id: generateUUID(),
  email: `test${Date.now()}@example.com`,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createTestWeek = (
  userId: string,
  overrides?: Partial<TestWeek>
): TestWeek => ({
  id: generateUUID(),
  user_id: userId,
  week_number: Math.floor(Math.random() * 52) + 1,
  year: 2026,
  score: null,
  activities: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createTestTask = (
  userId: string,
  weekId: string,
  overrides?: Partial<TestTask>
): TestTask => ({
  id: generateUUID(),
  user_id: userId,
  week_id: weekId,
  title: `Test Task ${Date.now()}`,
  description: null,
  priority: 'medium',
  day: 'saturday',
  status: 'pending',
  tags: null,
  pinned_task_id: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createTestBrainDump = (
  userId: string,
  overrides?: Partial<TestBrainDump>
): TestBrainDump => ({
  id: generateUUID(),
  user_id: userId,
  title: `Brain Dump ${Date.now()}`,
  description: null,
  tags: null,
  status: 'pending',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createTestPinnedTask = (
  userId: string,
  overrides?: Partial<TestPinnedTask>
): TestPinnedTask => ({
  id: generateUUID(),
  user_id: userId,
  title: `Pinned Task ${Date.now()}`,
  description: null,
  priority: 'medium',
  day_of_week: 'saturday',
  start_time: null,
  end_time: null,
  tags: null,
  is_active: true,
  until_date: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createTestUserSettings = (
  userId: string,
  overrides?: Partial<TestUserSettings>
): TestUserSettings => ({
  user_id: userId,
  theme: 'system',
  timezone: 'Africa/Cairo',
  week_start_day: 'saturday',
  auto_download_completed_week_report: false,
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createTestAISettings = (
  userId: string,
  overrides?: Partial<TestAISettings>
): TestAISettings => ({
  user_id: userId,
  default_provider: 'gemini',
  active_model: 'gemini-pro',
  fallback_enabled: false,
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createTestAIKey = (
  userId: string,
  overrides?: Partial<TestAIKey>
): TestAIKey => ({
  id: generateUUID(),
  user_id: userId,
  provider: 'gemini',
  api_key: `test-key-${Date.now()}`,
  vault_secret_id: null,
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

// ─── Bulk fixtures ────────────────────────────────────────────────────────

export const createTestDataSet = () => {
  const user = createTestUser();
  const week = createTestWeek(user.id);
  const task = createTestTask(user.id, week.id);
  const brainDump = createTestBrainDump(user.id);
  const pinnedTask = createTestPinnedTask(user.id);
  const userSettings = createTestUserSettings(user.id);
  const aiSettings = createTestAISettings(user.id);
  const aiKey = createTestAIKey(user.id);

  return {
    user,
    week,
    task,
    brainDump,
    pinnedTask,
    userSettings,
    aiSettings,
    aiKey,
  };
};

// ─── Mock data for commonly used values ────────────────────────────────────

export const mockDaysOfWeek = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
];

export const mockPriorities = ['high', 'medium', 'low'];

export const mockTaskStatuses = ['pending', 'in_progress', 'completed'];

export const mockBrainDumpStatuses = ['pending', 'converted', 'archived'];

export const mockThemes = ['light', 'dark', 'system'];

export const mockProviders = ['gemini', 'openai', 'anthropic'];
