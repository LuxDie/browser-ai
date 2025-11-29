import { describe, it, expect, vi, type MockedObject, afterEach, beforeEach } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import SidepanelApp from '@/entrypoints/sidepanel/SidepanelApp.vue';
import type { LanguageService } from '@/entrypoints/background/language/language.service';
import type { AIService } from '@/entrypoints/background/ai/ai.service';

// TODO: usar importación dinámica
vi.mock('@/entrypoints/background/ai/ai.service', () => ({
  getAIService() { return mockAIService; },
  registerAIService: vi.fn(),
}));

vi.mock('@/entrypoints/background/language/language.service', () => ({
  LanguageService: {
    getInstance: vi.fn(() => mockLanguageService)
  },
}));

const mockSupportedLanguages = ['de', 'it', 'ru', 'zh', 'ja'] as const;
const mockSummarizerLanguages = ['de', 'it', 'ru'] as const satisfies typeof mockSupportedLanguages[number][];
const mockLanguageService: MockedObject<Pick<
  LanguageService,
  'getSupportedLanguages' |
  'getSummarizerLanguageCodes' |
  'getBrowserLanguage' |
  'isLanguageSupported' |
  'getLanguageKey'>
> = {
  getSupportedLanguages: vi.fn(() => mockSupportedLanguages as any),
  getSummarizerLanguageCodes: vi.fn(() => mockSummarizerLanguages as any),
  getBrowserLanguage: vi.fn(() => 'zh'),
  isLanguageSupported: vi.fn(() => true) as any,
  getLanguageKey: vi.fn((code: string) => `lang_${code}` as any)
};
const mockAIService: MockedObject<Pick<
  AIService,
  'processText' |
  'detectLanguage' |
  'checkAPIAvailability'>
> = {
  processText: vi.fn(() => Promise.resolve(PROCESSED_TEXT)),
  detectLanguage: vi.fn(() => Promise.resolve(mockSupportedLanguages[0])),
  checkAPIAvailability: vi.fn(() => true),
};

const LONG_TEXT = 'Este es un texto largo que debería activar la detección de idioma';
const SHORT_TEXT = 'Muy corto';
const ERROR_MESSAGE = 'Error al procesar el texto';
const PROCESSED_TEXT = 'Texto procesado';

async function setTextAndProcess(wrapper: VueWrapper) {
  const textarea = wrapper.find('textarea#input-text');
  await textarea.setValue(LONG_TEXT);
  await flushPromises();
  const button = wrapper.find('button#process-button');
  await button.trigger('click');
  await flushPromises();
}

describe('SidepanelApp', () => {
  let wrapper: VueWrapper;

  beforeEach(async () => {
    fakeBrowser.reset();
    wrapper = mount(SidepanelApp);
    await flushPromises();
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('should not show api warning when available on initialization', () => {
    expect(wrapper.find('[data-testid=api-warning-container]').exists()).toBe(false);
  });

  it('should render initial state correctly', () => {
    expect((wrapper.find('textarea#input-text').element as HTMLTextAreaElement).value).toBe('');
    expect(wrapper.find('[data-testid=process-button]').attributes('disabled')).toBeDefined();
  });

  it('should show detected language after text input', async () => {
    const correctString = 'correct language msg';
    vi.mocked(browser.i18n.getMessage).mockImplementation((msg, subs) => {
      if (msg === 'detectedLanguage' && subs === 'lang_iw') {
        return correctString;
      }
      return msg;
    });
    mockLanguageService.getLanguageKey.mockReturnValue('lang_iw');

    const textarea = wrapper.find('textarea#input-text');

    await textarea.setValue(LONG_TEXT);
    await flushPromises();

    expect(wrapper.text()).toContain(correctString);
  });

  it('should show "localProcessingBadge" indicator when using native API', async () => {
    const detectedLanguage = 'es';
    (mockAIService.detectLanguage).mockResolvedValue(detectedLanguage);
    (mockAIService.processText).mockResolvedValue(PROCESSED_TEXT);
    mockLanguageService.isLanguageSupported.mockReturnValue(true);

    const textarea = wrapper.find('textarea#input-text');

    await textarea.setValue(LONG_TEXT);
    await flushPromises();

    const button = wrapper.find('button#process-button');
    await button.trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid=local-processing-badge]').exists()).toBe(true);
  });

  describe('Context Menu Behavior', () => {
    it('should automatically detect language from text selected from context menu', async () => {
      // Simular recepción de texto desde menú contextual
      globalThis.dispatchEvent(new CustomEvent('selectedText', {
        detail: { text: LONG_TEXT, summarize: false }
      }));
      // Esperar a que se active la traducción automática
      await flushPromises();

      // Verificar que se solicitó la traducción con los datos correctos
      expect(wrapper.find('[data-testid=detected-language]').exists()).toBe(true);
    });

    it('should automatically process text when selected from context menu', async () => {
      // Simular recepción de texto desde menú contextual
      globalThis.dispatchEvent(new CustomEvent('selectedText', { detail: { text: LONG_TEXT, summarize: false } }));
      // Esperar a que se active el procesamiento automático
      await flushPromises();
      expect((wrapper.get('[data-testid=output-textarea]').element as HTMLTextAreaElement).value).toContain(PROCESSED_TEXT);
    });

    it('should not process when source and target languages are the same and summarize is false', async () => {
      const sameLanguage = mockSupportedLanguages[0];
      mockAIService.detectLanguage.mockResolvedValue(sameLanguage);
      // Set target language to same as source
      const targetSelect = wrapper.find('select#target-language');
      await targetSelect.setValue(sameLanguage);
      // Ensure summarize is unchecked
      const checkbox = wrapper.find('input#summarize-checkbox');
      await checkbox.setValue(false);
      await flushPromises();

      // Simulate receiving message from context menu
      globalThis.dispatchEvent(new CustomEvent('selectedText', { detail: { text: LONG_TEXT, summarize: false } }));
      await flushPromises();

      expect(wrapper.find('[data-testid=output-textarea]').exists()).toBe(false);
      expect(wrapper.text()).toContain('sameLanguageWarning');
    });
  });

  describe('Process Button Behavior', () => {
    it('should be disabled when no text is entered', () => {
      const button = wrapper.find('button#process-button');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should be disabled for too short text for language detection', async () => {
      const textarea = wrapper.find('textarea#input-text');

      await textarea.setValue('Hello');
      await flushPromises();

      const button = wrapper.find('button#process-button');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should be disabled while language detection is in progress', async () => {
      // Make detectLanguage never resolve
      (mockAIService.detectLanguage).mockReturnValue(new Promise(() => { }));

      const textarea = wrapper.find('textarea#input-text');

      await textarea.setValue(LONG_TEXT);
      await flushPromises();

      const button = wrapper.find('button#process-button');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should enable button when source language is detected to be different from target language', async () => {
      const sourceLanguage = mockSupportedLanguages[0];
      const targetLanguage = mockSupportedLanguages[1];

      (mockAIService.detectLanguage).mockResolvedValue(sourceLanguage);
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const textarea = wrapper.find('textarea#input-text');

      await textarea.setValue('Esta es una oración de prueba para traducción.');
      await flushPromises();

      // Change target language
      const targetSelect = wrapper.find('select#target-language');
      await targetSelect.setValue(targetLanguage);
      await flushPromises();

      const button = wrapper.find('button#process-button');
      expect(button.attributes('disabled')).toBeUndefined();
    });

    it('should disable button when source language is detected to be the same as target language', async () => {
      const sameLanguage = mockSupportedLanguages[0];

      (mockAIService.detectLanguage).mockResolvedValue(sameLanguage);
      mockLanguageService.isLanguageSupported.mockReturnValue(true);

      const textarea = wrapper.find('textarea#input-text');

      await textarea.setValue('Esta es una oración de prueba para traducción.');
      await flushPromises();

      // Set target language to same as source
      const targetSelect = wrapper.find('select#target-language');
      await targetSelect.setValue(sameLanguage);
      await flushPromises();

      const button = wrapper.find('button#process-button');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should show "processingButton" and be disabled when processing is in progress', async () => {
      mockAIService.processText.mockReturnValue(new Promise(() => { })); // Never resolves
      const textarea = wrapper.find('textarea#input-text');
      await textarea.setValue(LONG_TEXT);
      await flushPromises();
      const button = wrapper.find('button#process-button');
      expect(button.attributes('disabled')).toBeUndefined();
      // Click to start processing
      await button.trigger('click');
      await flushPromises();

      expect(button.text()).toBe('processingButton');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should reset button state after processing completes', async () => {
      await setTextAndProcess(wrapper);

      const button = wrapper.find('button#process-button');
      expect(button.text()).toBe('processButton');
      expect(button.attributes('disabled')).toBeUndefined();
    });

    it('should enable button after switching target language during processing', async () => {
      mockAIService.processText.mockReturnValue(new Promise(() => { })); // Never resolves
      const targetSelect = wrapper.find('select#target-language');
      await targetSelect.setValue(mockSupportedLanguages[1]);
      await setTextAndProcess(wrapper);
      const button = wrapper.find('button#process-button');
      expect(button.attributes('disabled')).toBeDefined();

      // Change target language during processing
      await targetSelect.setValue(mockSupportedLanguages[2]);
      await flushPromises();

      expect(button.attributes('disabled')).toBeUndefined();
      expect(button.text()).toBe('processButton');
    });

    it('should enable button after typing in input field during processing', async () => {
      mockAIService.processText.mockReturnValue(new Promise(() => { })); // Never resolves
      await setTextAndProcess(wrapper);
      const button = wrapper.find('button#process-button');
      expect(button.attributes('disabled')).toBeDefined();
      // Change text during processing (debe ser diferente para disparar el watch)
      const textarea = wrapper.find('textarea#input-text');
      await textarea.setValue(LONG_TEXT + ' modificado');
      await flushPromises();

      expect(button.attributes('disabled')).toBeUndefined();
      expect(button.text()).toBe('processButton');
    });

    it('should re-enable process button when translation fails with an error', async () => {
      mockAIService.processText.mockRejectedValue(new Error('Error al procesar el texto'));
      await setTextAndProcess(wrapper);

      const button = wrapper.find('button#process-button');
      expect(button.text()).toBe('processButton');
      expect(button.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Model Downloading State', () => {
    it('should show model download message when downloading starts', async () => {
      // Simulate receiving modelStatusUpdate message
      globalThis.dispatchEvent(new CustomEvent('modelStatusUpdate', { detail: { state: 'downloading', downloadProgress: 0 } }));
      await flushPromises();

      // Check if ModelDownloadCard is present
      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(true);
    });

    it('should hide model download message when downloading completes', async () => {
      // Simular finalización de la descarga
      globalThis.dispatchEvent(new CustomEvent('modelStatusUpdate', { detail: { state: 'downloading', downloadProgress: 0 } }));
      await flushPromises();
      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(true);

      // Verificar que el estado del modelo esté oculto
      globalThis.dispatchEvent(new CustomEvent('modelStatusUpdate', { detail: { state: 'available' } }));
      await flushPromises();

      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(false);
    });

    it('should hide model download message when source language changes', async () => {
      // Show download message
      globalThis.dispatchEvent(new CustomEvent('modelStatusUpdate', { detail: { state: 'downloading', downloadProgress: 0 } }));
      await flushPromises();
      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(true);

      // Change text (which changes source language detection)
      const textarea = wrapper.find('textarea#input-text');
      await textarea.setValue('New text to trigger change');
      await flushPromises();

      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(false);
    });

    it('should hide model download message when target language changes', async () => {
      // Show download message
      globalThis.dispatchEvent(new CustomEvent('modelStatusUpdate', { detail: { state: 'downloading', downloadProgress: 0 } }));
      await flushPromises();
      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(true);

      // Change target language
      const targetSelect = wrapper.find('select#target-language');
      await targetSelect.setValue(mockSupportedLanguages[0]);
      await flushPromises();

      expect(wrapper.findComponent({ name: 'ModelDownloadCard' }).exists()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when translation fails with an error', async () => {
      const errorMessage = ERROR_MESSAGE;
      mockAIService.processText.mockRejectedValue(new Error(errorMessage));
      await setTextAndProcess(wrapper);
      expect(wrapper.get('[data-testid=error-container]').text()).toContain(errorMessage);
    });
  });

  describe('API Availability Warning', () => {
    it('should show warning when native browser APIs are not available', async () => {
      mockAIService.checkAPIAvailability.mockResolvedValue(false);
      // Remount with new mock value
      wrapper.unmount();
      wrapper = mount(SidepanelApp);
      await flushPromises();

      expect(wrapper.text()).toContain('apiWarning');
    });

    it('should not show warning when native browser APIs are available', () => {
      // This is the default state set in beforeEach
      expect(wrapper.text()).not.toContain('apiWarning');
    });
  });

  describe('Summarize Functionality', () => {
    it('should send summarize option to AIService when checkbox is checked', async () => {
      // Check summarize checkbox
      const checkbox = wrapper.find('input#summarize-checkbox');
      await checkbox.setValue(true);
      await flushPromises();

      await setTextAndProcess(wrapper);

      expect((wrapper.get('[data-testid=output-textarea]').element as HTMLTextAreaElement).value).toContain(PROCESSED_TEXT);
    });

    it('should send summarize: false when checkbox is unchecked', async () => {
      // Ensure checkbox is unchecked
      const checkbox = wrapper.find('input#summarize-checkbox');
      expect((checkbox.element as HTMLInputElement).checked).toBe(false);
      await flushPromises();

      await setTextAndProcess(wrapper);

      expect((wrapper.get('[data-testid=output-textarea]').element as HTMLTextAreaElement).value).toContain(PROCESSED_TEXT);
    });

    it('should enable process button even when languages are the same if summarize is checked', async () => {
      const sameLanguage = mockSupportedLanguages[1];
      mockAIService.detectLanguage.mockResolvedValue(sameLanguage);
      const textarea = wrapper.find('textarea#input-text');
      await textarea.setValue(LONG_TEXT);
      await flushPromises();
      // Set target language to same as source
      const targetSelect = wrapper.find('select#target-language');
      await targetSelect.setValue(sameLanguage);
      await flushPromises();
      // Initially button should be disabled
      const button = wrapper.find('button#process-button');
      expect(button.attributes('disabled')).toBeDefined();

      // Check summarize checkbox
      const checkbox = wrapper.find('input#summarize-checkbox');
      await checkbox.setValue(true);
      await flushPromises();

      // Button should now be enabled
      expect(button.attributes('disabled')).toBeUndefined();
    });

    it('should automatically check summarize checkbox when selectedText message has summarize: true', async () => {
      globalThis.dispatchEvent(new CustomEvent('selectedText', { detail: { text: 'Texto', summarize: true } }));
      await flushPromises();

      const checkbox = wrapper.find('input#summarize-checkbox');
      expect((checkbox.element as HTMLInputElement).checked).toBe(true);
    });

    it('should uncheck summarize checkbox when selectedText message has summarize: false', async () => {
      const checkbox = wrapper.find('input#summarize-checkbox');
      await checkbox.setValue(true);

      globalThis.dispatchEvent(new CustomEvent('selectedText', { detail: { text: 'Texto', summarize: false } }));
      await flushPromises();

      expect((checkbox.element as HTMLInputElement).checked).toBe(false);
    });
  });

  describe('Default Language Loading', () => {
    it('should use browser language as default when supported', async () => {
      const browserLanguage = mockSupportedLanguages[1];
      mockLanguageService.getBrowserLanguage.mockReturnValue(browserLanguage);
      mockLanguageService.isLanguageSupported.mockReturnValue(true);
      // Remount with new mock value
      wrapper.unmount();
      wrapper = mount(SidepanelApp);
      await flushPromises();

      const targetSelect = wrapper.find('select#target-language');
      expect((targetSelect.element as HTMLSelectElement).value).toBe(browserLanguage);
    });

    it('should use default language when browser language is not supported', async () => {
      const browserLanguage = 'xx';
      const fallbackLanguage = mockSupportedLanguages[0]; // La implementación usa el primer valor como respaldo
      mockLanguageService.getBrowserLanguage.mockReturnValue(browserLanguage);
      mockLanguageService.isLanguageSupported.mockReturnValue(false);
      // Remount with new mock value
      wrapper.unmount();
      wrapper = mount(SidepanelApp);
      await flushPromises();

      const targetSelect = wrapper.find('select#target-language');
      expect((targetSelect.element as HTMLSelectElement).value).toBe(fallbackLanguage);
    });

    it('should populate language selector with available languages', () => {
      const targetSelect = wrapper.find('select#target-language');
      const options = targetSelect.findAll('option');

      expect(options.length).toBe(mockSupportedLanguages.length);
      const optionValues = options.map(opt => opt.element.value);
      expect(optionValues).toEqual(mockSupportedLanguages);
    });
  });

  describe('Language Detection and Error Handling', () => {
    it('should show error when unsupported language is detected', async () => {
      const unsupportedLang = 'xx';
      mockAIService.detectLanguage.mockResolvedValue(unsupportedLang);
      mockLanguageService.isLanguageSupported.mockReturnValue(false);
      expect(wrapper.text()).not.toContain('detectedLanguageNotSupported');

      const textarea = wrapper.find('textarea#input-text');
      await textarea.setValue('Este texto está en un idioma no soportado');
      await flushPromises();

      expect(wrapper.text()).toContain('detectedLanguageNotSupported');
    });

    it('should not show "insufficient text" message when unsupported language is detected', async () => {
      const unsupportedLang = 'xx';
      mockAIService.detectLanguage.mockResolvedValue(unsupportedLang);
      mockLanguageService.isLanguageSupported.mockReturnValue(false);
      const textarea = wrapper.find('textarea#input-text');
      await textarea.setValue(LONG_TEXT);
      await flushPromises();
      expect(wrapper.text()).toContain('detectedLanguage');

      await textarea.setValue(SHORT_TEXT);
      await flushPromises();

      expect(wrapper.text()).not.toContain('detectedLanguage');
    });

    it('should hide error message when text is shorter than minDetectLength', async () => {
      const unsupportedLang = 'xx';
      mockAIService.detectLanguage.mockResolvedValue(unsupportedLang);
      mockLanguageService.isLanguageSupported.mockReturnValue(false);
      const textarea = wrapper.find('textarea#input-text');
      await textarea.setValue(LONG_TEXT);
      await flushPromises();
      expect(wrapper.text()).toContain('detectedLanguageNotSupported');

      await textarea.setValue(SHORT_TEXT);
      await flushPromises();

      expect(wrapper.text()).not.toContain('detectedLanguageNotSupported');
    });

    it('should not execute language detection for short text', async () => {
      const textarea = wrapper.find('textarea#input-text');

      await textarea.setValue(SHORT_TEXT);
      await flushPromises();

      expect(wrapper.find('[data-testid=detected-language]').exists()).toBe(false);
    });
  });
});
