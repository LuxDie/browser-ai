import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as sidepanelModule from '../entrypoints/sidepanel/sidepanel';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { browser } from 'wxt/browser';

// Mock del módulo de mensajería
vi.mock('../messaging', () => ({
  sendMessage: vi.fn()
}));

import { sendMessage } from '../messaging';

const { SidepanelApp } = sidepanelModule;

type RuntimeMessageListener = Parameters<typeof browser.runtime.onMessage.addListener>[0];
type RuntimeMessage = Parameters<RuntimeMessageListener>[0];
type RuntimeMessageSender = Parameters<RuntimeMessageListener>[1];
type RuntimeSendResponse = Parameters<RuntimeMessageListener>[2];

// Helper function to simulate browser runtime message events
// NOTA: Esta función simula mensajes PUSH (notificaciones unidireccionales del background al sidepanel)
// Los mensajes request-response (sidepanel -> background) se mockean directamente con sendMessage
const createSendResponse = (): RuntimeSendResponse => {
  return () => {
    return undefined;
  };
};

const defaultSender: RuntimeMessageSender = {
  tab: {
    id: 1,
    index: 0,
    highlighted: false,
    pinned: false,
    windowId: 0,
    active: true,
    audible: false,
    autoDiscardable: true,
    discarded: false,
    incognito: false,
    mutedInfo: { muted: false },
    groupId: -1,
    lastAccessed: 0,
    selected: false,
    frozen: false
  } satisfies NonNullable<RuntimeMessageSender['tab']>,
  frameId: 0
};

const simulateRuntimeMessage = (
  message: RuntimeMessage,
  sender: RuntimeMessageSender = defaultSender
): void => {
  fakeBrowser.runtime.onMessage.trigger(message, sender, createSendResponse());
};


// Mock implementation for request-response messages (sidepanel -> background)
// Estos mensajes usan el patrón request-response de @webext-core/messaging
interface TranslateTextRequestPayload {
  text?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

const isTranslateTextRequestPayload = (payload: unknown): payload is TranslateTextRequestPayload => {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    ('text' in candidate && typeof candidate.text === 'string') ||
    ('sourceLanguage' in candidate && typeof candidate.sourceLanguage === 'string') ||
    ('targetLanguage' in candidate && typeof candidate.targetLanguage === 'string')
  );
};

const defaultSendMessageImplementation = (messageName: string, data?: unknown) => {
  switch (messageName) {
    case 'cancelPendingTranslations':
      return Promise.resolve({ cancelled: true });
    case 'checkAPIAvailability':
      return Promise.resolve({ translator: true, languageDetector: true });
    case 'detectLanguage':
      return Promise.resolve({ language: 'en' });
    case 'getAvailableLanguages':
      return Promise.resolve({
        languages: [
          { code: 'es', name: 'Español' },
          { code: 'en', name: 'English' },
          { code: 'fr', name: 'Français' },
          { code: 'de', name: 'Deutsch' },
          { code: 'it', name: 'Italiano' },
          { code: 'pt', name: 'Português' }
        ]
      });
    case 'translateTextRequest':
      return new Promise((resolve) => {
        const payload = isTranslateTextRequestPayload(data) ? data : {};
        setTimeout(() => {
          const translatedText = typeof payload.text === 'string'
            ? `${payload.text} (translated)`
            : 'Texto traducido';
          resolve({
            translatedText,
            sourceLanguage: typeof payload.sourceLanguage === 'string' ? payload.sourceLanguage : 'en',
            targetLanguage: typeof payload.targetLanguage === 'string' ? payload.targetLanguage : 'es',
            usingCloud: false
          });
        }, 50);
      });
    default:
      return Promise.resolve();
  }
};

describe('SidepanelApp', () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="root"></div>';

    // Mock sendMessage function responses
    (sendMessage as any).mockImplementation(defaultSendMessageImplementation);

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

    simulateRuntimeMessage({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });
    await vi.runAllTimersAsync();

    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('Traductor');
  });


  it('should initialize with correct API availability information', async () => {
    // Re-init for this specific API state
    new SidepanelApp();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.runAllTimersAsync();

    // Simulate API availability response
    simulateRuntimeMessage({
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
    // Override sendMessage mock for this test to return failure
    (sendMessage as any).mockImplementation((messageName: string) => {
      if (messageName === 'checkAPIAvailability') {
        return Promise.resolve({ translator: false, languageDetector: false });
      }
      return defaultSendMessageImplementation(messageName);
    });

    // Re-init for this specific API state
    new SidepanelApp();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.runAllTimersAsync();

    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('❌ Traductor');
    expect(root?.innerHTML).toContain('❌ Detector de Idioma');
    expect(root?.innerHTML).toContain('⚠️ Las APIs nativas de Chrome no están disponibles');

    // Restore the default mock
    (sendMessage as any).mockImplementation(defaultSendMessageImplementation);
  });

  it('should verify API availability check is called on initialization', () => {
    expect(sendMessage).toHaveBeenCalledWith('checkAPIAvailability');
    expect(sendMessage).toHaveBeenCalledWith('getAvailableLanguages');
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
      // Override the mock to delay the language detection response
      (sendMessage as any).mockImplementation((messageName: string, data?: unknown) => {
        if (messageName === 'detectLanguage') {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ language: 'en' }), 1000); // Delay response
          });
        }
        return defaultSendMessageImplementation(messageName, data);
      });

      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      // Wait a very short time for the UI to update
      await vi.advanceTimersByTimeAsync(10);

      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traducir (Detectando idioma...)');
      expect(translateButton.disabled).toBe(true);
      
      // Restore the default mock
      (sendMessage as any).mockImplementation(defaultSendMessageImplementation);
    });

    it('should enable button when source language is detected to be different from target language', async () => {
      // Add text to the textarea first
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a test sentence for translation.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Change target language to Spanish to enable translation
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es';
      targetSelect.dispatchEvent(new Event('change'));
      simulateRuntimeMessage({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });

      await vi.runAllTimersAsync();

      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traducir');
      // Button should be enabled because source ('en') and target ('es') languages are different
      expect(translateButton.disabled).toBe(false);
    });

    it('should disable button when source language is detected to be the same as target language', async () => {
      // Add text to the textarea first
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a test sentence for translation.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      await vi.runAllTimersAsync(); // Wait for language detection to complete

      // Set target language to English (same as detected source) to test disabled state
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'en';
      targetSelect.dispatchEvent(new Event('change'));

      await vi.runAllTimersAsync(); // Wait for target language change to complete

      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
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
      simulateRuntimeMessage({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });

      await vi.runAllTimersAsync();

      // Verify button is enabled initially
      let translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.disabled).toBe(false);

      // Simulate translation start by clicking the button
      translateButton.click();

      // Check immediately after click to see loading state
      await vi.advanceTimersByTimeAsync(0);

      // Verify the button shows loading state
      translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.textContent?.trim()).toBe('Traduciendo...');
      expect(translateButton.disabled).toBe(true);
    });

    it('should disable button when model is downloading', async () => {

      await vi.runAllTimersAsync();

      // Setup: Enter text and detect language to enable translation
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      await vi.runAllTimersAsync();

      // Simulate language detection
      simulateRuntimeMessage({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });

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
      simulateRuntimeMessage({
        type: 'MODEL_DOWNLOADING',
        data: {
          source: 'en',
          target: 'es',
          progress: 0
        }
      });

      await vi.runAllTimersAsync();

      // Verify button is disabled when model is downloading
      expect(translateButton.disabled).toBe(true);

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
      simulateRuntimeMessage({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });

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
      simulateRuntimeMessage({
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
      await vi.advanceTimersByTimeAsync(0);

      // Verify button is disabled
      expect(translateButton.disabled).toBe(true);
      
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
    beforeEach(async () => {
      fakeBrowser.reset();
      vi.useFakeTimers();
      document.body.innerHTML = '<div id="root"></div>';

      // Mock sendMessage function responses
      (sendMessage as any).mockImplementation(defaultSendMessageImplementation);

      new SidepanelApp();
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await vi.runAllTimersAsync();
    });

    afterEach(() => {
      vi.useRealTimers();
      document.body.innerHTML = '';
    });


    it('should not show any model status message when model is available or downloadable', async () => {
      // Configurar idiomas para que se pueda renderizar el estado del modelo
      // Simular que se han detectado los idiomas
      simulateRuntimeMessage({
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
      simulateRuntimeMessage({
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
      simulateRuntimeMessage({
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
      simulateRuntimeMessage({
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
      simulateRuntimeMessage({
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
      expect(indicatorElement?.textContent?.trim()).toBe('🔒 Traducido localmente');
    });

    it('should show "Traducido en la nube" indicator when using cloud API', async () => {
      // Simular traducción exitosa con API en la nube (usingCloud: true)
      simulateRuntimeMessage({
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
      expect(indicatorElement?.textContent?.trim()).toBe('☁️ Traducido en la nube');
    });

    it('should automatically translate text when selected from context menu', async () => {
      // Change target language to Spanish to enable automatic translation (different from detected 'en')
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es';
      targetSelect.dispatchEvent(new Event('change'));
      
      // Simulate receiving text from context menu with autoTranslate enabled
      simulateRuntimeMessage({
        type: 'SELECTED_TEXT',
        data: {
          text: 'This is a test sentence for automatic translation.',
          autoTranslate: true
        }
      });

      // Wait for language detection to complete
      await vi.runAllTimersAsync();

      // Simulate language detection response
      simulateRuntimeMessage({
        type: 'LANGUAGE_DETECTED',
        data: { language: 'en' }
      });

      // Wait for automatic translation to trigger
      await vi.runAllTimersAsync();

      // Verify that translation was requested with correct data
      expect(sendMessage).toHaveBeenCalledWith('translateTextRequest', {
        text: 'This is a test sentence for automatic translation.',
        sourceLanguage: 'en',
        targetLanguage: 'es'
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
      simulateRuntimeMessage({
        type: 'SELECTED_TEXT',
        data: textData
      });

      // Wait for language detection to complete
      await vi.runAllTimersAsync();

      // Simulate language detection response
      simulateRuntimeMessage({
        type: 'LANGUAGE_DETECTED',
        data: { language: 'en' }
      });

      // Wait for automatic translation to trigger
      await vi.runAllTimersAsync();

      // Verify that the text was loaded into the textarea
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      expect(textarea.value).toBe('This is text sent directly after panel opens.');

      // Verify that translation was requested automatically with correct data
      expect(sendMessage).toHaveBeenCalledWith('translateTextRequest', {
        text: 'This is text sent directly after panel opens.',
        sourceLanguage: 'en',
        targetLanguage: 'es'
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
      simulateRuntimeMessage({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });
      await vi.runAllTimersAsync();

      // Ensure target language is different from source
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'es'; // Different from detected 'en'
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Now simulate translation start by clicking the button
      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      translateButton.click();

      // Don't wait for all timers - check immediately after click to see loading state
      await vi.advanceTimersByTimeAsync(0);

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
      expect(sendMessage).toHaveBeenCalledWith('cancelPendingTranslations');
    });

    it('should send cancel message when text changes', async () => {
      // Change text
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a test sentence for translation.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      await vi.runAllTimersAsync();

      // Verify that cancel message was sent
      expect(sendMessage).toHaveBeenCalledWith('cancelPendingTranslations');
    });
  });

  describe('Model Downloading State', () => {
    it('should show model download message when downloading starts', async () => {
      // Simulate model download start
      simulateRuntimeMessage({
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
      simulateRuntimeMessage({
        type: 'MODEL_DOWNLOADING',
        data: { source: 'en', target: 'es', progress: 0 }
      });
      await vi.runAllTimersAsync();

      // Verify message is shown
      let modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer?.innerHTML).toBeTruthy();

      // Simulate model download cancellation
      simulateRuntimeMessage({
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
      simulateRuntimeMessage({ type: 'LANGUAGE_DETECTED', data: { language: 'en' } });
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
      simulateRuntimeMessage({
        type: 'MODEL_DOWNLOAD_COMPLETED',
        data: { source: 'en', target: 'es' }
      });
      await vi.runAllTimersAsync();

      // Verify that button remains enabled (no loading state activated)
      expect(translateButton.disabled).toBe(false);
    });
  });


  describe('Default Language Loading', () => {

    beforeEach(() => {
      fakeBrowser.reset();
      vi.useFakeTimers();
      document.body.innerHTML = '<div id="root"></div>';

      // Mock sendMessage function responses
      (sendMessage as any).mockImplementation(defaultSendMessageImplementation);
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      document.body.innerHTML = '';
      vi.restoreAllMocks();
    });

    it('should use browser language as default target when it is supported', async () => {
      // Mock getAvailableLanguages to return languages including 'en'
      const mockGetAvailableLanguages = vi.fn().mockReturnValue(['es', 'en', 'fr', 'de']);
      vi.doMock('../core', () => ({
        getAvailableLanguages: mockGetAvailableLanguages,
        getLanguageName: vi.fn()
      }));
      
      // Mock browser language to return 'en'
      vi.stubGlobal('navigator', {
        ...navigator,
        languages: ['en-US', 'en']
      });

      // Create instance - it should automatically detect and set browser language
      new SidepanelApp();
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await vi.runAllTimersAsync();
      
      // Verify the selected value is 'en' (detected from browser)
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      expect(targetSelect.value).toBe('en');
    });

    it('should use default language (es) when browser language is not supported', async () => {
      // Mock getAvailableLanguages to return languages NOT including 'ja'
      const mockGetAvailableLanguages = vi.fn().mockReturnValue(['es', 'en', 'fr', 'de']);
      vi.doMock('../core', () => ({
        getAvailableLanguages: mockGetAvailableLanguages,
        getLanguageName: vi.fn()
      }));

      // Mock browser language to return 'ja' (Japanese, not supported)
      vi.stubGlobal('navigator', {
        ...navigator,
        languages: ['ja-JP', 'ja']
      });

      // Create instance - it should use default language when browser language is not supported
      new SidepanelApp();
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await vi.runAllTimersAsync();

      // Verify the selected value is the default fallback language 'es'
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      expect(targetSelect.value).toBe('es');
    });

    it('should populate language selector with available languages', async () => {
      // Create instance for this test
      new SidepanelApp();
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await vi.runAllTimersAsync();

      const select = document.getElementById('target-language') as HTMLSelectElement;
      expect(select).toBeTruthy();
      
      // Verify that the selector has options
      expect(select.options.length).toBeGreaterThan(0);
      
      // Verify some expected languages are present
      const optionValues = Array.from(select.options).map(opt => opt.value);
      expect(optionValues).toContain('es');
      expect(optionValues).toContain('en');
      expect(optionValues).toContain('fr');
    });
  });
});
