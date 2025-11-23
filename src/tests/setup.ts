import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import vuetify from '@/plugins/vuetify';
import ModelDownloadCard from '@/components/ModelDownloadCard.vue';
import ProcessControls from '@/components/ProcessControls.vue';
import { t } from '@/utils/i18n';

// Mock the global browser API for i18n
vi.stubGlobal('browser', {
  i18n: {
    getMessage: (key: string) => key,
  },
});

// Configure vue-test-utils globally
config.global.plugins = [vuetify];
config.global.components = {
  ModelDownloadCard,
  ProcessControls,
};
config.global.mocks = { t };

// Mock the messaging system to handle messages correctly in tests
vi.mock('@/entrypoints/background/messaging', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entrypoints/background/messaging')>();
  const listeners: Map<string, Function> = new Map();

  return {
    ...actual,
    onMessage: (message: string, callback: Function) => {
      listeners.set(message, callback);
      return () => listeners.delete(message);
    },
    sendMessage: (message: string, data: any) => {
      const listener = listeners.get(message);
      if (listener) {
        return Promise.resolve(listener({ data }));
      }
      return Promise.resolve();
    },
    removeMessageListeners: () => {
      listeners.clear();
    },
  };
});
