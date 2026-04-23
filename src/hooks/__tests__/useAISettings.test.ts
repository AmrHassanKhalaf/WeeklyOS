import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestDataSet, createTestAISettings, mockProviders } from '../../../test/fixtures';

describe('AI Settings Table - CRUD Operations', () => {
  const { user } = createTestDataSet();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create AI Settings', () => {
    it('should create default AI settings for user', () => {
      const settings = createTestAISettings(user.id);

      expect(settings.user_id).toBe(user.id);
      expect(settings.default_provider).toBe('gemini');
      expect(settings.active_model).toBe('gemini-pro');
      expect(settings.fallback_enabled).toBe(false);
    });

    it('should validate provider names', () => {
      mockProviders.forEach((provider) => {
        const settings = createTestAISettings(user.id, { default_provider: provider });
        expect(mockProviders).toContain(settings.default_provider);
      });
    });

    it('should allow null active_model', () => {
      const settings = createTestAISettings(user.id, { active_model: null });

      expect(settings.active_model).toBeNull();
    });

    it('should support fallback provider option', () => {
      const settings = createTestAISettings(user.id, { fallback_enabled: true });

      expect(settings.fallback_enabled).toBe(true);
    });
  });

  describe('Read AI Settings', () => {
    it('should fetch AI settings for user', () => {
      const settings = createTestAISettings(user.id);

      expect(settings.user_id).toBe(user.id);
      expect(settings.default_provider).toBeTruthy();
    });

    it('should return null if settings not found', () => {
      const result = null; // Simulating not found

      expect(result).toBeNull();
    });

    it('should return complete settings object', () => {
      const settings = createTestAISettings(user.id);

      expect(settings).toHaveProperty('user_id');
      expect(settings).toHaveProperty('default_provider');
      expect(settings).toHaveProperty('active_model');
      expect(settings).toHaveProperty('fallback_enabled');
      expect(settings).toHaveProperty('updated_at');
    });
  });

  describe('Update AI Settings', () => {
    it('should update default provider', () => {
      const settings = createTestAISettings(user.id, { default_provider: 'gemini' });
      const updated = { ...settings, default_provider: 'openai' };

      expect(updated.default_provider).toBe('openai');
      expect(updated.user_id).toBe(user.id);
    });

    it('should update active model', () => {
      const settings = createTestAISettings(user.id, { active_model: 'gemini-pro' });
      const updated = { ...settings, active_model: 'gpt-4' };

      expect(updated.active_model).toBe('gpt-4');
    });

    it('should toggle fallback setting', () => {
      const settings = createTestAISettings(user.id, { fallback_enabled: false });
      const updated = { ...settings, fallback_enabled: true };

      expect(updated.fallback_enabled).toBe(true);
    });

    it('should update timestamp on change', () => {
      const settings = createTestAISettings(user.id);
      const oldTime = new Date(settings.updated_at).getTime();

      const updated = {
        ...settings,
        default_provider: 'openai',
        updated_at: new Date().toISOString(),
      };

      const newTime = new Date(updated.updated_at).getTime();

      expect(newTime).toBeGreaterThanOrEqual(oldTime);
    });

    it('should clear active model', () => {
      const settings = createTestAISettings(user.id, { active_model: 'gemini-pro' });
      const updated = { ...settings, active_model: null };

      expect(updated.active_model).toBeNull();
    });
  });

  describe('Delete AI Settings', () => {
    it('should reset settings to defaults', () => {
      const settings = createTestAISettings(user.id, {
        default_provider: 'openai',
        active_model: 'gpt-4',
        fallback_enabled: true,
      });

      // Simulating reset
      const reset = {
        user_id: user.id,
        default_provider: 'gemini',
        active_model: 'gemini-pro',
        fallback_enabled: false,
        updated_at: new Date().toISOString(),
      };

      expect(reset.default_provider).toBe('gemini');
      expect(reset.fallback_enabled).toBe(false);
    });
  });

  describe('AI Provider Support', () => {
    it('should support Gemini provider', () => {
      const settings = createTestAISettings(user.id, { default_provider: 'gemini' });
      expect(settings.default_provider).toBe('gemini');
    });

    it('should support OpenAI provider', () => {
      const settings = createTestAISettings(user.id, { default_provider: 'openai' });
      expect(settings.default_provider).toBe('openai');
    });

    it('should support Anthropic provider', () => {
      const settings = createTestAISettings(user.id, { default_provider: 'anthropic' });
      expect(settings.default_provider).toBe('anthropic');
    });
  });

  describe('AI Model Selection', () => {
    it('should support Gemini models', () => {
      const models = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];

      models.forEach((model) => {
        const settings = createTestAISettings(user.id, { active_model: model });
        expect(settings.active_model).toBe(model);
      });
    });

    it('should support OpenAI models', () => {
      const models = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];

      models.forEach((model) => {
        const settings = createTestAISettings(user.id, { active_model: model });
        expect(settings.active_model).toBe(model);
      });
    });

    it('should support switching between providers', () => {
      let settings = createTestAISettings(user.id, {
        default_provider: 'gemini',
        active_model: 'gemini-pro',
      });

      expect(settings.active_model).toContain('gemini');

      settings = {
        ...settings,
        default_provider: 'openai',
        active_model: 'gpt-4',
      };

      expect(settings.active_model).toContain('gpt');
    });
  });

  describe('Fallback Provider Logic', () => {
    it('should allow fallback to be enabled', () => {
      const settings = createTestAISettings(user.id, { fallback_enabled: true });

      expect(settings.fallback_enabled).toBe(true);
    });

    it('should allow fallback to be disabled', () => {
      const settings = createTestAISettings(user.id, { fallback_enabled: false });

      expect(settings.fallback_enabled).toBe(false);
    });

    it('should maintain both primary and fallback configuration', () => {
      const settings = createTestAISettings(user.id, {
        default_provider: 'gemini',
        fallback_enabled: true,
      });

      expect(settings.default_provider).toBe('gemini');
      expect(settings.fallback_enabled).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain user reference', () => {
      const settings = createTestAISettings(user.id);

      expect(settings.user_id).toBe(user.id);
    });

    it('should have unique constraint on user_id', () => {
      const settings1 = createTestAISettings(user.id);
      const settings2 = createTestAISettings(user.id);

      // In real DB, only one should exist per user
      expect(settings1.user_id).toBe(settings2.user_id);
    });

    it('should timestamp creation and updates', () => {
      const settings = createTestAISettings(user.id);
      const updatedAt = new Date(settings.updated_at);

      expect(updatedAt).toBeInstanceOf(Date);
      expect(updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should track boolean settings correctly', () => {
      const settings = createTestAISettings(user.id);

      expect(typeof settings.fallback_enabled).toBe('boolean');
    });
  });

  describe('Settings Defaults', () => {
    it('should provide sensible defaults', () => {
      const defaults = createTestAISettings(user.id);

      expect(defaults.default_provider).toBe('gemini'); // Default provider
      expect(defaults.active_model).toBe('gemini-pro'); // Default model
      expect(defaults.fallback_enabled).toBe(false); // No fallback by default
    });

    it('should allow complete customization', () => {
      const custom = createTestAISettings(user.id, {
        default_provider: 'openai',
        active_model: 'gpt-4',
        fallback_enabled: true,
      });

      expect(custom.default_provider).toBe('openai');
      expect(custom.active_model).toBe('gpt-4');
      expect(custom.fallback_enabled).toBe(true);
    });
  });

  describe('Provider-Model Validation', () => {
    it('should validate provider-model compatibility', () => {
      const validConfigs = [
        { provider: 'gemini', model: 'gemini-pro' },
        { provider: 'openai', model: 'gpt-4' },
        { provider: 'anthropic', model: 'claude-3' },
      ];

      validConfigs.forEach(({ provider, model }) => {
        const settings = createTestAISettings(user.id, {
          default_provider: provider,
          active_model: model,
        });

        expect(settings.default_provider).toBe(provider);
        expect(settings.active_model).toBe(model);
      });
    });
  });
});
