import { describe, it, expect, vi, type MockedObject, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import SidepanelApp from './SidepanelApp.vue';
import { sendMessage, removeMessageListeners } from '@/entrypoints/background/messaging';
import type { LanguageService } from '@/entrypoints/background/language/language.service';
import type { AIService } from '@/entrypoints/background/ai/ai.service';
import vuetify from '@/plugins/vuetify';

vi.mock('@/entrypoints/background/ai/ai.service', () => ({
  getAIService: vi.fn(() => mockAIService),
}));

vi.mock('@/entrypoints/background/language/language.service', () => ({
  LanguageService: {
    getInstance: vi.fn(() => mockLanguageService),
  },
}));

const mockSupportedLanguages = ['de', 'it', 'ru', 'zh', 'ja'] as const;
const mockLanguageService: MockedObject<Pick<LanguageService, 'getSupportedLanguages' | 'getBrowserLanguage' | 'isLanguageSupported' | 'getLanguageKey'>> = {
  getSupportedLanguages: vi.fn(() => mockSupportedLanguages as any),
  getBrowserLanguage: vi.fn(() => 'zh'),
  isLanguageSupported: vi.fn(() => true),
  getLanguageKey: vi.fn((code: string) => `lang_${code}`),
};
const mockAIService: MockedObject<Pick<AIService, 'processText' | 'detectLanguage' | 'checkAPIAvailability' | 'cancelProcessing'>> = {
  processText: vi.fn(() => Promise.resolve('Texto procesado')),
  detectLanguage: vi.fn(() => Promise.resolve('it')),
  checkAPIAvailability: vi.fn(() => Promise.resolve(true)),
  cancelProcessing: vi.fn(),
};

describe('SidepanelApp', () => {
  afterEach(() => {
    vi.clearAllMocks();
    removeMessageListeners();
  });

  const mountComponent = () => {
    return mount(SidepanelApp, {
      global: {
        plugins: [vuetify],
      },
    });
  };

  it('should render initial state', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('#input-text').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ProcessControls' }).exists()).toBe(true);
  });

  it('should handle selected text from context menu', async () => {
    mountComponent();
    await sendMessage('selectedText', { text: 'Hello', summarize: true });
    await flushPromises();
    expect(mockAIService.processText).toHaveBeenCalled();
  });

  it('should display detected language', async () => {
    const wrapper = mountComponent();
    await wrapper.find('#input-text').setValue('This is a test');
    await flushPromises();
    expect(wrapper.text()).toContain('lang_it');
  });

  it('should show warning for same languages', async () => {
    const wrapper = mountComponent();
    await wrapper.find('#input-text').setValue('Un testo in italiano');
    await flushPromises(); // detect language
    const controls = wrapper.findComponent({ name: 'ProcessControls' });
    await controls.vm.$emit('update:targetLanguage', 'it');
    await controls.vm.$emit('process');
    await flushPromises();
    expect(wrapper.find('.v-alert').text()).toContain('sameLanguageWarning');
  });

  it('should show error on processing failure', async () => {
    mockAIService.processText.mockRejectedValue(new Error('Failure'));
    const wrapper = mountComponent();
    await wrapper.find('#input-text').setValue('Some text');
    await flushPromises();
    await wrapper.findComponent({ name: 'ProcessControls' }).vm.$emit('process');
    await flushPromises();
    expect(wrapper.find('.v-alert').text()).toContain('processingError');
  });

  it('should display model download card when status is downloading', async () => {
    const wrapper = mountComponent();
    await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 50 });
    await nextTick();
    expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(true);
  });
});
