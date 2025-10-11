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
    // Re-init for this specific API state
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
    // Re-init for this specific API state
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

    it('should show "Traducir (Traduciendo...)" when translation is in progress', async () => {
      // Change target language to Spanish to enable translation (different from detected 'en')
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es';
      targetSelect.dispatchEvent(new Event('change'));

      // Setup: Enter text and detect language to enable translation
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      await vi.runAllTimersAsync();

      // Simulate language detection
      (mockChrome.runtime.onMessage as any).trigger({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });

      await vi.runAllTimersAsync();

      // Verify button is enabled initially
      let translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.disabled).toBe(false);

      // Simulate translation start by clicking the button
      translateButton.click();

      // Wait for the translation to start (isLoading should be true)
      await vi.runAllTimersAsync();

      // Verify the button shows loading state
      translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traduciendo...');
      expect(translateButton.disabled).toBe(true);
    });

    it('should show "Traducir (Traduciendo...) and disable button when downloading model', async () => {

      await vi.runAllTimersAsync();

      // Setup: Enter text and detect language to enable translation
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      await vi.runAllTimersAsync();

      // Simulate language detection
      (mockChrome.runtime.onMessage as any).trigger({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });

      await vi.runAllTimersAsync();

      // Select target language
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es';
      targetSelect.dispatchEvent(new Event('change'));
      
      await vi.runAllTimersAsync();

      // Verify button is enabled initially
      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.disabled).toBe(false);

      // Simulate translation start by clicking the button
      translateButton.click();

      // Wait for the translation to start (isLoading should be true)
      await vi.runAllTimersAsync();

      // Simulate model downloading state
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'MODEL_AVAILABILITY_RESPONSE',
        data: {
          source: 'en',
          target: 'es',
          status: {
            available: false,
            downloading: true
          }
        }
      });

      await vi.runAllTimersAsync();

      // Verify button is disabled when model is downloading
      expect(translateButton.disabled).toBe(true);
      expect(translateButton.textContent?.trim()).toBe('Traduciendo...');

      // Verify that model download message is shown
      const modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer?.innerHTML).toContain('Descargando modelo');
    });

    it('should show "Traducir (No disponible)" when translation is not available', async () => {
      // Change target language to Spanish to enable translation (different from detected 'en')
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es';
      targetSelect.dispatchEvent(new Event('change'));

      // Setup: Enter text and detect language to enable translation
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      await vi.runAllTimersAsync();

      // Simulate language detection
      (mockChrome.runtime.onMessage as any).trigger({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });

      await vi.runAllTimersAsync();

      // Verify button is enabled initially
      let translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.disabled).toBe(false);
      expect(translateButton.textContent?.trim()).toBe('Traducir');

      // Simulate translation start by clicking the button
      translateButton.click();

      // Wait for the translation to start
      await vi.runAllTimersAsync();

      // Simulate translation error
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'TRANSLATION_ERROR',
        data: { error: 'Translation service unavailable' }
      });

      await vi.runAllTimersAsync();

      // Verify the button shows error state
      translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traducir (No disponible)');
      expect(translateButton.disabled).toBe(true);
    });

    it('should enable button after switching target language', async () => {
      
      // Setup: Enter text and detect language
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      await vi.runAllTimersAsync();
      
      // Simulate language detection
      (mockChrome.runtime.onMessage as any).trigger({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });
      
      await vi.runAllTimersAsync();

      // Select target language
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es';
      targetSelect.dispatchEvent(new Event('change'));
      
      await vi.runAllTimersAsync();
      // Verify button is enabled initially
      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.disabled).toBe(false);

      // Simulate translation start by clicking the button
      translateButton.click();

      // Wait for the translation to start (isLoading should be true)
      await vi.runAllTimersAsync();
      
      // Change target to French
      targetSelect.value = 'fr';
      targetSelect.dispatchEvent(new Event('change'));

      await vi.runAllTimersAsync();

      // Button should be re-enabled after switching target language
      expect(translateButton.disabled).toBe(false);
      expect(translateButton.textContent?.trim()).toBe('Traducir');
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


    it('should not show any model status message when model is available or downloadable', async () => {
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
        type: 'SELECTED_TEXT',
        data: {
          text: 'This is a test sentence for automatic translation.',
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

      // Verify that translation was requested with correct data
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'TRANSLATE_TEXT_REQUEST',
        data: {
          text: 'This is a test sentence for automatic translation.',
          sourceLanguage: 'en',
          targetLanguage: 'es'
        }
      });
    });

    it('should handle text sent directly after panel opens (main flow)', async () => {
      // Change target language to Spanish to enable automatic translation (different from detected 'en')
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es';
      targetSelect.dispatchEvent(new Event('change'));

      // Simulate the main flow: panel opens and then message is sent directly
      const textData = {
        text: 'This is text sent directly after panel opens.',
        autoTranslate: true
      };

      // First, simulate receiving the message directly (main flow)
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'SELECTED_TEXT',
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

      // Verify that translation was requested automatically with correct data
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'TRANSLATE_TEXT_REQUEST',
        data: {
          text: 'This is text sent directly after panel opens.',
          sourceLanguage: 'en',
          targetLanguage: 'es'
        }
      });
    });
  });

  describe('Translation in Progress State', () => {
    it('should cancel translation when target language changes', async () => {
      // Setup: Add text and detect source language
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a test sentence for translation.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      await vi.runAllTimersAsync();

      // Simulate language detection
      (mockChrome.runtime.onMessage as any).trigger({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });
      await vi.runAllTimersAsync();

      // Ensure target language is different from source
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es'; // Different from detected 'en'
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Now simulate translation start by clicking the button
      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      translateButton.click();

      await vi.runAllTimersAsync();

      // Verify that translation was started
      expect(translateButton.disabled).toBe(true);
      expect(translateButton.textContent?.trim()).toBe('Traduciendo...');

      // Change target language again (this should cancel translation)
      targetSelect.value = 'fr';
      targetSelect.dispatchEvent(new Event('change'));

      await vi.runAllTimersAsync();

      // Verify that translation was cancelled
      expect(translateButton.disabled).toBe(false);
      expect(translateButton.textContent?.trim()).toBe('Traducir');
    });
  });

  describe('Language Change Behavior', () => {
    it('should send cancel message when target language changes', async () => {
      // Change target language (should always send cancel message)
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'fr';
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Verify that cancel message was sent
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'CANCEL_PENDING_TRANSLATIONS'
      });
    });

    it('should send cancel message when text changes', async () => {
      // Change text
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a test sentence for translation.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      await vi.runAllTimersAsync();

      // Verify that cancel message was sent
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'CANCEL_PENDING_TRANSLATIONS'
      });
    });
  });

  describe('Model Downloading State', () => {
    it('should show model download message when downloading starts', async () => {
      // Simulate model download start
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'MODEL_DOWNLOADING',
        data: { source: 'en', target: 'es', progress: 0 }
      });
      await vi.runAllTimersAsync();

      // Verify that model download message is shown
      const modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer).toBeTruthy();
      expect(modelStatusContainer?.innerHTML).toContain('📥 Descargando modelo');
      expect(modelStatusContainer?.innerHTML).toContain('en-es');
    });

    it('should hide model download message when MODEL_DOWNLOAD_CANCELLED is received', async () => {
      // Simulate model download start
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'MODEL_DOWNLOADING',
        data: { source: 'en', target: 'es', progress: 0 }
      });
      await vi.runAllTimersAsync();

      // Verify message is shown
      let modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer?.innerHTML).toBeTruthy();

      // Simulate model download cancellation
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'MODEL_DOWNLOAD_CANCELLED',
        data: { source: 'en', target: 'es' }
      });
      await vi.runAllTimersAsync();

      // Verify that model download message is hidden
      modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer?.innerHTML).toBeFalsy();
    });

    it('should not activate loading state when model download completes without pending translation', async () => {
      // Setup: Simulate initial state with text and languages configured
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a test sentence for translation.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      await vi.runAllTimersAsync();
      
      // Simulate language detection
      (mockChrome.runtime.onMessage as any).trigger({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });
      await vi.runAllTimersAsync();

      // Set target language to Spanish (different from detected 'en')
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es';
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Verify button is enabled (source 'en' != target 'es')
      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.disabled).toBe(false);

      // Simulate model download completion (this should NOT activate loading state)
      (mockChrome.runtime.onMessage as any).trigger({
        type: 'MODEL_DOWNLOAD_COMPLETED',
        data: { source: 'en', target: 'es' }
      });
      await vi.runAllTimersAsync();

      // Verify that button remains enabled (no loading state activated)
      expect(translateButton.disabled).toBe(false);
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
