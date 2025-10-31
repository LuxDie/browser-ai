import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

import {
  onMessage,
  sendMessage,
  removeMessageListeners
} from '@/entrypoints/background/messaging';
import { LanguageCode } from '@/entrypoints/background';
import { SidepanelApp } from '@/entrypoints/sidepanel/sidepanel';
import { getAIService } from '@/entrypoints/background/ai/ai.service';

interface MessageHandlerSpies {
  checkAPIAvailability: MockInstance
  getAvailableLanguages: MockInstance
  getBrowserLanguage: MockInstance
  detectLanguage: MockInstance
  cancelPendingTranslations: MockInstance
  sidepanelReady: MockInstance
}

vi.mock(import('@/entrypoints/background/ai/ai.service'), () => {
  const mockAIService = { processText: vi.fn(() => Promise.resolve('Texto procesado')) };
  return {
    getAIService() { return mockAIService; },
    registerAIService(): any {}
  };
});

function resetDOM() {
  document.body.innerHTML = '<div id="root"></div>';
}

const defaultAvailableLanguages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' }
];

const mockAIService = vi.mocked(getAIService());

// TODO: mejorar tipo `any`
const registerDefaultMessageHandlers = (overrides: Record<string, any> = {}): MessageHandlerSpies => {
  const checkAPIAvailabilitySpy = vi.fn(overrides.checkAPIAvailability ?? (() => true));
  const getAvailableLanguagesSpy = vi.fn(overrides.getAvailableLanguages ?? (() => ({
    languages: defaultAvailableLanguages
  })));
  const getBrowserLanguageSpy = vi.fn(overrides.getBrowserLanguage ?? (() => 'es'));
  const detectLanguageSpy = vi.fn(overrides.detectLanguage ?? (() => Promise.resolve({ languageCode: 'en' })));
  const translateTextRequestSpy = vi.fn(overrides.translateTextRequest ??
    ((data: { text: string; targetLanguage: string; sourceLanguage: string }) => {
    return Promise.resolve(`${data.text} (translated)`);
  }));
  const cancelPendingTranslationsSpy = vi.fn(overrides.cancelPendingTranslations ?? (() => ({ cancelled: true })));
  const sidepanelReadySpy = vi.fn(overrides.sidepanelReady ?? (() => {}));

  onMessage('checkAPIAvailability', checkAPIAvailabilitySpy as any);
  onMessage('getAvailableLanguages', getAvailableLanguagesSpy as any);
  onMessage('getBrowserLanguage', getBrowserLanguageSpy as any);
  onMessage('detectLanguage', detectLanguageSpy as any);
  onMessage('translateText', translateTextRequestSpy as any);
  onMessage('cancelPendingTranslations', cancelPendingTranslationsSpy as any);
  onMessage('sidepanelReady', sidepanelReadySpy as any);

  return {
    checkAPIAvailability: checkAPIAvailabilitySpy,
    getAvailableLanguages: getAvailableLanguagesSpy,
    getBrowserLanguage: getBrowserLanguageSpy,
    detectLanguage: detectLanguageSpy,
    cancelPendingTranslations: cancelPendingTranslationsSpy,
    sidepanelReady: sidepanelReadySpy
  };
};

async function setTextAndProcess(): Promise<void> {
      // Establecer texto y procesar
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    const processButton = document.getElementById('process-button') as HTMLButtonElement;
    textarea.value = 'This is a longer text that should trigger language detection';
    textarea.dispatchEvent(new Event('input'));
    await vi.runAllTimersAsync();
    processButton.click();
    await vi.runAllTimersAsync();
}

async function initSidepanelApp(overrides: Record<string, any> = {}): Promise<MessageHandlerSpies> {
  resetDOM();
  removeMessageListeners();
  const messageHandlerSpies = registerDefaultMessageHandlers(overrides);
  new SidepanelApp();
  await vi.runAllTimersAsync();
  return messageHandlerSpies;
}

describe('SidepanelApp', () => {
  let messageHandlerSpies: MessageHandlerSpies;

  beforeEach(async () => {
    fakeBrowser.reset();
    vi.useFakeTimers();

    messageHandlerSpies = await initSidepanelApp();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    removeMessageListeners();
  });

  it('should render the initial state correctly', () => {
    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('extName');
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
    const processButton = document.getElementById('process-button') as HTMLButtonElement;
    expect(processButton.disabled).toBe(true);
  });

  it('should check API availability on initialization', () => {
    expect(messageHandlerSpies.checkAPIAvailability).toHaveBeenCalled();
  });

  it('should send sidepanelReady message after initialization', () => {
    expect(messageHandlerSpies.sidepanelReady).toHaveBeenCalled();
  });

  it('should show detected language after text input', async () => {
    const testLanguageCode: LanguageCode = 'fr';
    messageHandlerSpies.detectLanguage.mockResolvedValue({ languageCode: testLanguageCode });
    await setTextAndProcess();

    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('detectedLanguage');
    expect(root?.innerHTML).toContain(testLanguageCode);
  });

  it('should show "Procesado localmente" indicator when using native API', async () => {
    // Asegurar que el mock retorna un valor
    mockAIService.processText.mockResolvedValue('Texto procesado correctamente');

    // Establecer texto y procesar
    const root = document.getElementById('root');
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    textarea.value = 'This is a long enough text to trigger language detection and it should work properly.';
    textarea.dispatchEvent(new Event('input'));
    await vi.runAllTimersAsync();
    
    expect(root?.innerHTML).toContain('detectedLanguage');
  });

  it('should show "localProcessingBadge" indicator when using native API', async () => {
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    const processButton = document.getElementById('process-button') as HTMLButtonElement;
    textarea.value = 'This is a test text for processing';
    textarea.dispatchEvent(new Event('input'));
    await vi.runAllTimersAsync();
    processButton.click();
    await vi.runAllTimersAsync();

    // Verificar que aparece el indicador de procesamiento local
    const indicatorElement = document.getElementById('processing-source');
    // TODO: investigar y quizás reportar bug de tseslint
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    expect(indicatorElement?.textContent?.trim()).toBe('localProcessingBadge');
  });

  it('should automatically detect language from text selected from context menu', async () => {
    // Simular recepción de texto desde menú contextual
    await sendMessage('selectedText', { text: 'This is a test sentence for automatic translation.', summarize: false });
    // Esperar a que se active la traducción automática
    await vi.runAllTimersAsync();

    // Verificar que se solicitó la traducción con los datos correctos
    expect(messageHandlerSpies.detectLanguage).toHaveBeenCalled();
  });

  it('should automatically process text when selected from context menu', async () => {
    // Simular recepción de texto desde menú contextual
    await sendMessage('selectedText', { text: 'This is a test sentence for automatic translation.', summarize: false });
    // Esperar a que se active el procesamiento automático
    await vi.runAllTimersAsync();
    expect(mockAIService.processText).toHaveBeenCalledWith(
      'This is a test sentence for automatic translation.',
      {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      }
    );
  });

  it('should cancel translation when target language changes', async () => {
    // Cambiar idioma destino (esto debería cancelar la traducción)
    const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
    targetSelect.value = 'fr';
    targetSelect.dispatchEvent(new Event('change'));
    await vi.runAllTimersAsync();

    // Verificar que la traducción fue cancelada
    expect(messageHandlerSpies.cancelPendingTranslations).toHaveBeenCalled();
  });

  it('should cancel translation when text changes', async () => {
    // Cambiar texto
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    textarea.value = 'This is a test sentence for translation.';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.runAllTimersAsync();

    // Verificar que se envió el mensaje de cancelación
    expect(messageHandlerSpies.cancelPendingTranslations).toHaveBeenCalled();
  });

  describe('Process Button Behavior', () => {
    it('should be disabled when no text is entered', () => {
      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      expect(processButton.disabled).toBe(true);
    });

    it('should be disabled for too short text for language detection', async () => {
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'Hello';
      textarea.dispatchEvent(new Event('input'));

      await vi.runAllTimersAsync();

      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      expect(processButton.disabled).toBe(true);
    });

    it('should be disabled while language detection is in progress', async () => {
      // Reemplazar `detectLanguage` para que no se resuelva
      messageHandlerSpies.detectLanguage.mockReturnValue(new Promise(() => {}));

      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      // Esperar un tiempo muy corto para que se actualice la UI
      await vi.runAllTimersAsync();

      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      expect(processButton.disabled).toBe(true);
    });

    it('should enable button when source language is detected to be different from target language', async () => {
      const sourceLanguage = 'fr';
      const targetLanguage = 'de';

      // Agregar texto al textarea primero
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a test sentence for translation.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      messageHandlerSpies.detectLanguage.mockResolvedValue({ languageCode: sourceLanguage });

      // Cambiar idioma destino para habilitar procesamiento
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = targetLanguage;
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      // El botón debería estar habilitado porque los idiomas origen ('fr') y destino ('de') son diferentes
      expect(processButton.disabled).toBe(false);
    });

    it('should disable button when source language is detected to be the same as target language', async () => {
      const sameLanguage = 'it';

      messageHandlerSpies.detectLanguage.mockResolvedValue({ languageCode: sameLanguage });

      // Agregar texto al textarea primero
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a test sentence for translation.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Establecer idioma destino igual al origen para probar estado deshabilitado
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      const summarizeCheckbox = document.getElementById('summarize-checkbox') as HTMLInputElement;
      targetSelect.value = sameLanguage;
      targetSelect.dispatchEvent(new Event('change'));
      summarizeCheckbox.checked = false;
      summarizeCheckbox.dispatchEvent(new Event('change'));


      await vi.runAllTimersAsync(); // Esperar a que se complete el cambio de idioma destino

      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      // El botón debería estar deshabilitado porque los idiomas origen y destino son iguales y resumir es falso
      expect(processButton.disabled).toBe(true);
    });

    it('should show "processingButton" and be disabled when processing is in progress', async () => {
      // Configurar: Ingresar texto y detectar idioma para habilitar procesamiento
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();
      // Verificar que el botón esté habilitado inicialmente
      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      expect(processButton).toBeTruthy();
      expect(processButton.disabled).toBe(false);

      // Simular inicio del procesamiento haciendo clic en el botón
      processButton.click();

      // Verificar que el botón muestre estado de carga
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      expect(processButton.textContent?.trim()).toBe('processingButton');
      expect(processButton.disabled).toBe(true);
    });

    it('should not process when source and target languages are the same and summarize is false, even from context menu', async () => {
      // Configurar: establecer idioma origen igual al destino
      const sameLanguage = 'en';
      messageHandlerSpies.detectLanguage.mockResolvedValue({ languageCode: sameLanguage });
      // Establecer idioma destino igual al origen
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      expect(targetSelect).toBeTruthy();
      targetSelect.value = sameLanguage;
      targetSelect.dispatchEvent(new Event('change'));
      const summarizeCheckbox = document.getElementById('summarize-checkbox') as HTMLInputElement;
      expect(summarizeCheckbox).toBeTruthy();
      summarizeCheckbox.checked = false;
      summarizeCheckbox.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Simular recepción de texto desde menú contextual (debería activar procesamiento automático)
      await sendMessage('selectedText', { text: 'This is a test sentence for automatic translation.', summarize: false });
      await vi.runAllTimersAsync();

      // Verificar que NO se solicitó procesamiento porque los idiomas son iguales y resumir está en false
      expect(mockAIService.processText).not.toHaveBeenCalled();
      // Verificar que se muestre un error
      const warningContainer = document.getElementById('process-warning-container');
      expect(warningContainer?.innerHTML).toContain('sameLanguageWarning');
    });

    it('should reset button state after processing completes', async () => {
      // Configurar: Ingresar texto y detectar idioma para habilitar procesamiento
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();
      // Verificar que el botón esté habilitado inicialmente
      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      expect(processButton).toBeTruthy();
      expect(processButton.disabled).toBe(false);

      // Simular inicio del procesamiento haciendo clic en el botón
      processButton.click();

      // Verificar que el botón se reinicie después de completarse el procesamiento
      await vi.runAllTimersAsync();
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
       expect(processButton.textContent?.trim()).toBe('processButton');
      expect(processButton.disabled).toBe(false);
    });

    it('should enable button after switching target language during processing', async () => {
      // Configurar: Ingresar texto y detectar idioma
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();

      // Bloquear processText para que nunca se resuelva y podamos probar el estado durante el procesamiento
      mockAIService.processText.mockReturnValue(new Promise(() => {}));

      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      processButton.click();
      await vi.runAllTimersAsync();

      // Cambiar idioma destino
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      expect(targetSelect).toBeTruthy();
      targetSelect.value = 'fr';
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // El botón debería volver a estar habilitado después de cambiar idioma destino
      expect(processButton.disabled).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
       expect(processButton.textContent?.trim()).toBe('processButton');
    });

    it('should re-enable process button when translation fails with an error', async () => {
      // Crear una promesa controlable para el mock
      let rejectPromise: (error: Error) => void;
      const mockPromise = new Promise<string>((_, reject) => {
        rejectPromise = reject;
      });
      mockAIService.processText.mockReturnValueOnce(mockPromise);
      // Configurar: Ingresar texto y detectar idioma para habilitar traducción
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();
      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      expect(processButton).toBeTruthy();
      expect(processButton.disabled).toBe(false);
      // Simular inicio del procesamiento haciendo clic en el botón
      processButton.click();
      // Verificar que el botón esté deshabilitado durante el procesamiento
       expect(processButton.textContent.trim()).toBe('processingButton');
      expect(processButton.disabled).toBe(true);

      // Ahora activar el rechazo
      rejectPromise!(new Error('Error al procesar el texto'));
      await vi.runAllTimersAsync();

      // Verificar que el botón vuelva a estar habilitado después del error
       expect(processButton.textContent.trim()).toBe('processButton');
      expect(processButton.disabled).toBe(false);
    });
  });

  describe('Language Change Behavior', () => {
    it('should send cancel message when target language changes', async () => {
      // Cambiar idioma destino (debería enviar siempre mensaje de cancelación)
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'fr';
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Verificar que se envió el mensaje de cancelación
      expect(messageHandlerSpies.cancelPendingTranslations).toHaveBeenCalled();
    });
  });

  describe('Model Downloading State', () => {
    it('should show model download message when downloading starts', async () => {
      // Activar el mensaje modelStatusUpdate hacia el sidepanel
      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      await vi.runAllTimersAsync();

      // Verificar que se muestre el mensaje de descarga del modelo
      const modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer).toBeTruthy();
      expect(modelStatusContainer?.innerHTML).toBeTruthy();
    });

    it('should hide model download message when downloading completes', async () => {
      const modelStatusContainer = document.getElementById('model-status-container') as HTMLDivElement;
      expect(modelStatusContainer).toBeTruthy();
      
      // Simular finalización de la descarga
      await sendMessage('modelStatusUpdate', { state: 'available' });

      // Verificar que el estado del modelo esté oculto
      expect(modelStatusContainer.innerHTML).toBeFalsy();
    });

    it('should hide model download message when source language changes', async () => {
      // Activar el mensaje modelStatusUpdate hacia el sidepanel
      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      await vi.runAllTimersAsync();
      // Verificar que se muestre el mensaje de descarga del modelo
      const modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer?.innerHTML).toBeTruthy();

      // Cambiar idioma origen (debería enviar siempre mensaje de cancelación)
      const inputText = document.getElementById('input-text') as HTMLTextAreaElement;
      inputText.value = 'This is a longer text that should trigger language detection';
      inputText.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();

      // Verificar que el mensaje de descarga del modelo esté oculto
      expect(modelStatusContainer?.innerHTML).toBeFalsy();
    });

    it('should hide model download message when target language changes', async () => {
      // Activar el mensaje modelStatusUpdate hacia el sidepanel
      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      await vi.runAllTimersAsync();

      // Verificar que se muestre el mensaje de descarga del modelo
      const modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer?.innerHTML).toBeTruthy();

      // Cambiar idioma destino (debería enviar siempre mensaje de cancelación)
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'fr';
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Verificar que el mensaje de descarga del modelo esté oculto
      expect(modelStatusContainer?.innerHTML).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when translation fails with an error', async () => {
      // Configurar: Ingresar texto y detectar idioma para habilitar traducción
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      
      // Esperar a que se complete la detección de idioma
      await vi.runAllTimersAsync();

      // Simular fallo en el procesamiento
      mockAIService.processText.mockRejectedValue(new Error('Error al procesar el texto'));

      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      expect(processButton).toBeTruthy();

      // Simular inicio del procesamiento haciendo clic en el botón
      processButton.click();
      
      // Esperar a que se complete el procesamiento con error
      await vi.runAllTimersAsync();

      // Verificar que el error aparece
      const errorContainer = document.getElementById('error-container');
      expect(errorContainer?.innerHTML).toContain('Error al procesar el texto');
    });
  });

  describe('API Availability Warning', () => {
    it('should show warning when native browser APIs are not available', async () => {
      // Inicializar app con API de traducción no disponible
      await initSidepanelApp({
        checkAPIAvailability: () => (false)
      });

      // Verificar que se muestre la advertencia
      const apiWarningContainer = document.getElementById('api-warning-container');
      expect(apiWarningContainer?.innerHTML).toContain('apiWarning');
    });

    it('should not show warning when native browser APIs are available', async () => {
      // Inicializar app con API de traducción disponible (comportamiento por defecto)
      await initSidepanelApp({
        checkAPIAvailability: () => (true)
      });

      // Verificar que no se muestre ninguna advertencia
      const apiWarningContainer = document.getElementById('api-warning-container');
      expect(apiWarningContainer?.innerHTML).toBe('');
    });
  });

  describe('Summarize Functionality', () => {
    it('should send summarize option to ProcessTextService when checkbox is checked', async () => {
      // Configurar: Ingresar texto que active el procesamiento
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      
      // Esperar a que se complete la detección de idioma
      await vi.runAllTimersAsync();

      // Marcar la casilla de resumir
      const summarizeCheckbox = document.getElementById('summarize-checkbox') as HTMLInputElement;
      expect(summarizeCheckbox).toBeTruthy();
      summarizeCheckbox.checked = true;
      summarizeCheckbox.dispatchEvent(new Event('change'));
      
      // Esperar a que se actualice el estado del botón
      await vi.runAllTimersAsync();

      // Hacer clic en el botón procesar
      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      processButton.click();
      await vi.runAllTimersAsync();

      expect(mockAIService.processText).toHaveBeenCalledWith(
        'This is a longer text that should trigger language detection',
        {
          sourceLanguage: 'en',
          targetLanguage: 'es',
          summarize: true
        }
      );
    });

    it('should send summarize: false when checkbox is unchecked', async () => {
      // Configurar: Ingresar texto
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      
      // Esperar a que se complete la detección de idioma
      await vi.runAllTimersAsync();

      // Asegurar que la casilla esté desmarcada (por defecto)
      const summarizeCheckbox = document.getElementById('summarize-checkbox') as HTMLInputElement;
      expect(summarizeCheckbox.checked).toBe(false);

      // Hacer clic en el botón procesar
      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      processButton.click();
      await vi.runAllTimersAsync();

      expect(mockAIService.processText).toHaveBeenCalledWith(
        'This is a longer text that should trigger language detection',
        {
          sourceLanguage: 'en',
          targetLanguage: 'es',
          summarize: false
        }
      );
    });

    it('should enable process button even when languages are the same if summarize is checked', async () => {
      const sameLanguage = 'en';

      // Detectar idioma igual al destino
      messageHandlerSpies.detectLanguage.mockResolvedValue({ languageCode: sameLanguage });

      // Ingresar texto
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a test sentence for translation.';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();

      // Establecer idioma destino igual al detectado
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = sameLanguage;
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Inicialmente el botón debería estar deshabilitado porque los idiomas son iguales
      let processButton = document.getElementById('process-button') as HTMLButtonElement;
      expect(processButton.disabled).toBe(true);

      // Marcar la casilla de resumir
      const summarizeCheckbox = document.getElementById('summarize-checkbox') as HTMLInputElement;
      summarizeCheckbox.checked = true;
      summarizeCheckbox.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // El botón debería estar habilitado ahora porque resumir está marcado
      processButton = document.getElementById('process-button') as HTMLButtonElement;
      expect(processButton.disabled).toBe(false);
    });

    it('should automatically check summarize checkbox when selectedText message has summarize: true', async () => {
      // Simular recepción de texto desde menú contextual con summarize: true
      await sendMessage('selectedText', { text: 'This is a test sentence for summarization.', summarize: true });

      // Esperar a que se procese el mensaje y se actualice la UI
      await vi.runAllTimersAsync();

      // Verificar que la casilla de resumen esté marcada
      const summarizeCheckbox = document.getElementById('summarize-checkbox') as HTMLInputElement;
      expect(summarizeCheckbox.checked).toBe(true);
    });

    it('should uncheck summarize checkbox when selectedText message has summarize: false', async () => {
      // Primero marcar la casilla manualmente para probar que se desmarca
      const summarizeCheckbox = document.getElementById('summarize-checkbox') as HTMLInputElement;
      summarizeCheckbox.checked = true;

      // Verificar que esté marcada inicialmente
      expect(summarizeCheckbox.checked).toBe(true);

      // Simular recepción de texto desde menú contextual con summarize: false (menú "Traducir")
      await sendMessage('selectedText', { text: 'This is a test sentence for translation.', summarize: false });

      // Esperar a que se procese el mensaje y se actualice la UI
      await vi.runAllTimersAsync();

      // Verificar que la casilla de resumen se desmarca cuando viene del menú "Traducir"
      expect(summarizeCheckbox.checked).toBe(false);
    });
  });

  describe('Default Language Loading', () => {
    it('should use browser language as default target when it is supported', async () => {
      const browserLanguage = 'fr';

      // Crear instancia con reemplazo para idioma del navegador
      await initSidepanelApp({
        getBrowserLanguage: () => browserLanguage
      });

      // Verificar que el valor seleccionado es el idioma del navegador
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      expect(targetSelect.value).toBe(browserLanguage);
    });

    it('should use default language (es) when browser language is not supported', async () => {
      const browserLanguage = 'ja';
      const fallbackLanguage = 'es';
      // Crear instancia con reemplazo para idioma del navegador no soportado
      await initSidepanelApp({
        getBrowserLanguage: () => browserLanguage
      });

      // Verificar que el valor seleccionado es el idioma de respaldo por defecto 'es'
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      expect(targetSelect.value).toBe(fallbackLanguage);
    });

    it('should populate language selector with available languages', async () => {
      // Crear instancia para este test
      await initSidepanelApp();
      // Verificar que el selector de idiomas esté presente
      const select = document.getElementById('target-language') as HTMLSelectElement;
      expect(select).toBeTruthy();

      // Verificar que el selector tenga opciones
      expect(select.options.length).toBeGreaterThan(0);

      // Verificar que estén presentes algunos idiomas esperados
      const optionValues = Array.from(select.options).map(opt => opt.value);
      expect(optionValues).toContain('es');
      expect(optionValues).toContain('en');
      expect(optionValues).toContain('fr');
    });
  });
});
