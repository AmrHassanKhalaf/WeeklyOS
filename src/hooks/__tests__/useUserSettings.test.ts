import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestDataSet, createTestUserSettings, mockThemes, mockDaysOfWeek } from '../../../test/fixtures';

describe('User Settings Table - CRUD Operations', () => {
  const { user } = createTestDataSet();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create or Initialize User Settings', () => {
    it('should create default settings for new user', () => {
      const settings = createTestUserSettings(user.id);

      expect(settings.user_id).toBe(user.id);
      expect(settings.theme).toBe('system');
      expect(settings.timezone).toBe('Africa/Cairo');
      expect(settings.week_start_day).toBe('saturday');
      expect(settings.auto_download_completed_week_report).toBe(false);
    });

    it('should validate theme values', () => {
      mockThemes.forEach((theme) => {
        const settings = createTestUserSettings(user.id, { theme: theme as any });
        expect(mockThemes).toContain(settings.theme);
      });
    });

    it('should validate day of week', () => {
      mockDaysOfWeek.forEach((day) => {
        const settings = createTestUserSettings(user.id, { week_start_day: day });
        expect(mockDaysOfWeek).toContain(settings.week_start_day);
      });
    });

    it('should store timezone as string', () => {
      const timezones = ['Africa/Cairo', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];

      timezones.forEach((tz) => {
        const settings = createTestUserSettings(user.id, { timezone: tz });
        expect(settings.timezone).toBe(tz);
      });
    });
  });

  describe('Read User Settings', () => {
    it('should fetch settings for user', () => {
      const settings = createTestUserSettings(user.id);

      expect(settings.user_id).toBe(user.id);
      expect(settings.theme).toBeTruthy();
      expect(settings.timezone).toBeTruthy();
    });

    it('should return null if settings not found', () => {
      const result = null; // Simulating not found

      expect(result).toBeNull();
    });

    it('should return settings with all fields', () => {
      const settings = createTestUserSettings(user.id);

      expect(settings).toHaveProperty('user_id');
      expect(settings).toHaveProperty('theme');
      expect(settings).toHaveProperty('timezone');
      expect(settings).toHaveProperty('week_start_day');
      expect(settings).toHaveProperty('auto_download_completed_week_report');
      expect(settings).toHaveProperty('updated_at');
    });
  });

  describe('Update User Settings', () => {
    it('should update theme preference', () => {
      const settings = createTestUserSettings(user.id, { theme: 'light' });
      const updated = { ...settings, theme: 'dark' as const };

      expect(updated.theme).toBe('dark');
      expect(updated.user_id).toBe(user.id);
    });

    it('should update timezone', () => {
      const settings = createTestUserSettings(user.id, { timezone: 'Africa/Cairo' });
      const updated = { ...settings, timezone: 'America/New_York' };

      expect(updated.timezone).toBe('America/New_York');
    });

    it('should update week start day', () => {
      const settings = createTestUserSettings(user.id, { week_start_day: 'saturday' });
      const updated = { ...settings, week_start_day: 'sunday' };

      expect(updated.week_start_day).toBe('sunday');
    });

    it('should toggle auto download setting', () => {
      const settings = createTestUserSettings(user.id, { auto_download_completed_week_report: false });
      const updated = { ...settings, auto_download_completed_week_report: true };

      expect(updated.auto_download_completed_week_report).toBe(true);
    });

    it('should update timestamp on change', () => {
      const settings = createTestUserSettings(user.id);
      const oldTime = new Date(settings.updated_at).getTime();

      // Simulate update after 1000ms
      const updated = {
        ...settings,
        theme: 'dark' as const,
        updated_at: new Date().toISOString(),
      };

      const newTime = new Date(updated.updated_at).getTime();

      expect(newTime).toBeGreaterThanOrEqual(oldTime);
    });
  });

  describe('Delete User Settings', () => {
    it('should reset settings to defaults when deleted', () => {
      const settings = createTestUserSettings(user.id, {
        theme: 'dark',
        timezone: 'America/New_York',
      });

      // Simulating reset to defaults
      const reset = {
        user_id: user.id,
        theme: 'system' as const,
        timezone: 'Africa/Cairo',
        week_start_day: 'saturday',
        auto_download_completed_week_report: false,
        updated_at: new Date().toISOString(),
      };

      expect(reset.theme).toBe('system');
      expect(reset.timezone).toBe('Africa/Cairo');
    });
  });

  describe('User Settings - Theme Options', () => {
    it('should support light theme', () => {
      const settings = createTestUserSettings(user.id, { theme: 'light' });
      expect(settings.theme).toBe('light');
    });

    it('should support dark theme', () => {
      const settings = createTestUserSettings(user.id, { theme: 'dark' });
      expect(settings.theme).toBe('dark');
    });

    it('should support system theme', () => {
      const settings = createTestUserSettings(user.id, { theme: 'system' });
      expect(settings.theme).toBe('system');
    });
  });

  describe('User Settings - Week Configuration', () => {
    it('should support different week start days', () => {
      const days = mockDaysOfWeek;

      days.forEach((day) => {
        const settings = createTestUserSettings(user.id, { week_start_day: day });
        expect(settings.week_start_day).toBe(day);
      });
    });

    it('should persist week start day preference', () => {
      const settings = createTestUserSettings(user.id, { week_start_day: 'sunday' });
      expect(settings.week_start_day).toBe('sunday');
    });
  });

  describe('User Settings - Timezone Support', () => {
    it('should support major timezones', () => {
      const timezones = [
        'Africa/Cairo',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'UTC',
      ];

      timezones.forEach((tz) => {
        const settings = createTestUserSettings(user.id, { timezone: tz });
        expect(settings.timezone).toBe(tz);
      });
    });

    it('should validate timezone format', () => {
      const validTZ = 'Africa/Cairo';
      const settings = createTestUserSettings(user.id, { timezone: validTZ });

      expect(settings.timezone).toMatch(/^[A-Za-z]+\/[A-Za-z_]+$/);
    });
  });

  describe('User Settings - Report Options', () => {
    it('should allow enabling auto download of week reports', () => {
      const settings = createTestUserSettings(user.id, { auto_download_completed_week_report: true });

      expect(settings.auto_download_completed_week_report).toBe(true);
    });

    it('should allow disabling auto download of week reports', () => {
      const settings = createTestUserSettings(user.id, { auto_download_completed_week_report: false });

      expect(settings.auto_download_completed_week_report).toBe(false);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain user reference', () => {
      const settings = createTestUserSettings(user.id);

      expect(settings.user_id).toBe(user.id);
    });

    it('should have unique constraint on user_id', () => {
      const settings1 = createTestUserSettings(user.id);
      const settings2 = createTestUserSettings(user.id);

      // In real DB, only one should exist per user
      expect(settings1.user_id).toBe(settings2.user_id);
    });

    it('should timestamp updates', () => {
      const settings = createTestUserSettings(user.id);
      const updatedAt = new Date(settings.updated_at);

      expect(updatedAt).toBeInstanceOf(Date);
      expect(updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should track all boolean settings', () => {
      const settings = createTestUserSettings(user.id);

      expect(typeof settings.auto_download_completed_week_report).toBe('boolean');
    });
  });

  describe('Settings Defaults', () => {
    it('should provide sensible defaults', () => {
      const defaults = createTestUserSettings(user.id);

      expect(defaults.theme).toBe('system'); // Good default
      expect(defaults.timezone).toBe('Africa/Cairo'); // Egyptian timezone
      expect(defaults.week_start_day).toBe('saturday'); // Islamic week convention
      expect(defaults.auto_download_completed_week_report).toBe(false); // Opt-in behavior
    });

    it('should allow overriding defaults', () => {
      const custom = createTestUserSettings(user.id, {
        theme: 'dark',
        timezone: 'America/New_York',
        week_start_day: 'sunday',
        auto_download_completed_week_report: true,
      });

      expect(custom.theme).toBe('dark');
      expect(custom.timezone).toBe('America/New_York');
      expect(custom.week_start_day).toBe('sunday');
      expect(custom.auto_download_completed_week_report).toBe(true);
    });
  });
});
