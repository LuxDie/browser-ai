import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SidepanelApp from './SidepanelApp.vue';
import { sendMessage } from '@/entrypoints/background/messaging';
import vuetify from '@/plugins/vuetify';


const { mockAIServiceInstance } = vi.hoisted(() => ({
  mockAIServiceInstance: {
    processText: vi.fn(),
    detectLanguage: vi.fn(),
    checkAPIAvailability: vi.fn(),
  },
}));

// Mock AIService
vi.mock('@/entrypoints/background/ai/ai.service', () => ({
  getAIService: vi.fn(() => mockAIServiceInstance),
  registerAIService: vi.fn(),
}));

// Mock messaging system
vi.mock('@/entrypoints/background/messaging');

// Mock browser.i18n
vi.stubGlobal('browser', {
  i18n: {
    getMessage: vi.fn((key: string) => key),
  },
});

const mockedAIService = mockAIServiceInstance;

const mockedSendMessage = vi.mocked(sendMessage);

describe('SidepanelApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the mock for AIService methods to return a pending promise
    (mockedAIService.detectLanguage as Mock).mockImplementation(() => {
      return new Promise<string>(() => { }); // Keep it pending
    });

    (mockedAIService.processText as Mock).mockImplementation(() => {
      return new Promise<string>(() => { }); // Keep it pending
    });

    mockedSendMessage.mockResolvedValue(undefined); // Mock any sendMessage calls
    mockedSendMessage.mockImplementation((name) => {
      if (name === 'getAvailableLanguages') {
        return Promise.resolve(['en', 'es'] as any);
      }
      if (name === 'getBrowserLanguage') {
        return Promise.resolve('en');
      }
      return Promise.resolve(undefined);
    });
  });

  it('should mount successfully', () => {
    const wrapper = mount(SidepanelApp, {
      global: {
        plugins: [vuetify],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should have a textarea for text input and call detectLanguage when text is changed', async () => {
    const wrapper = mount(SidepanelApp, {
      global: {
        plugins: [vuetify],
      },
    });

    // Check that the textarea exists
    const textarea = wrapper.find('textarea#input-text');
    expect(textarea.exists()).toBe(true);

    // First, let's check if the mock is being called at all
    expect(mockedAIService.detectLanguage).toHaveBeenCalledTimes(0);

    await textarea.setValue('This is a very long text to trigger language detection.');

    // Wait for Vue reactivity and watcher to trigger
    await new Promise(resolve => setTimeout(resolve, 0));
    await nextTick();
    await nextTick();

    expect(mockedAIService.detectLanguage).toHaveBeenCalledTimes(1);
  });
});