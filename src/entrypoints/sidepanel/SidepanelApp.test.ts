import { describe, it, expect, vi, type MockedObject, afterEach, beforeEach } from 'vitest';
import { mount, flushPromises, VueWrapper } from '@vue/test-utils';
import type { VCheckbox } from 'vuetify/components';
import SidepanelApp from '@/entrypoints/sidepanel/SidepanelApp.vue';
import type { LanguageService, SupportedLanguageCode } from '@/entrypoints/background/language/language.service';
import type { AIService } from '@/entrypoints/background/ai/ai.service';
import type OutputArea from '@/components/OutputArea.vue';
import type LanguageSelector from '@/components/LanguageSelector.vue';

// TODO: usar importación dinámica
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
  getLanguageKey: vi.fn((code: SupportedLanguageCode) => code) as any,
};
const mockAIService: MockedObject<Pick<
  AIService,
  'processText' |
  'detectLanguage' |
  'checkAPIAvailability' |
  'cancelProcessing'>
> = {
  processText: vi.fn(() => Promise.resolve(PROCESSED_TEXT)),
  detectLanguage: vi.fn(() => Promise.resolve(mockSupportedLanguages[0])),
  checkAPIAvailability: vi.fn(() => true),
  cancelProcessing: vi.fn(),
};

const LONG_TEXT = 'Este es un texto largo que debería activar la detección de idioma';
const SHORT_TEXT = 'Muy corto';
const ERROR_MESSAGE = 'Error al procesar el texto';
const PROCESSED_TEXT = 'Texto procesado';

async function setTextAndProcess(wrapper: VueWrapper, text = LONG_TEXT) {
  const textarea = wrapper.getComponent('[data-testid="input-area"]');
  await textarea.setValue(text);
  await flushPromises(); // Allows language detection to run
  const button = wrapper.get('[data-testid="process-button"]');
  await button.trigger('click');
  await flushPromises();
}

describe('SidepanelApp', () => {
  let wrapper: VueWrapper;

  beforeEach(async () => {
    wrapper = mount(SidepanelApp);
    await flushPromises();
  });

  afterEach(() => {
    fakeBrowser.reset();
  });

  it('should not show api warning when available on initialization', () => {
    expect(wrapper.find('[data-testid=api-warning-container]').exists()).toBe(false);
  });

  it('should render initial state correctly', () => {
    expect(wrapper.get('[data-testid="input-area"]').text()).toContain('inputLabel');
    expect(wrapper.get('[data-testid=process-button]').attributes('disabled')).toBeDefined();
  });

  it('should show detected language after text input', async () => {
    mockAIService.detectLanguage.mockResolvedValue('de');
    const textarea = wrapper.getComponent('[data-testid="input-area"]');
    await textarea.setValue(LONG_TEXT);
    await flushPromises();

    expect(wrapper.get('[data-testid="detected-language-code"]').text()).toBe('de');
  });

  it('should not execute language detection for short text', async () => {
    const textarea = wrapper.getComponent('[data-testid="input-area"]');

    await textarea.setValue(SHORT_TEXT);
    await flushPromises();

    expect(wrapper.find('[data-testid=detected-language]').exists()).toBe(false);
  });

  it('should show "localProcessingBadge" indicator when using native API', async () => {
    const detectedLanguage = 'es';
    mockAIService.detectLanguage.mockResolvedValue(detectedLanguage);
    mockAIService.processText.mockResolvedValue(PROCESSED_TEXT);
    mockLanguageService.isLanguageSupported.mockReturnValue(true);

    const textarea = wrapper.getComponent('[data-testid="input-area"]');

    await textarea.setValue(LONG_TEXT);
    await flushPromises();

    const button = wrapper.getComponent('[data-testid="process-button"]');
    await button.trigger('click');
    await flushPromises();

    const localProcessingBadge = wrapper.find('[data-testid="local-processing-badge"]');
    expect(localProcessingBadge.exists()).toBe(true);
  });

  describe('Context Menu Behavior', () => {
    it('should automatically detect language from text selected from context menu', async () => {
      // Simular recepción de texto desde menú contextual
      globalThis.dispatchEvent(new CustomEvent('selectedText', {
        detail: { text: LONG_TEXT, summarize: false }
      }));
      // Esperar a que se active la traducción automática
      await flushPromises();

      expect(wrapper.find('[data-testid=detected-language-code]').exists()).toBe(true);
    });

    it('should automatically process text when selected from context menu', async () => {
      // Simular recepción de texto desde menú contextual
      globalThis.dispatchEvent(new CustomEvent('selectedText',
        { detail: { text: LONG_TEXT, summarize: false } }));
      // Esperar a que se active el procesamiento automático
      await flushPromises();
      expect(wrapper.getComponent<typeof OutputArea>('[data-testid="output-area"]')
        .props('modelValue')).toBe(PROCESSED_TEXT);
    });

    it('should not process when languages are equal and summarize is not selected', async () => {
      const sameLanguage = mockSupportedLanguages[0];
      mockAIService.detectLanguage.mockResolvedValue(sameLanguage);
      // Set target language to same as source
      await wrapper.getComponent('[data-testid="language-selector"]').setValue(sameLanguage);
      // Ensure summarize is unchecked
      await wrapper.getComponent('[data-testid="summarize-checkbox"]').setValue(false);

      // Simulate receiving message from context menu
      globalThis.dispatchEvent(new CustomEvent('selectedText',
        { detail: { text: LONG_TEXT, summarize: false } }));
      await flushPromises();

      expect(wrapper.find('[data-testid=output-area]').exists()).toBe(false);
      expect(wrapper.text()).toContain('sameLanguageWarning');
    });
  });

  // TODO: refactorizar con `it.each`
  describe('Process Button Behavior', () => {
    it('should be disabled when no text is entered', () => {
      const button = wrapper.get('[data-testid="process-button"]');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should be disabled for too short text for language detection', async () => {
      const textarea = wrapper.getComponent('[data-testid="input-area"]');

      await textarea.setValue('Hello');

      const button = wrapper.get('[data-testid="process-button"]');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should be disabled while language detection is in progress', async () => {
      mockAIService.detectLanguage.mockReturnValue(new Promise(() => { }));

      const textarea = wrapper.getComponent('[data-testid="input-area"]');

      await textarea.setValue(LONG_TEXT);

      const button = wrapper.get('[data-testid="process-button"]');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should enable button when source language is detected to be different from target language', async () => {
      const sourceLanguage = mockSupportedLanguages[0];
      const targetLanguage = mockSupportedLanguages[1];
      mockAIService.detectLanguage.mockResolvedValue(sourceLanguage as SupportedLanguageCode);

      const textarea = wrapper.getComponent('[data-testid="input-area"]');
      await textarea.setValue(LONG_TEXT);
      const select = wrapper.getComponent('[data-testid="language-selector"]');
      await select.setValue(targetLanguage);

      const button = wrapper.get('[data-testid="process-button"]');
      expect(button.attributes('disabled')).toBeUndefined();
    });

    it('should disable process button when languages are equal and summarize is not selected', async () => {
      const sameLanguage = mockSupportedLanguages[0];
      mockAIService.detectLanguage.mockResolvedValue(sameLanguage as SupportedLanguageCode);

      const textarea = wrapper.getComponent('[data-testid="input-area"]');
      await textarea.setValue(LONG_TEXT);
      const checkbox = wrapper.getComponent('[data-testid="summarize-checkbox"]');
      await checkbox.setValue(false);
      const select = wrapper.getComponent('[data-testid="language-selector"]');
      await select.setValue(sameLanguage);

      const button = wrapper.get('[data-testid="process-button"]');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('should reset button state after processing completes', async () => {
      await setTextAndProcess(wrapper);

      const button = wrapper.get('[data-testid="process-button"]');
      expect(button.text()).toBe('processButton');
      expect(button.attributes('disabled')).toBeUndefined();
    });

    it('should enable button after switching target language during processing', async () => {
      mockAIService.processText.mockReturnValue(new Promise(() => { })); // Never resolves
      const select = wrapper.getComponent('[data-testid="language-selector"]');
      await select.setValue(mockSupportedLanguages[1]);
      await setTextAndProcess(wrapper);
      const button = wrapper.get('[data-testid="process-button"]');
      expect(button.attributes('disabled')).toBeDefined();

      // Change target language during processing
      await select.setValue(mockSupportedLanguages[2]);
      await flushPromises();

      expect(button.attributes('disabled')).toBeUndefined();
      expect(button.text()).toBe('processButton');
    });

    it('should enable process button after typing in input field during processing', async () => {
      mockAIService.processText.mockReturnValue(new Promise(() => { })); // Never resolves
      await setTextAndProcess(wrapper);
      const button = wrapper.get('[data-testid="process-button"]');
      expect(button.attributes('disabled')).toBeDefined();
      // Change text during processing (debe ser diferente para disparar el watch)
      const textarea = wrapper.getComponent('[data-testid="input-area"]');
      await textarea.setValue(LONG_TEXT + ' modificado');
      await flushPromises();

      expect(button.attributes('disabled')).toBeUndefined();
      expect(button.text()).toBe('processButton');
    });

    it('should enable process button when translation fails with an error', async () => {
      mockAIService.processText.mockRejectedValue(new Error(ERROR_MESSAGE));
      await setTextAndProcess(wrapper);

      const button = wrapper.get('[data-testid="process-button"]');
      expect(button.text()).toBe('processButton');
      expect(button.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Model Downloading State', () => {
    it('should show model download message when downloading starts', async () => {
      // Simulate receiving modelStatusUpdate message
      globalThis.dispatchEvent(new CustomEvent('modelStatusUpdate',
        { detail: { state: 'downloading', downloadProgress: 0 } }));
      await flushPromises();

      expect(wrapper.find('[data-testid="model-download-card"]').exists()).toBe(true);
    });

    it('should hide model download message when downloading completes', async () => {
      // Simular finalización de la descarga
      globalThis.dispatchEvent(new CustomEvent('modelStatusUpdate',
        { detail: { state: 'downloading', downloadProgress: 0 } }));
      await flushPromises();
      expect(wrapper.find('[data-testid="model-download-card"]').exists()).toBe(true);

      globalThis.dispatchEvent(new CustomEvent('modelStatusUpdate',
        { detail: { state: 'available' } }));
      await flushPromises();

      expect(wrapper.find('[data-testid="model-download-card"]').exists()).toBe(false);
    });

    it('should hide model download message when source language changes', async () => {
      // Show download message
      globalThis.dispatchEvent(new CustomEvent('modelStatusUpdate', { detail: { state: 'downloading', downloadProgress: 0 } }));
      await flushPromises();
      expect(wrapper.find('[data-testid="model-download-card"]').exists()).toBe(true);

      // Change text (which changes source language detection)
      const textarea = wrapper.getComponent('[data-testid="input-area"]');
      await textarea.setValue('New text to trigger change');

      expect(wrapper.find('[data-testid="model-download-card"]').exists()).toBe(false);
    });

    it('should hide model download message when target language changes', async () => {
      // Show download message
      globalThis.dispatchEvent(new CustomEvent('modelStatusUpdate', { detail: { state: 'downloading', downloadProgress: 0 } }));
      await flushPromises();
      expect(wrapper.find('[data-testid="model-download-card"]').exists()).toBe(true);

      // Change target language
      await wrapper.getComponent('[data-testid="language-selector"]')
        .setValue(mockSupportedLanguages[0]);
      await flushPromises();

      expect(wrapper.find('[data-testid="model-download-card"]').exists()).toBe(false);
    });

    it('should hide model download message when cancel button is clicked', async () => {
      const wrapper = mount(SidepanelApp);
      await flushPromises();

      // Show download message
      globalThis.dispatchEvent(new CustomEvent('modelStatusUpdate', { detail: { state: 'downloading', downloadProgress: 0 } }));
      await flushPromises();
      expect(wrapper.find('[data-testid="model-download-card"]').exists()).toBe(true);

      const cancelButton = wrapper.get('[data-testid="cancel-download-button"]');
      await cancelButton.trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="model-download-card"]').exists()).toBe(false);
    });
  });

  describe('API Availability Warning', () => {
    it.for([
      { APIavailable: true, warniningVisibile: false },
      { APIavailable: false, warniningVisibile: true }
    ])(
      'should make warning visibility $warniningVisibile when native browser API availability is $APIavailable',
      async ({ APIavailable, warniningVisibile }) => {
        mockAIService.checkAPIAvailability.mockResolvedValue(APIavailable);
        // Remount with new mock value
        wrapper.unmount();
        wrapper = mount(SidepanelApp);
        await flushPromises();

        expect(wrapper.find('[data-testid="api-warning-container"]').exists())
          .toBe(warniningVisibile);
      }
    );
  });

  describe('Summarize Functionality', () => {
    it.for([
      { summarize: true },
      { summarize: false }
    ])(
      'should process text with summarize option = $summarize',
      async ({ summarize }) => {
        // Check summarize checkbox
        const checkbox = wrapper.getComponent('[data-testid="summarize-checkbox"]');
        await checkbox.setValue(summarize);

        await setTextAndProcess(wrapper);

        expect(mockAIService.processText).toHaveBeenCalledWith(
          LONG_TEXT,
          expect.objectContaining(
            { summarize },
          ),
        );
      });

    it('should enable process button when languages are equal and summarize is selected', async () => {
      const sameLanguage = mockSupportedLanguages[1];
      mockAIService.detectLanguage.mockResolvedValue(sameLanguage);
      const textarea = wrapper.getComponent('[data-testid="input-area"]');
      await textarea.setValue(LONG_TEXT);
      await flushPromises();
      // Set target language to same as source
      const select = wrapper.getComponent('[data-testid="language-selector"]');
      await select.setValue(sameLanguage);
      await flushPromises();
      // Initially button should be disabled
      const button = wrapper.get('[data-testid="process-button"]');
      expect(button.attributes('disabled')).toBeDefined();

      const checkbox = wrapper.getComponent('[data-testid="summarize-checkbox"]');
      await checkbox.setValue(true);
      await flushPromises();

      // Button should now be enabled
      expect(button.attributes('disabled')).toBeUndefined();
    });

    it('should automatically select summarize when summarizing from the context menu', async () => {
      globalThis.dispatchEvent(new CustomEvent('selectedText',
        { detail: { text: 'Texto', summarize: true } }));
      await flushPromises();

      const checkbox = wrapper.getComponent<typeof VCheckbox>('[data-testid="summarize-checkbox"]');
      expect(checkbox.props('modelValue')).toBe(true);
    });

    it('should deselect summarize when translating from the context menu', async () => {
      const checkbox = wrapper.getComponent<typeof VCheckbox>('[data-testid="summarize-checkbox"]');
      await checkbox.setValue(true);

      globalThis.dispatchEvent(new CustomEvent('selectedText',
        { detail: { text: 'Texto', summarize: false } }));
      await flushPromises();

      expect(checkbox.props('modelValue')).toBe(false);
    });
  });

  describe('Default Language Loading', () => {
    it('should use browser language as default when supported', async () => {
      const browserLanguage = mockSupportedLanguages[1];
      mockLanguageService.getBrowserLanguage.mockReturnValue(browserLanguage);
      // Remount with new mock value
      wrapper.unmount();
      wrapper = mount(SidepanelApp);
      await flushPromises();

      const targetSelect = wrapper.getComponent('[data-testid="language-selector"]');
      expect(targetSelect.text()).toContain(browserLanguage);
    });

    it('should use default target language when browser language is not supported', async () => {
      const browserLanguage = 'xx';
      const fallbackLanguage = mockSupportedLanguages[0]; // La implementación usa el primer valor como respaldo
      mockLanguageService.getBrowserLanguage.mockReturnValue(browserLanguage);
      mockLanguageService.isLanguageSupported.mockReturnValue(false);
      // Remount with new mock value
      wrapper.unmount();
      wrapper = mount(SidepanelApp);
      await flushPromises();

      const select = wrapper.getComponent('[data-testid="language-selector"]');
      expect(select.text()).toContain(fallbackLanguage);
    });

    it('should populate language selector with available languages', () => {
      // No se pudo encontrar forma de verificar que luego de cliquear el v-select
      // los elementos se muestran en el overlay
      // Solo se verifica que el componente recibe todos los idiomas
      const select = wrapper.getComponent<typeof LanguageSelector>('[data-testid="language-selector"]');
      const supportedLanguagesProp = select.props('supportedLanguages');

      expect(supportedLanguagesProp).toHaveLength(mockSupportedLanguages.length);
      mockSupportedLanguages.forEach((lang) => {
        expect(supportedLanguagesProp).toContain(lang);
      });
    });
  });

  describe('Error Handling', () => {
    describe('Unsupported Input Language', () => {
      beforeEach(() => {
        mockAIService.detectLanguage.mockResolvedValue('xx');
        mockLanguageService.isLanguageSupported.mockReturnValue(false);
      });

      it('should show error when unsupported language is detected', async () => {
        expect(wrapper.text()).not.toContain('detectedLanguageNotSupported');

        const textarea = wrapper.getComponent('[data-testid="input-area"]');
        await textarea.setValue(LONG_TEXT);
        await flushPromises();

        expect(wrapper.text()).toContain('detectedLanguageNotSupported');
      });

      it('should hide "unsupported language" error message when text is too short', async () => {
        const textarea = wrapper.getComponent('[data-testid="input-area"]');
        await textarea.setValue(LONG_TEXT);
        await flushPromises();
        expect(wrapper.text()).toContain('detectedLanguageNotSupported');

        await textarea.setValue(SHORT_TEXT);
        await flushPromises();

        expect(wrapper.text()).not.toContain('detectedLanguageNotSupported');
      });

      it('should not hide "unsupported language" error message when process data changes', async () => {
        const textarea = wrapper.getComponent('[data-testid="input-area"]');
        await textarea.setValue(LONG_TEXT);
        await flushPromises();
        expect(wrapper.text()).toContain('detectedLanguageNotSupported');

        const checkbox = wrapper.getComponent('[data-testid="summarize-checkbox"]');
        await checkbox.setValue(true);
        const select = wrapper.getComponent('[data-testid="language-selector"]');
        await select.setValue(mockSupportedLanguages[1]);
        await flushPromises();

        expect(wrapper.text()).toContain('detectedLanguageNotSupported');
      });

      it('should not hide "insufficient text" error message when process data changes', async () => {
        const textarea = wrapper.getComponent('[data-testid="input-area"]');
        await textarea.setValue(SHORT_TEXT);
        await flushPromises();
        expect(wrapper.text()).toContain('insufficientTextForDetection');

        const checkbox = wrapper.getComponent('[data-testid="summarize-checkbox"]');
        await checkbox.setValue(true);
        const select = wrapper.getComponent('[data-testid="language-selector"]');
        await select.setValue(mockSupportedLanguages[1]);
        await flushPromises();

        expect(wrapper.text()).toContain('insufficientTextForDetection');
      });
    });

    it('should show "insufficient text" message when text is too short', async () => {
      const textarea = wrapper.getComponent('[data-testid="input-area"]');
      await textarea.setValue(SHORT_TEXT);

      expect(wrapper.text()).toContain('insufficientTextForDetection');
    });

    it('should hide "insufficient text" message when text is empty', async () => {
      const textarea = wrapper.getComponent('[data-testid="input-area"]');
      await textarea.setValue(SHORT_TEXT);
      await textarea.setValue('');

      expect(wrapper.text()).not.toContain('insufficientTextForDetection');
    });

    it('should show "same language" message when languages are equal and summarize is not selected', async () => {
      const sameLanguage = mockSupportedLanguages[0];
      mockAIService.detectLanguage.mockResolvedValue(sameLanguage);
      const textarea = wrapper.getComponent('[data-testid="input-area"]');
      await textarea.setValue(LONG_TEXT);
      await wrapper.getComponent('[data-testid="language-selector"]').setValue(sameLanguage);

      await wrapper.getComponent('[data-testid="summarize-checkbox"]').setValue(false);
      await flushPromises();

      expect(wrapper.text()).toContain('sameLanguageWarning');
    });

    it('should display error message when translation fails with an error', async () => {
      const errorMessage = ERROR_MESSAGE;
      mockAIService.processText.mockRejectedValue(new Error(errorMessage));

      await setTextAndProcess(wrapper);

      expect(wrapper.get('[data-testid=error-container]').text()).toContain(errorMessage);
    });

    it('should not show an error when processing is cancelled', async () => {
      // Simular que processText devuelve un AbortError (cancelación)
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockAIService.processText.mockRejectedValue(abortError);

      await setTextAndProcess(wrapper);

      const errorMessage = wrapper.find('[data-testid="error-container"]');
      expect(errorMessage.exists()).toBe(false);
    });

    it('should not show an error when language detection is cancelled', async () => {
      // Simular que detectLanguage devuelve un AbortError (cancelación)
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockAIService.detectLanguage.mockRejectedValue(abortError);

      const textarea = wrapper.getComponent('[data-testid="input-area"]');
      await textarea.setValue(LONG_TEXT);
      await flushPromises();

      // Verificar que NO se muestra un error de detección de idioma
      const errorMessage = wrapper.find('[data-testid="error-container"]');
      expect(errorMessage.exists()).toBe(false);
    });
  });

  describe('Cancellation Logic', () => {
    it('should cancel processing when user changes a parameter', async () => {
      const checkbox = wrapper.getComponent('[data-testid="summarize-checkbox"]');
      await checkbox.setValue(false);
      await setTextAndProcess(wrapper);
      mockAIService.cancelProcessing.mockClear();

      await checkbox.setValue(true);

      expect(mockAIService.cancelProcessing).toHaveBeenCalledOnce();
    });
  });
});
