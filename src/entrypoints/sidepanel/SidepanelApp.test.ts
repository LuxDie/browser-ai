import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SidepanelApp from './SidepanelApp.vue';
import { getAIService } from '@/entrypoints/background/ai/ai.service';
import { sendMessage } from '@/entrypoints/background/messaging';


// Mock AIService
vi.mock('@/entrypoints/background/ai/ai.service', () => ({
  getAIService: vi.fn(() => ({
    processText: vi.fn(),
    detectLanguage: vi.fn(),
  })),
  registerAIService: vi.fn(), // Add this line
}));

// Mock messaging system
vi.mock('@/entrypoints/background/messaging');

// Mock browser.i18n
vi.stubGlobal('browser', {
  i18n: {
    getMessage: vi.fn((key: string) => key),
  },
});

const mockedAIService = getAIService();

const mockedSendMessage = vi.mocked(sendMessage);

describe('SidepanelApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the mock for AIService methods to return a pending promise
    (mockedAIService.detectLanguage as vi.Mock).mockImplementation(() => {
      return new Promise<string>(() => {}); // Keep it pending
    });

    (mockedAIService.processText as vi.Mock).mockImplementation(() => {
      return new Promise<string>(() => {}); // Keep it pending
    });

    mockedSendMessage.mockResolvedValue(undefined); // Mock any sendMessage calls
    mockedSendMessage.mockImplementation((name) => {
      if (name === 'getAvailableLanguages') {
        return Promise.resolve(['en', 'es']);
      }
      if (name === 'getBrowserLanguage') {
        return Promise.resolve('en');
      }
      return Promise.resolve(undefined);
    });
  });

  it('should mount successfully', () => {
    const wrapper = mount(SidepanelApp);
    expect(wrapper.exists()).toBe(true);
  });

  it('should call detectLanguage when text is changed', async () => {
    const wrapper = mount(SidepanelApp);

    // First, let's check if the mock is being called at all
    expect(mockedAIService.detectLanguage).toHaveBeenCalledTimes(0);

    // Simulate user input by finding the textarea and setting its value
    // Text must be >= 15 characters to trigger detection
    const textarea = wrapper.find('textarea#input-text');
    expect(textarea.exists()).toBe(true);
    
    await textarea.setValue('This is a very long text to trigger language detection.');
    
    // Wait for Vue reactivity and watcher to trigger
    await new Promise(resolve => setTimeout(resolve, 0));
    await nextTick();
    await nextTick();

    expect(mockedAIService.detectLanguage).toHaveBeenCalledTimes(1);
  });
});
