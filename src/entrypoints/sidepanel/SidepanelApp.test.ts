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
const mockAIService: MockedObject<Pick<AIService, 'processText' | 'detectLanguage' | 'checkAPIAvailability' | 'cancelProcessing'>> = {
  processText: vi.fn(() => Promise.resolve('Texto procesado')),
  detectLanguage: vi.fn(() => Promise.resolve(DEFAULT_DETECTED_LANGUAGE)),
  checkAPIAvailability: vi.fn(() => Promise.resolve(true)) as any,
  cancelProcessing: vi.fn(),
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
    expect(wrapper.findComponent({ name: 'ProcessControls' }).exists()).toBe(true);
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

    expect(wrapper.findComponent(VAlert).text()).toContain(`lang_${detectedLanguage}`);
  });

  it('should show "Procesado localmente" indicator when using native API', async () => {
    const detectedLanguage = 'es';
    mockAIService.detectLanguage.mockResolvedValue(detectedLanguage as SupportedLanguageCode);
    mockLanguageService.getLanguageKey.mockReturnValue(`lang_${detectedLanguage}`);

    const wrapper = mount(SidepanelApp);
    const textarea = wrapper.findComponent(VTextarea);

    await textarea.setValue('Este es un texto lo suficientemente largo para activar la detección de idioma.');
    await flushPromises();

    expect(wrapper.findComponent(VAlert).text()).toContain(`lang_${detectedLanguage}`);
  });

  it('should show "localProcessingBadge" indicator when using native API', async () => {
    const detectedLanguage = 'es';
    mockAIService.detectLanguage.mockResolvedValue(detectedLanguage as SupportedLanguageCode);
    mockAIService.processText.mockResolvedValue('Texto procesado');
    mockLanguageService.isLanguageSupported.mockReturnValue(true);

    const wrapper = mount(SidepanelApp);
    const textarea = wrapper.findComponent(VTextarea);

    await textarea.setValue('Texto de prueba');
    await flushPromises();

    const button = wrapper.findComponent(VBtn);
    await button.trigger('click');
    await flushPromises();

    expect(wrapper.find('#processing-source').exists()).toBe(true);
  });

  it('should automatically detect language from text selected from context menu', async () => {
    mount(SidepanelApp);
    await sendMessage('selectedText', { text: 'Esta es una oración de prueba para traducción automática.', summarize: false });
    await flushPromises();

    expect(mockAIService.detectLanguage).toHaveBeenCalled();
  });

  it('should automatically process text when selected from context menu', async () => {
    mount(SidepanelApp);
    await sendMessage('selectedText', { text: 'Esta es una oración de prueba para traducción automática.', summarize: false });
    await flushPromises();
    expect(mockAIService.processText).toHaveBeenCalledWith(
      'Esta es una oración de prueba para traducción automática.',
      {
        sourceLanguage: DEFAULT_DETECTED_LANGUAGE,
        targetLanguage: 'zh',
        summarize: false,
      }
    );
  });

  describe('Process Button Behavior', () => {
    it('should be disabled when no text is entered', () => {
      const wrapper = mount(SidepanelApp);
      const button = wrapper.findComponent(VBtn);

      expect(button.props('disabled')).toBe(true);
    });

    it('should be disabled for too short text for language detection', async () => {
      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);

      await textarea.setValue('Hello');
      await flushPromises();

      const button = wrapper.findComponent(VBtn);
      expect(button.props('disabled')).toBe(true);
    });

    it('should be disabled while language detection is in progress', async () => {
      mockAIService.detectLanguage.mockReturnValue(new Promise(() => { }));

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);

      await textarea.setValue('Este es un texto más largo que debería activar la detección de idioma');
      await flushPromises();

      const button = wrapper.findComponent(VBtn);
      expect(button.props('disabled')).toBe(true);
    });

    it('should enable button when source language is detected to be different from target language', async () => {
      const sourceLanguage = 'fr';
      const targetLanguage = 'de';

      mockAIService.detectLanguage.mockResolvedValue(sourceLanguage as SupportedLanguageCode);
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Esta es una oración de prueba para traducción.');
      await flushPromises();

      const targetSelect = wrapper.findComponent(VSelect);
      await targetSelect.setValue(targetLanguage);
      await flushPromises();

      const button = wrapper.findComponent(VBtn);
      expect(button.props('disabled')).toBe(false);
    });

    it('should disable button when source language is detected to be the same as target language', async () => {
      const sameLanguage = 'it';

      mockAIService.detectLanguage.mockResolvedValue(sameLanguage as SupportedLanguageCode);
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Esta es una oración de prueba para traducción.');
      await flushPromises();

      const targetSelect = wrapper.findComponent(VSelect);
      await targetSelect.setValue(sameLanguage);
      await flushPromises();

      const button = wrapper.findComponent(VBtn);
      expect(button.props('disabled')).toBe(true);
    });

    it('should show "processingButton" and be disabled when processing is in progress', async () => {
      const detectedLanguage = 'es';

      mockAIService.detectLanguage.mockResolvedValue(detectedLanguage as SupportedLanguageCode);
      mockAIService.processText.mockReturnValue(new Promise(() => { }));
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);

      await textarea.setValue('Este es un texto más largo que debería activar la detección de idioma');
      await flushPromises();

      const button = wrapper.findComponent(VBtn);
      expect(button.props('disabled')).toBe(false);

      await button.trigger('click');
      await flushPromises();

      expect(button.text()).toBe('processingButton');
      expect(button.props('disabled')).toBe(true);
    });

    it('should not process when source and target languages are the same and summarize is false, even from context menu', async () => {
      const sameLanguage = 'it';
      mockAIService.detectLanguage.mockResolvedValue(sameLanguage as SupportedLanguageCode);
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      await flushPromises();

      const targetSelect = wrapper.findComponent(VSelect);
      await targetSelect.setValue(sameLanguage);

      const checkbox = wrapper.findComponent(VCheckbox);
      await checkbox.setValue(false);
      await flushPromises();

      await sendMessage('selectedText', { text: 'Texto de prueba', summarize: false });
      await flushPromises();

      expect(mockAIService.processText).not.toHaveBeenCalled();
      expect(wrapper.findComponent(VAlert).text()).toContain('sameLanguageWarning');
    });

    it('should reset button state after processing completes', async () => {
      const detectedLanguage = 'es';

      mockAIService.detectLanguage.mockResolvedValue(detectedLanguage as SupportedLanguageCode);
      mockAIService.processText.mockResolvedValue('Texto procesado');
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);

      await textarea.setValue('Este es un texto más largo que debería activar la detección de idioma');
      await flushPromises();

      const button = wrapper.findComponent(VBtn);
      await button.trigger('click');
      await flushPromises();

      expect(button.text()).toBe('processButton');
      expect(button.props('disabled')).toBe(false);
    });

    it('should enable button after switching target language during processing', async () => {
      const detectedLanguage = 'es';

      mockAIService.detectLanguage.mockResolvedValue(detectedLanguage as SupportedLanguageCode);
      mockAIService.processText.mockReturnValue(new Promise(() => { }));
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);

      await textarea.setValue('Este es un texto más largo que debería activar la detección de idioma');
      await flushPromises();

      const button = wrapper.findComponent(VBtn);
      await button.trigger('click');
      await flushPromises();

      const targetSelect = wrapper.findComponent(VSelect);
      await targetSelect.setValue('fr');
      await flushPromises();

      expect(button.props('disabled')).toBe(false);
      expect(button.text()).toBe('processButton');
    });

    it('should enable button after typing in input field during processing', async () => {
      const detectedLanguage = 'es';

      mockAIService.detectLanguage.mockResolvedValue(detectedLanguage as SupportedLanguageCode);
      mockAIService.processText.mockReturnValue(new Promise(() => { }));
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);

      await textarea.setValue('Este es un texto más largo que debería activar la detección de idioma');
      await flushPromises();

      const button = wrapper.findComponent(VBtn);
      await button.trigger('click');
      await flushPromises();

      await textarea.setValue('Nuevo texto diferente para procesar');
      await flushPromises();

      expect(button.props('disabled')).toBe(false);
      expect(button.text()).toBe('processButton');
    });

    it('should re-enable process button when translation fails with an error', async () => {
      const detectedLanguage = 'es';

      mockAIService.detectLanguage.mockResolvedValue(detectedLanguage as SupportedLanguageCode);
      mockAIService.processText.mockRejectedValue(new Error('Error al procesar el texto'));
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);

      await textarea.setValue('Este es un texto más largo que debería activar la detección de idioma');
      await flushPromises();

      const button = wrapper.findComponent(VBtn);
      await button.trigger('click');
      await flushPromises();

      expect(button.text()).toBe('processButton');
      expect(button.props('disabled')).toBe(false);
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

  describe('Error Handling', () => {
    it('should display error message when translation fails with an error', async () => {
      const detectedLanguage = 'es';
      const errorMessage = 'Error al procesar el texto';

      mockAIService.detectLanguage.mockResolvedValue(detectedLanguage as SupportedLanguageCode);
      mockAIService.processText.mockRejectedValue(new Error(errorMessage));
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Este es un texto más largo que debería activar la detección de idioma');
      await flushPromises();

      const button = wrapper.findComponent(VBtn);
      await button.trigger('click');
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

  describe('Summarize Functionality', () => {
    it('should send summarize option to AIService when checkbox is checked', async () => {
      const detectedLanguage = 'es';

      mockAIService.detectLanguage.mockResolvedValue(detectedLanguage as SupportedLanguageCode);
      mockAIService.processText.mockResolvedValue('Texto procesado');
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Este es un texto más largo que debería activar la detección de idioma');
      await flushPromises();

      const checkbox = wrapper.findComponent(VCheckbox);
      await checkbox.setValue(true);
      await flushPromises();

      const button = wrapper.findComponent(VBtn);
      await button.trigger('click');
      await flushPromises();

      expect(mockAIService.processText).toHaveBeenCalledWith(
        'Este es un texto más largo que debería activar la detección de idioma',
        {
          sourceLanguage: detectedLanguage,
          targetLanguage: 'zh',
          summarize: true,
        }
      );
    });

    it('should send summarize: false when checkbox is unchecked', async () => {
      const detectedLanguage = 'es';

      mockAIService.detectLanguage.mockResolvedValue(detectedLanguage as SupportedLanguageCode);
      mockAIService.processText.mockResolvedValue('Texto procesado');
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Este es un texto más largo que debería activar la detección de idioma');
      await flushPromises();

      const checkbox = wrapper.findComponent(VCheckbox);
      expect(checkbox.props('modelValue')).toBe(false);

      const button = wrapper.findComponent(VBtn);
      await button.trigger('click');
      await flushPromises();

      expect(mockAIService.processText).toHaveBeenCalledWith(
        'Este es un texto más largo que debería activar la detección de idioma',
        {
          sourceLanguage: detectedLanguage,
          targetLanguage: 'zh',
          summarize: false,
        }
      );
    });

    it('should enable process button even when languages are the same if summarize is checked', async () => {
      const sameLanguage = 'it';

      mockAIService.detectLanguage.mockResolvedValue(sameLanguage as SupportedLanguageCode);
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Esta es una oración de prueba para traducción.');
      await flushPromises();

      const targetSelect = wrapper.findComponent(VSelect);
      await targetSelect.setValue(sameLanguage);
      await flushPromises();

      let button = wrapper.findComponent(VBtn);
      expect(button.props('disabled')).toBe(true);

      const checkbox = wrapper.findComponent(VCheckbox);
      await checkbox.setValue(true);
      await flushPromises();

      button = wrapper.findComponent(VBtn);
      expect(button.props('disabled')).toBe(false);
    });

    it('should automatically check summarize checkbox when selectedText message has summarize: true', async () => {
      const wrapper = mount(SidepanelApp);
      await flushPromises();

      await sendMessage('selectedText', { text: 'Texto', summarize: true });
      await nextTick();

      const checkbox = wrapper.findComponent(VCheckbox);
      expect(checkbox.props('modelValue')).toBe(true);
    });

    it('should uncheck summarize checkbox when selectedText message has summarize: false', async () => {
      const wrapper = mount(SidepanelApp);
      await flushPromises();

      const checkbox = wrapper.findComponent(VCheckbox);
      await checkbox.setValue(true);

      await sendMessage('selectedText', { text: 'Texto', summarize: false });
      await nextTick();

      expect(checkbox.props('modelValue')).toBe(false);
    });
  });

  describe('Default Language Loading', () => {
    it('should use browser language as default when supported', async () => {
      const browserLanguage = 'zh';
      mockLanguageService.getBrowserLanguage.mockReturnValue(browserLanguage);
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const wrapper = mount(SidepanelApp);
      await flushPromises();

      const targetSelect = wrapper.findComponent(VSelect);
      expect(targetSelect.props('modelValue')).toBe(browserLanguage);
    });

    it('should use default language when browser language is not supported', async () => {
      const browserLanguage = 'xx';
      const fallbackLanguage = mockSupportedLanguages[0];

      mockLanguageService.getBrowserLanguage.mockReturnValue(browserLanguage);
      mockLanguageService.getSupportedLanguages.mockReturnValue(mockSupportedLanguages as any);
      mockLanguageService.isLanguageSupported.mockImplementation((lang: string) => lang !== browserLanguage);

      const wrapper = mount(SidepanelApp);
      await flushPromises();

      const targetSelect = wrapper.findComponent(VSelect);
      expect(targetSelect.props('modelValue')).toBe(fallbackLanguage);
    });

    it('should populate language selector with available languages', async () => {
      const wrapper = mount(SidepanelApp);
      await flushPromises();

      const targetSelect = wrapper.findComponent(VSelect);
      const items = targetSelect.props('items') as any[];

      expect(items.length).toBe(mockSupportedLanguages.length);
      const itemValues = items.map((item: any) => item.value);
      expect(itemValues).toEqual(mockSupportedLanguages);
    });
  });

  describe('Language Detection and Error Handling', () => {
    it('should show error when unsupported language is detected', async () => {
      const unsupportedLang = 'xx';
      mockAIService.detectLanguage.mockResolvedValue(unsupportedLang as SupportedLanguageCode);
      mockLanguageService.isLanguageSupported.mockReturnValue(false);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Este texto está en un idioma no soportado');
      await flushPromises();

      expect(wrapper.findComponent(VAlert).text()).toContain('detectedLanguageNotSupported');
    });

    it('should not show "insufficient text" message when unsupported language is detected', async () => {
      const unsupportedLang = 'xx';
      mockAIService.detectLanguage.mockResolvedValue(unsupportedLang as SupportedLanguageCode);
      mockLanguageService.isLanguageSupported.mockReturnValue(false);

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Texto largo no soportado');
      await flushPromises();

      expect(wrapper.text()).not.toContain('Detected Language');
    });

    it('should hide error message when text is shorter than minDetectLength', async () => {
      mockAIService.detectLanguage.mockRejectedValue(new Error('Detection failed'));

      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Long text that causes error');
      await flushPromises();

      expect(wrapper.findComponent(VAlert).text()).toContain('languageDetectionError');

      await textarea.setValue('Short');
      await flushPromises();

      expect(wrapper.findComponent(VAlert).exists()).toBe(false);
    });

    it('should not execute language detection for text shorter than minDetectLength', async () => {
      const wrapper = mount(SidepanelApp);
      const textarea = wrapper.findComponent(VTextarea);
      await textarea.setValue('Corto');
      await flushPromises();

      expect(mockAIService.detectLanguage).not.toHaveBeenCalled();
    });
  });
});
