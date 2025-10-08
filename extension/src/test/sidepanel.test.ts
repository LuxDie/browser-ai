import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SidepanelApp } from '../sidepanel/sidepanel';
import { createChromeMock } from './test-utils/chrome-mocks';

describe('SidepanelApp', () => {
  let mockChrome: ReturnType<typeof createChromeMock>;

  beforeEach(async () => {
    vi.useFakeTimers();
    mockChrome = createChromeMock();
    vi.stubGlobal('chrome', mockChrome);
    document.body.innerHTML = '<div id="root"></div>';

    // Mock storage with APIs available by default for most tests
    (mockChrome.storage.local.get as any).mockResolvedValue({
      translatorAPIAvailable: true,
      languageDetectorAPIAvailable: true,
    });

    // Mock response to GET_AVAILABLE_LANGUAGES
    (mockChrome.runtime.sendMessage as any).mockImplementation((message: any) => {
      if (message.type === 'GET_AVAILABLE_LANGUAGES') {
        // Simulate response with available languages
        setTimeout(() => {
          (mockChrome.runtime.onMessage as any).trigger({
            type: 'AVAILABLE_LANGUAGES_RESPONSE',
            data: {
              languages: [
                { code: 'es', name: 'Español' },
                { code: 'en', name: 'English' },
                { code: 'fr', name: 'Français' },
                { code: 'de', name: 'Deutsch' },
                { code: 'it', name: 'Italiano' },
                { code: 'pt', name: 'Português' }
              ]
            }
          });
        }, 0);
      }
      return Promise.resolve();
    });

    new SidepanelApp();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.runAllTimersAsync(); // Ensure all async operations in constructor and init are done
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('should render the initial state correctly', () => {
    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('Browser AI');
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
    const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
    expect(translateButton.disabled).toBe(true);
  });

  it('should show API status on initial load', () => {
    const root = document.getElementById('root');
    expect(root).not.toBeNull();
    expect(root?.innerHTML).toContain('Traductor');
    expect(root?.innerHTML).toContain('Detector de Idioma');
  });

  it('should show translator status after language is detected', async () => {
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    textarea.value = 'This is a test sentence for translation.';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.runAllTimersAsync();

    (mockChrome.runtime.onMessage as any).trigger({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });
    await vi.runAllTimersAsync();

    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('Traductor');
  });


  it('should initialize with correct API availability information', async () => {
    (mockChrome.storage.local.get as any).mockResolvedValue({
      translatorAPIAvailable: true,
      languageDetectorAPIAvailable: true,
      translatorState: 'available',
      languageDetectorState: 'available'
    });
    
    // Re-init for this specific storage state
    new SidepanelApp();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.runAllTimersAsync();

    (mockChrome.runtime.onMessage as any).trigger({
      type: 'API_AVAILABILITY_RESPONSE',
      data: {
        translator: true,
        languageDetector: true
      }
    });
    await vi.runAllTimersAsync();

    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('✅ Traductor');
    expect(root?.innerHTML).toContain('✅ Detector de Idioma');
    expect(root?.innerHTML).not.toContain('⚠️ Las APIs nativas de Chrome no están disponibles');
  });

  it('should handle API availability check failure gracefully', async () => {
    (mockChrome.storage.local.get as any).mockResolvedValue({
      translatorAPIAvailable: false,
      languageDetectorAPIAvailable: false
    });
    
    // Re-init for this specific storage state
    new SidepanelApp();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.runAllTimersAsync();

    (mockChrome.runtime.onMessage as any).trigger({
      type: 'API_AVAILABILITY_RESPONSE',
      data: {
        translator: false,
        languageDetector: false
      }
    });
    await vi.runAllTimersAsync();

    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('❌ Traductor');
    expect(root?.innerHTML).toContain('❌ Detector de Idioma');
    expect(root?.innerHTML).toContain('⚠️ Las APIs nativas de Chrome no están disponibles');
  });

  it('should verify API availability check is called on initialization', () => {
    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({ 
      type: 'CHECK_API_AVAILABILITY' 
    });
    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({ 
      type: 'GET_AVAILABLE_LANGUAGES' 
    });
  });

  describe('Translate Button Behavior', () => {
    it('should show "Traducir" and be disabled when no text is entered', () => {
      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traducir');
      expect(translateButton.disabled).toBe(true);
    });

    it('should show "Traducir" and be disabled for short text without language detection', async () => {
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'Hello';
      textarea.dispatchEvent(new Event('input'));

      await vi.runAllTimersAsync();

      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traducir');
      expect(translateButton.disabled).toBe(true);
    });

    it('should show "Traducir (Detectando idioma...)" and be disabled for long text without language detection', async () => {
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      await vi.runAllTimersAsync();

      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traducir (Detectando idioma...)');
      expect(translateButton.disabled).toBe(true);
    });

    it('should enable button when source language is detected to be different from target language', async () => {
      // Change target language to Spanish to enable translation
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es';
      targetSelect.dispatchEvent(new Event('change'));

      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      await vi.runAllTimersAsync();

      let translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traducir (Detectando idioma...)');
      expect(translateButton.disabled).toBe(true);

      (mockChrome.runtime.onMessage as any).trigger({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });

      await vi.runAllTimersAsync();

      translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traducir');
      // Button should be enabled because source ('en') and target ('es') languages are different
      expect(translateButton.disabled).toBe(false);
    });

    it('should disable button when source language is detected to be the same as target language', async () => {
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      await vi.runAllTimersAsync();

      let translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traducir (Detectando idioma...)');
      expect(translateButton.disabled).toBe(true);

      (mockChrome.runtime.onMessage as any).trigger({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });

      await vi.runAllTimersAsync();

      translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traducir');
      // Button should be disabled because source ('en') and target ('en') languages are the same
      expect(translateButton.disabled).toBe(true);
    });
  });

  describe('Model Availability Flow', () => {
    let mockChrome: ReturnType<typeof createChromeMock>;

    beforeEach(async () => {
      vi.useFakeTimers();
      mockChrome = createChromeMock();
      vi.stubGlobal('chrome', mockChrome);
      document.body.innerHTML = '<div id="root"></div>';

      // Mock storage with APIs available
      (mockChrome.storage.local.get as any).mockResolvedValue({
        translatorAPIAvailable: true,
        languageDetectorAPIAvailable: true,
      });

      new SidepanelApp();
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await vi.runAllTimersAsync();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      document.body.innerHTML = '';
    });


    it('should not show any model status message when model is available', async () => {
      // Configurar idiomas para que se pueda renderizar el estado del modelo
      // Simular que se han detectado los idiomas
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'LANGUAGE_DETECTED',
        data: { language: 'en' }
      });

      await vi.runAllTimersAsync();

      // Cambiar el idioma destino
      const targetLanguageSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetLanguageSelect.value = 'es';
      targetLanguageSelect.dispatchEvent(new Event('change'));

      await vi.runAllTimersAsync();

      // Verificar que inicialmente no se muestra ningún mensaje (estado desconocido)
      const modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer?.innerHTML).toBe('');

      // Simular recepción de mensaje indicando que el modelo está disponible
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'MODEL_AVAILABILITY_RESPONSE',
        data: {
          source: 'en',
          target: 'es',
          status: {
            available: true, // Modelo descargado
            downloading: false
          }
        }
      });

      await vi.runAllTimersAsync();

      // Verificar que NO se muestra ningún mensaje cuando el modelo está disponible
      expect(modelStatusContainer?.innerHTML).toBe('');

      // Simular traducción exitosa
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'TRANSLATION_COMPLETED',
        data: {
          translatedText: 'Este es un texto de prueba traducido',
          sourceLanguage: 'en',
          targetLanguage: 'es'
        }
      });

      await vi.runAllTimersAsync();

      // El modelo disponible debería seguir sin mostrar ningún mensaje después de la traducción
      expect(modelStatusContainer?.innerHTML).toBe('');

      // Y definitivamente NO debería mostrar "Modelo no disponible" ni ningún otro mensaje
      expect(modelStatusContainer?.innerHTML).not.toContain('Modelo no disponible');
      expect(modelStatusContainer?.innerHTML).not.toContain('Modelo en→es disponible');
    });

    it('should allow editing the translated text in the result area', async () => {
      // Simular traducción exitosa
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'TRANSLATION_COMPLETED',
        data: {
          translatedText: 'Texto original traducido',
          sourceLanguage: 'en',
          targetLanguage: 'es'
        }
      });

      await vi.runAllTimersAsync();

      // Verificar que el textarea del resultado existe y contiene el texto traducido
      const resultTextarea = document.getElementById('result-text') as HTMLTextAreaElement;
      expect(resultTextarea).toBeTruthy();
      expect(resultTextarea.value).toBe('Texto original traducido');
      expect(resultTextarea.tagName.toLowerCase()).toBe('textarea');

      // Simular edición del texto por parte del usuario
      resultTextarea.value = 'Texto editado por el usuario';
      resultTextarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Verificar que el textarea mantiene el valor editado
      expect(resultTextarea.value).toBe('Texto editado por el usuario');

      // Verificar que el botón de copiar existe
      const copyButton = document.getElementById('copy-button') as HTMLButtonElement;
      expect(copyButton).toBeTruthy();
    });

  });

  describe('Translation Source Indicator', () => {
    it('should show "Traducido localmente" indicator when using native API', async () => {
      // Simular traducción exitosa con API nativa (usingCloud: false)
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'TRANSLATION_COMPLETED',
        data: {
          translatedText: 'Este es un texto traducido localmente',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          usingCloud: false
        }
      });

      await vi.runAllTimersAsync();

      // Verificar que se muestra el indicador correcto en el DOM
      const resultText = document.getElementById('result-text') as HTMLTextAreaElement;
      expect(resultText).toBeTruthy();
      expect(resultText.value).toBe('Este es un texto traducido localmente');

      // Verificar que aparece el indicador de traducción local
      const resultContainer = document.getElementById('result-container');
      const indicatorElement = resultContainer?.querySelector('.inline-flex.items-center.px-2.py-1.rounded-full');
      expect(indicatorElement).toBeTruthy();
      expect(indicatorElement!.textContent?.trim()).toBe('🔒 Traducido localmente');
    });

    it('should show "Traducido en la nube" indicator when using cloud API', async () => {
      // Simular traducción exitosa con API en la nube (usingCloud: true)
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'TRANSLATION_COMPLETED',
        data: {
          translatedText: 'Este es un texto traducido en la nube',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          usingCloud: true
        }
      });

      await vi.runAllTimersAsync();

      // Verificar que se muestra el indicador correcto en el DOM
      const resultText = document.getElementById('result-text') as HTMLTextAreaElement;
      expect(resultText).toBeTruthy();
      expect(resultText.value).toBe('Este es un texto traducido en la nube');

      // Verificar que aparece el indicador de traducción en la nube
      const resultContainer = document.getElementById('result-container');
      const indicatorElement = resultContainer?.querySelector('.inline-flex.items-center.px-2.py-1.rounded-full');
      expect(indicatorElement).toBeTruthy();
      expect(indicatorElement!.textContent?.trim()).toBe('☁️ Traducido en la nube');
    });

    it('should automatically translate text when selected from context menu', async () => {
      // Change target language to Spanish to enable automatic translation (different from detected 'en')
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es';
      targetSelect.dispatchEvent(new Event('change'));

      // Simulate receiving text from context menu with autoTranslate enabled
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'SELECTED_TEXT_FROM_CONTEXT_MENU',
        data: {
          text: 'This is a test sentence for automatic translation.',
          fromContextMenu: true,
          autoTranslate: true
        }
      });

      // Wait for language detection to complete
      await vi.runAllTimersAsync();

      // Simulate language detection response
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'LANGUAGE_DETECTED',
        data: { language: 'en' }
      });

      // Wait for automatic translation to trigger
      await vi.runAllTimersAsync();

      // Verify that translation was requested
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSLATE_TEXT_REQUEST'
        })
      );

      // Verify the call contains the expected data by checking the mock calls directly
      // TODO: remove lint exceptions
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mock = mockChrome.runtime.sendMessage as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const lastCall = mock.mock.calls[mock.mock.calls.length - 1][0];
      expect(lastCall.data.text).toBe('This is a test sentence for automatic translation.');
      expect(lastCall.data.sourceLanguage).toBe('en');
      expect(lastCall.data.targetLanguage).toBe('es');
    });

    it('should handle text sent directly after panel opens (main flow)', async () => {
      // Change target language to Spanish to enable automatic translation (different from detected 'en')
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es';
      targetSelect.dispatchEvent(new Event('change'));

      // Simulate the main flow: panel opens and then message is sent directly
      const textData = {
        text: 'This is text sent directly after panel opens.',
        fromContextMenu: true,
        autoTranslate: true
      };

      // First, simulate receiving the message directly (main flow)
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'SELECTED_TEXT_FROM_CONTEXT_MENU',
        data: textData
      });

      // Wait for language detection to complete
      await vi.runAllTimersAsync();

      // Simulate language detection response
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'LANGUAGE_DETECTED',
        data: { language: 'en' }
      });

      // Wait for automatic translation to trigger
      await vi.runAllTimersAsync();

      // Verify that the text was loaded into the textarea
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      expect(textarea.value).toBe('This is text sent directly after panel opens.');

      // Verify that translation was requested automatically
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSLATE_TEXT_REQUEST'
        })
      );

      // Verify the call contains the expected data by checking the mock calls directly
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mock = mockChrome.runtime.sendMessage as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const lastCall = mock.mock.calls[mock.mock.calls.length - 1][0];
      expect(lastCall.data.text).toBe('This is text sent directly after panel opens.');
      expect(lastCall.data.sourceLanguage).toBe('en');
      expect(lastCall.data.targetLanguage).toBe('es');
    });
  });

  describe('Language Selector Behavior', () => {
    it('should keep all language options enabled in target selector', async () => {
      // Reset DOM for this test
      document.body.innerHTML = '<div id="root"></div>';

      // Create a fresh mock for this test
      const testMockChrome = createChromeMock();

      // Mock response to GET_AVAILABLE_LANGUAGES
      (testMockChrome.runtime.sendMessage as any).mockImplementation((message: any) => {
        if (message.type === 'GET_AVAILABLE_LANGUAGES') {
          setTimeout(() => {
            (testMockChrome.runtime.onMessage as any).trigger({
              type: 'AVAILABLE_LANGUAGES_RESPONSE',
              data: {
                languages: [
                  { code: 'es', name: 'Español' },
                  { code: 'en', name: 'English' },
                  { code: 'fr', name: 'Français' }
                ]
              }
            });
          }, 0);
        }
        return Promise.resolve();
      });

      vi.stubGlobal('chrome', testMockChrome);

      // Create SidepanelApp instance
      new SidepanelApp();
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await vi.runAllTimersAsync();

      // Simulate language detection (set source language to English)
      (testMockChrome.runtime.onMessage as any).trigger({
        type: 'LANGUAGE_DETECTED',
        data: { language: 'en' }
      });

      // Wait for UI updates
      await vi.runAllTimersAsync();

      // Verify that all options are enabled and show normal names
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      expect(targetSelect).toBeTruthy();

      const englishOption = targetSelect.querySelector('option[value="en"]') as HTMLOptionElement;
      expect(englishOption).toBeTruthy();
      expect(englishOption.disabled).toBe(false);
      expect(englishOption.textContent).toBe('English');

      // Verify that Spanish option is also enabled
      const spanishOption = targetSelect.querySelector('option[value="es"]') as HTMLOptionElement;
      expect(spanishOption).toBeTruthy();
      expect(spanishOption.disabled).toBe(false);
      expect(spanishOption.textContent).toBe('Español');

      // Verify that French option is also enabled
      const frenchOption = targetSelect.querySelector('option[value="fr"]') as HTMLOptionElement;
      expect(frenchOption).toBeTruthy();
      expect(frenchOption.disabled).toBe(false);
      expect(frenchOption.textContent).toBe('Français');

      // Target language should remain as initially set (English in this case)
      expect(targetSelect.value).toBe('en');
    });
  });


  describe('Default Language Loading', () => {
    it('should detect browser language and update selector', async () => {
      // Reset DOM for this test
      document.body.innerHTML = '<div id="root"></div>';

      // Create a fresh mock for this test
      const testMockChrome = createChromeMock();

      // Mock response to GET_AVAILABLE_LANGUAGES
      (testMockChrome.runtime.sendMessage as any).mockImplementation((message: any) => {
        if (message.type === 'GET_AVAILABLE_LANGUAGES') {
          setTimeout(() => {
            (testMockChrome.runtime.onMessage as any).trigger({
              type: 'AVAILABLE_LANGUAGES_RESPONSE',
              data: {
                languages: [
                  { code: 'es', name: 'Español' },
                  { code: 'en', name: 'English' },
                  { code: 'fr', name: 'Français' },
                  { code: 'de', name: 'Deutsch' }
                ]
              }
            });
          }, 0);
        }
        return Promise.resolve();
      });

      vi.stubGlobal('chrome', testMockChrome);

      // Mock navigator.languages to return 'fr' as primary language
      Object.defineProperty(navigator, 'languages', {
        value: ['fr-FR', 'fr', 'en-US'],
        writable: true
      });

      // Create fresh SidepanelApp instance for this test
      new SidepanelApp();
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await vi.runAllTimersAsync();

      // Verify that the target language was detected as 'fr'
      const select = document.getElementById('target-language') as HTMLSelectElement;
      expect(select).toBeTruthy();
      expect(select.value).toBe('fr');
    });

    it('should fallback to Spanish when detected language is not supported', async () => {
      // Reset DOM for this test
      document.body.innerHTML = '<div id="root"></div>';

      // Create a fresh mock for this test
      const testMockChrome = createChromeMock();

      // Mock response to GET_AVAILABLE_LANGUAGES
      (testMockChrome.runtime.sendMessage as any).mockImplementation((message: any) => {
        if (message.type === 'GET_AVAILABLE_LANGUAGES') {
          setTimeout(() => {
            (testMockChrome.runtime.onMessage as any).trigger({
              type: 'AVAILABLE_LANGUAGES_RESPONSE',
              data: {
                languages: [
                  { code: 'es', name: 'Español' },
                  { code: 'en', name: 'English' },
                  { code: 'fr', name: 'Français' },
                  { code: 'de', name: 'Deutsch' }
                ]
              }
            });
          }, 0);
        }
        return Promise.resolve();
      });

      vi.stubGlobal('chrome', testMockChrome);

      // Mock navigator.languages to return unsupported language
      Object.defineProperty(navigator, 'languages', {
        value: ['xx-XX', 'xx'],
        writable: true
      });

      new SidepanelApp();
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await vi.runAllTimersAsync();

      // Verify that the target language was set to 'es' (fallback)
      const select = document.getElementById('target-language') as HTMLSelectElement;
      expect(select).toBeTruthy();
      expect(select.value).toBe('es');
    });

    it('should handle navigator errors gracefully and use Spanish fallback', async () => {
      // Reset DOM for this test
      document.body.innerHTML = '<div id="root"></div>';

      // Create a fresh mock for this test
      const testMockChrome = createChromeMock();

      // Mock response to GET_AVAILABLE_LANGUAGES
      (testMockChrome.runtime.sendMessage as any).mockImplementation((message: any) => {
        if (message.type === 'GET_AVAILABLE_LANGUAGES') {
          setTimeout(() => {
            (testMockChrome.runtime.onMessage as any).trigger({
              type: 'AVAILABLE_LANGUAGES_RESPONSE',
              data: {
                languages: [
                  { code: 'es', name: 'Español' },
                  { code: 'en', name: 'English' },
                  { code: 'fr', name: 'Français' },
                  { code: 'de', name: 'Deutsch' }
                ]
              }
            });
          }, 0);
        }
        return Promise.resolve();
      });

      vi.stubGlobal('chrome', testMockChrome);

      // Mock navigator to cause error
      const originalNavigator = globalThis.navigator;
      Object.defineProperty(globalThis, 'navigator', {
        value: undefined,
        writable: true
      });

      new SidepanelApp();
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await vi.runAllTimersAsync();

      // Verify that the target language was set to 'es' (fallback)
      const select = document.getElementById('target-language') as HTMLSelectElement;
      expect(select).toBeTruthy();
      expect(select.value).toBe('es');

      // Restore navigator
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        writable: true
      });
    });
  });
});
