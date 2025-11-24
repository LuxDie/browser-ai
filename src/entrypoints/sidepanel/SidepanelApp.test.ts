import { describe, it, expect, vi, type MockedObject, afterEach, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import SidepanelApp from './SidepanelApp.vue';
import { sendMessage, onMessage, removeMessageListeners } from '@/entrypoints/background/messaging';
import type { LanguageService, SupportedLanguageCode } from '@/entrypoints/background/language/language.service';
import type { AIService } from '@/entrypoints/background/ai/ai.service';
import { VBtn, VTextarea, VSelect, VCheckbox, VAlert } from 'vuetify/components';

vi.mock('@/entrypoints/background/ai/ai.service', () => ({
  getAIService: () => mockAIService,
  registerAIService: vi.fn(),
}));

vi.mock('@/entrypoints/background/language/language.service', () => ({
  LanguageService: {
    getInstance: vi.fn(() => mockLanguageService),
  },
}));

const mockSupportedLanguages = ['de', 'it', 'ru', 'zh', 'ja'] as const;
const mockSummarizerLanguages = ['de', 'it', 'ru'] as const;
const mockLanguageService: MockedObject<Pick<LanguageService, 'getSupportedLanguages' | 'getSummarizerLanguageCodes' | 'getBrowserLanguage' | 'isLanguageSupported' | 'getLanguageKey'>> = {
  getSupportedLanguages: vi.fn(() => mockSupportedLanguages as any),
  getSummarizerLanguageCodes: vi.fn(() => mockSummarizerLanguages as any),
  getBrowserLanguage: vi.fn(() => 'zh'),
  isLanguageSupported: vi.fn(() => true) as any,
  getLanguageKey: vi.fn((code: SupportedLanguageCode) => `lang_${code}`) as any,
};
const mockAIService: MockedObject<
  Pick<
    AIService,
    'processText' | 'detectLanguage' | 'checkAPIAvailability' | 'cancelProcessing' | 'proofread' | 'rewrite' | 'write' | 'prompt'
  >
> = {
  processText: vi.fn(() => Promise.resolve('Texto procesado')),
  detectLanguage: vi.fn(() => Promise.resolve(DEFAULT_DETECTED_LANGUAGE)),
  checkAPIAvailability: vi.fn(() => Promise.resolve(true)) as any,
  cancelProcessing: vi.fn(),
  proofread: vi.fn(() => Promise.resolve('Texto corregido')),
  rewrite: vi.fn(() => Promise.resolve('Texto reescrito')),
  write: vi.fn(() => Promise.resolve('Texto escrito')),
  prompt: vi.fn(() => Promise.resolve('Texto de prompt')),
};

const DEFAULT_DETECTED_LANGUAGE = 'it';

const sidepanelReadySpy = vi.fn();

describe('SidepanelApp', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    onMessage('sidepanelReady', sidepanelReadySpy);
  });

  afterEach(() => {
    vi.clearAllMocks();
    removeMessageListeners();
  });

  it('should render the initial state correctly', () => {
    const wrapper = mount(SidepanelApp);
    const textarea = wrapper.findComponent(VTextarea);

    expect(textarea.exists()).toBe(true);
    expect(textarea.props('modelValue')).toBe('');
    expect(wrapper.findComponent({ name: 'ToolSelector' }).exists()).toBe(true);
  });

  it('should check API availability on initialization', () => {
    mount(SidepanelApp);
    expect(mockAIService.checkAPIAvailability).toHaveBeenCalled();
  });

  it('should send sidepanelReady message after initialization', async () => {
    mount(SidepanelApp);
    await flushPromises();
    expect(sidepanelReadySpy).toHaveBeenCalled();
  });

  it('should show detected language after text input', async () => {
    const detectedLanguage = 'iw';
    mockAIService.detectLanguage.mockResolvedValue(detectedLanguage as SupportedLanguageCode);
    mockLanguageService.getLanguageKey.mockReturnValue(`lang_${detectedLanguage}`);

    const wrapper = mount(SidepanelApp);
    const textarea = wrapper.findComponent(VTextarea);

    await textarea.setValue('Este es un texto más largo que debería activar la detección de idioma');
    await flushPromises();

    expect(wrapper.html()).toContain(`lang_${detectedLanguage}`);
  });

  it('should automatically detect language from text selected from context menu', async () => {
    const wrapper = mount(SidepanelApp);
    const text = 'Esta es una oración de prueba para traducción automática.';
    await sendMessage('selectedText', { text });
    await flushPromises();

    expect(mockAIService.detectLanguage).toHaveBeenCalledWith(text);
  });

  it('should automatically process text when selected from context menu', async () => {
    const wrapper = mount(SidepanelApp);
    const text = 'Esta es una oración de prueba para traducción automática.';
    await sendMessage('selectedText', { text });
    await flushPromises();

    expect(mockAIService.proofread).toHaveBeenCalledWith(text);
    const resultCard = wrapper.findComponent({ name: 'ResultCard' });
    expect(resultCard.props('content')).toBe('Texto corregido');
  });

  describe('ToolSelector Behavior', () => {
    it('should disable process button when no text is entered', () => {
      const wrapper = mount(SidepanelApp);
      const button = wrapper.findComponent(VBtn);
      expect(button.props('disabled')).toBe(true);
    });

    it('should call proofread and rewrite services and display results', async () => {
      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Este es un texto de prueba');
      await flushPromises();

      const toolSelector = wrapper.findComponent({ name: 'ToolSelector' });
      toolSelector.vm.$emit('process', {
        proofread: true,
        rewrite: true,
      });
      await flushPromises();

      expect(mockAIService.proofread).toHaveBeenCalled();
      expect(mockAIService.rewrite).toHaveBeenCalled();
    });
  });

  describe('Model Downloading State', () => {
    it('should show model download message when downloading starts', async () => {
      const wrapper = mount(SidepanelApp);
      await flushPromises();

      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      await nextTick();

      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(true);
    });

    it('should hide model download message when downloading completes', async () => {
      const wrapper = mount(SidepanelApp);
      await flushPromises();

      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      await nextTick();
      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(true);

      await sendMessage('modelStatusUpdate', { state: 'available' });
      await nextTick();

      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(false);
    });

    it('should hide model download message when source language changes', async () => {
      const wrapper = mount(SidepanelApp);
      await flushPromises();

      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      await nextTick();
      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(true);

      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('New text to trigger change');
      await flushPromises();

      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(false);
    });

    it('should hide model download message when target language changes', async () => {
      const wrapper = mount(SidepanelApp);
      await flushPromises();

      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      await nextTick();
      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(true);

      const targetSelect = wrapper.findComponent(VSelect);
      await targetSelect.setValue('fr');
      await nextTick();

      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(false);
    });

    it('should hide model download message when cancel button is clicked', async () => {
      const wrapper = mount(SidepanelApp);
      await flushPromises();

      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      await nextTick();
      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(true);

      const card = wrapper.findComponent({ name: 'ModelDownloadCard' });
      card.vm.$emit('cancel');
      await nextTick();

      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(false);
    });
  });

  describe('ToolSelector Behavior', () => {
    it('should cancel processing when cancel button is clicked', async () => {
      mockAIService.proofread.mockReturnValue(new Promise(() => {}));
      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Este es un texto de prueba');
      await flushPromises();

      const toolSelector = wrapper.findComponent({ name: 'ToolSelector' });
      toolSelector.vm.$emit('process', {
        proofread: true,
      });
      await flushPromises();

      const cancelButton = wrapper.findComponent(VBtn);
      await cancelButton.trigger('click');
      await flushPromises();

      expect(mockAIService.cancelProcessing).toHaveBeenCalled();
      const resultCard = wrapper.findComponent({ name: 'ResultCard' });
      expect(resultCard.props('error')).toBe('Cancelled by user');
    });
  });

  describe('General Error Handling', () => {
    it('should display error message when processing fails', async () => {
      const errorMessage = 'Error al procesar el texto';
      mockAIService.proofread.mockRejectedValue(new Error(errorMessage));

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Este es un texto de prueba');
      await flushPromises();

      const toolSelector = wrapper.findComponent({ name: 'ToolSelector' });
      toolSelector.vm.$emit('process', {
        proofread: true,
      });
      await flushPromises();

      expect(wrapper.findComponent(VAlert).text()).toContain(errorMessage);
    });
  });

  describe('API Availability Warning', () => {
    it('should show warning when native browser APIs are not available', async () => {
      mockAIService.checkAPIAvailability.mockResolvedValue(false);

      const wrapper = mount(SidepanelApp);
      await flushPromises();

      expect(wrapper.findComponent(VAlert).text()).toContain('apiWarning');
    });

    it('should not show warning when native browser APIs are available', async () => {
      mockAIService.checkAPIAvailability.mockResolvedValue(true);

      const wrapper = mount(SidepanelApp);
      await flushPromises();

      expect(wrapper.findComponent(VAlert).exists()).toBe(false);
    });
  });

  describe('ToolSelector Behavior', () => {
    it('should disable process button when no text is entered', () => {
      const wrapper = mount(SidepanelApp);
      const button = wrapper.findComponent(VBtn);
      expect(button.props('disabled')).toBe(true);
    });

    it('should call proofread and rewrite services when selected', async () => {
      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Este es un texto de prueba');
      await flushPromises();

      const toolSelector = wrapper.findComponent({ name: 'ToolSelector' });
      toolSelector.vm.$emit('process', {
        proofread: true,
        rewrite: true,
      });
      await flushPromises();

      expect(mockAIService.proofread).toHaveBeenCalled();
      expect(mockAIService.rewrite).toHaveBeenCalled();

      const resultCards = wrapper.findAllComponents({ name: 'ResultCard' });
      expect(resultCards.length).toBe(2);
      expect(resultCards[0].props('title')).toBe('Proofread');
      expect(resultCards[0].props('content')).toBe('Texto corregido');
      expect(resultCards[1].props('title')).toBe('Rewrite');
      expect(resultCards[1].props('content')).toBe('Texto reescrito');
    });

    it('should handle errors in sequential processing', async () => {
      const errorMessage = 'Error en el proofread';
      mockAIService.proofread.mockRejectedValue(new Error(errorMessage));

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Este es un texto de prueba');
      await flushPromises();

      const toolSelector = wrapper.findComponent({ name: 'ToolSelector' });
      toolSelector.vm.$emit('process', {
        proofread: true,
        rewrite: true,
      });
      await flushPromises();

      const resultCards = wrapper.findAllComponents({ name: 'ResultCard' });
      expect(resultCards.length).toBe(1);
      expect(resultCards[0].props('title')).toBe('Proofread');
      expect(resultCards[0].props('error')).toBe(errorMessage);
      expect(mockAIService.rewrite).not.toHaveBeenCalled();
    });

    it('should show loading state during processing', async () => {
      mockAIService.proofread.mockReturnValue(new Promise(() => {}));

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Este es un texto de prueba');
      await flushPromises();

      const toolSelector = wrapper.findComponent({ name: 'ToolSelector' });
      toolSelector.vm.$emit('process', {
        proofread: true,
      });
      await flushPromises();

      const resultCard = wrapper.findComponent({ name: 'ResultCard' });
      expect(resultCard.props('loading')).toBe(true);
    });
  });

});
