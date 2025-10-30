import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { fakeBrowser } from 'wxt/testing';

import {
  onMessage,
  sendMessage,
  removeMessageListeners
} from '@/entrypoints/background/messaging';
import { LanguageCode } from '@/entrypoints/background';
import { SidepanelApp } from '@/entrypoints/sidepanel/sidepanel';

// Crear una única instancia mock que será reutilizada
const mockProcessText = vi.fn().mockResolvedValue('Texto procesado');
// TODO: simplificar ya que no se usa mockServiceInstance más que aquí
const mockServiceInstance = {
  processText: mockProcessText
};

vi.mock(import('@/entrypoints/background/process-text/process-text.service'), () => ({
  getProcessTextService: () => mockServiceInstance,
  registerProcessTextService(): any {}
}));

function resetDOM() {
  document.body.innerHTML = '<div id="root"></div>';
}

const getDefaultAvailableLanguages = () => ([
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' }
]);

interface MessageHandlerSpies {
  checkAPIAvailability: MockInstance
  getAvailableLanguages: MockInstance
  getBrowserLanguage: MockInstance
  detectLanguage: MockInstance
  cancelPendingTranslations: MockInstance
  sidepanelReady: MockInstance
}

// TODO: mejorar tipo `any`
const registerDefaultMessageHandlers = (overrides: Record<string, any> = {}): MessageHandlerSpies => {
  const checkAPIAvailabilitySpy = vi.fn(overrides.checkAPIAvailability ?? (() => ({
    translator: true,
    languageDetector: true
  })));
  const getAvailableLanguagesSpy = vi.fn(overrides.getAvailableLanguages ?? (() => ({
    languages: getDefaultAvailableLanguages()
  })));
  const getBrowserLanguageSpy = vi.fn(overrides.getBrowserLanguage ?? (() => 'es'));
  const detectLanguageSpy = vi.fn(overrides.detectLanguage ?? (() => ({ language: 'en' })));
  const cancelPendingTranslationsSpy = vi.fn(overrides.cancelPendingTranslations ?? (() => ({ cancelled: true })));
  const sidepanelReadySpy = vi.fn(overrides.sidepanelReady ?? (() => {}));

  // Nota: mockProcessTextService se configura más abajo

  onMessage('checkAPIAvailability', checkAPIAvailabilitySpy);
  onMessage('getAvailableLanguages', getAvailableLanguagesSpy);
  onMessage('getBrowserLanguage', getBrowserLanguageSpy);
  onMessage('detectLanguage', detectLanguageSpy);
  onMessage('cancelPendingTranslations', cancelPendingTranslationsSpy);
  onMessage('sidepanelReady', sidepanelReadySpy);

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

    // TODO: esto debería estar cubierto en la configuración
    // Reiniciar el mock antes de cada test
    mockProcessText.mockReset();
    mockProcessText.mockResolvedValue('Texto procesado');

    messageHandlerSpies = await initSidepanelApp();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    removeMessageListeners();
  });

  it('should render the initial state correctly', () => {
    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('Browser AI');
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
    const testLanguageCode: LanguageCode = 'en';
    messageHandlerSpies.detectLanguage.mockImplementation(() => ({ languageCode: testLanguageCode }));
    await setTextAndProcess();

    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('Idioma detectado');
    expect(root?.innerHTML).toContain(testLanguageCode);
  });

  it('should show "Procesado localmente" indicator when using native API', async () => {
    // Asegurar que el mock retorna un valor
    mockProcessText.mockResolvedValue('Texto procesado correctamente');

    // TODO: esto ya debería estar configurado en beforeEach
    // Asegurar que detectLanguage retorna un valor usando mockImplementation
    messageHandlerSpies.detectLanguage.mockImplementation(() => ({ languageCode: 'en' }));

    // Establecer texto y procesar
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    const processButton = document.getElementById('process-button') as HTMLButtonElement;
    textarea.value = 'This is a longer text that should trigger language detection';
    textarea.dispatchEvent(new Event('input'));
    await vi.runAllTimersAsync();
    
    // Verificar que el botón está habilitado
    expect(processButton.disabled).toBe(false);

    processButton.click();
    await vi.runAllTimersAsync();

    // Esperar a que aparezca el contenedor de resultado
    await vi.waitFor(() => {
      const resultContainer = document.getElementById('result-container');
      expect(resultContainer?.innerHTML).toBeTruthy();
    });
    
    // Verificar que aparece el indicador de procesamiento local
    const indicatorElement = document.getElementById('processing-source');
    // TODO: investigar o reportar bug de tseslint
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    expect(indicatorElement?.textContent?.trim()).toBe('🔒 Procesado localmente');
  });

  it('should automatically detect language from text selected from context menu', async () => {
    // Simular recepción de texto desde menú contextual
    await sendMessage('selectedText', 'This is a test sentence for automatic translation.');
    // Esperar a que se active la traducción automática
    await vi.runAllTimersAsync();

    // Verificar que se solicitó la traducción con los datos correctos
    expect(messageHandlerSpies.detectLanguage).toHaveBeenCalled();
  });

  it('should automatically process text when selected from context menu', async () => {
    // TODO: debería estar ya configurado
    // Asegurar que detectLanguage retorna el valor esperado
    messageHandlerSpies.detectLanguage.mockResolvedValue({ languageCode: 'en' });

    // Simular recepción de texto desde menú contextual
    await sendMessage('selectedText', 'This is a test sentence for automatic translation.');
    // Esperar a que se active el procesamiento automático
    await vi.runAllTimersAsync();

    // TODO: `runTimers...` debería ser suficiente
    // Esperar a que se complete el procesamiento asíncrono
    await vi.waitFor(() => {
      expect(mockProcessText).toHaveBeenCalledWith(
        'This is a test sentence for automatic translation.',
        {
          sourceLanguage: 'en',
          targetLanguage: 'es',
          summarize: false
        }
      );
    });
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
      // Reemplazar el manejador detectLanguage para retrasar la respuesta
      removeMessageListeners();
      registerDefaultMessageHandlers({
        detectLanguage: () => new Promise((resolve) => {
          setTimeout(() => { resolve({ language: 'en' }); }, 1000); // Retrasar respuesta
        })
      });

      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      // Esperar un tiempo muy corto para que se actualice la UI
      await vi.advanceTimersByTimeAsync(10);

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

      messageHandlerSpies.detectLanguage.mockImplementation(() => ({ language: sourceLanguage }));

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

      messageHandlerSpies.detectLanguage.mockImplementation(() => ({ languageCode: sameLanguage }));

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

    it('should show "Procesando..." and be disabled when processing is in progress', async () => {
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
      expect(processButton.textContent?.trim()).toBe('Procesando...');
      expect(processButton.disabled).toBe(true);
    });

    it('should not process when source and target languages are the same and summarize is false, even from context menu', async () => {
      // Configurar: establecer idioma origen igual al destino
      const sameLanguage = 'en';
      messageHandlerSpies.detectLanguage.mockImplementation(() => ({ languageCode: sameLanguage }));
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
      await sendMessage('selectedText', 'This is a test sentence for automatic translation.');
      await vi.runAllTimersAsync();

      // Verificar que NO se solicitó procesamiento porque los idiomas son iguales y resumir está en false
      expect(mockProcessText).not.toHaveBeenCalled();
      // Verificar que se muestre un error
      const warningContainer = document.getElementById('process-warning-container');
      expect(warningContainer?.innerHTML).toContain('Los idiomas de origen y destino son iguales');
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
      expect(processButton.textContent?.trim()).toBe('Procesar');
      expect(processButton.disabled).toBe(false);
    });

    it('should enable button after switching target language during processing', async () => {
      // Configurar: Ingresar texto y detectar idioma
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();

      // Bloquear processText para que nunca se resuelva y podamos probar el estado durante el procesamiento
      const processPromise = new Promise(() => {});
      vi.mocked(mockProcessText).mockReturnValue(processPromise as any);

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
      expect(processButton.textContent?.trim()).toBe('Procesar');
    });

    it('should re-enable process button when translation fails with an error', async () => {
      // Configurar: Ingresar texto y detectar idioma para habilitar traducción
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();

      // Crear una promesa controlable para el mock
      let rejectPromise: (error: Error) => void;
      const mockPromise = new Promise<string>((_, reject) => {
        rejectPromise = reject;
      });

      mockProcessText.mockReturnValueOnce(mockPromise);

      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      expect(processButton).toBeTruthy();
      expect(processButton.disabled).toBe(false);

      // Simular inicio del procesamiento haciendo clic en el botón
      processButton.click();

      // TODO: Corroborar que esto es necesario o se debe usar vi.runAllTimersAsync()
      await nextTick();

      // Verificar que el botón esté deshabilitado durante el procesamiento
      expect(processButton.textContent?.trim()).toBe('Procesando...');
      expect(processButton.disabled).toBe(true);

      // Ahora activar el rechazo
      rejectPromise!(new Error('Error al procesar el texto'));
      await vi.runAllTimersAsync();

      // Verificar que el botón vuelva a estar habilitado después del error
      expect(processButton.textContent?.trim()).toBe('Procesar');
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

    it('should hide model download message when processing completes', async () => {
      // TODO: debería estar configurado
      // Asegurar que detectLanguage retorna el valor esperado
      messageHandlerSpies.detectLanguage.mockResolvedValue({ languageCode: 'en' });

      // Configurar estado de procesamiento con descarga de modelo
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();

      // Mockear processText para que se resuelva después de un retraso
      mockProcessText.mockImplementation(() => {
        return new Promise<void>((resolve) => { setTimeout(() => { resolve(); }, 1000);});
      });

      processButton.click();
      
      // Simular mensaje de descarga de modelo
      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      const modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer?.innerHTML).toBeTruthy();
      await vi.runAllTimersAsync();

      // Verificar que el mensaje de descarga del modelo esté oculto
      expect(modelStatusContainer?.innerHTML).toBeFalsy();
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
      // Configurar: Ingresar texto y detectar idioma to enable translation
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();

      // Simular fallo en el procesamiento
      mockProcessText.mockRejectedValue(new Error('Error al procesar el texto'));

      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      expect(processButton).toBeTruthy();

      // Simular inicio del procesamiento haciendo clic en el botón
      processButton.click();
      await vi.runAllTimersAsync();

      // Esperar a que se muestre el error (el mensaje de error es del mock)
      await vi.waitFor(() => {
        const errorContainer = document.getElementById('error-container');
        expect(errorContainer?.innerHTML).toContain('Error al procesar el texto');
      });
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
      expect(apiWarningContainer?.innerHTML).toContain('Las APIs nativas del navegador no están disponibles');
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
      // TODO: debería estar configurado
      // Asegurar que detectLanguage retorna el valor esperado
      messageHandlerSpies.detectLanguage.mockResolvedValue({ languageCode: 'en' });

      // Configurar: Ingresar texto que active el procesamiento
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();

      // Marcar la casilla de resumir
      const summarizeCheckbox = document.getElementById('summarize-checkbox') as HTMLInputElement;
      expect(summarizeCheckbox).toBeTruthy();
      summarizeCheckbox.checked = true;
      summarizeCheckbox.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Hacer clic en el botón procesar
      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      processButton.click();
      await vi.runAllTimersAsync();

      // TODO: debería bastar con runAllTimersAsync
      // Verificar que ProcessTextService fue llamado con summarize: true
      await vi.waitFor(() => {
        expect(mockProcessText).toHaveBeenCalledWith(
          'This is a longer text that should trigger language detection',
          {
            sourceLanguage: 'en',
            targetLanguage: 'es',
            summarize: true
          }
        );
      });
    });

    it('should send summarize: false when checkbox is unchecked', async () => {
      // TODO: debería estar configurado
      // Asegurar que detectLanguage retorna el valor esperado
      messageHandlerSpies.detectLanguage.mockResolvedValue({ languageCode: 'en' });

      // Configurar: Ingresar texto
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();

      // Asegurar que la casilla esté desmarcada (por defecto)
      const summarizeCheckbox = document.getElementById('summarize-checkbox') as HTMLInputElement;
      expect(summarizeCheckbox.checked).toBe(false);

      // Hacer clic en el botón procesar
      const processButton = document.getElementById('process-button') as HTMLButtonElement;
      processButton.click();
      await vi.runAllTimersAsync();

      // TODO: debería bastar con runAllTimersAsync
      // Verificar que ProcessTextService fue llamado con summarize: false
      await vi.waitFor(() => {
        expect(mockProcessText).toHaveBeenCalledWith(
          'This is a longer text that should trigger language detection',
          {
            sourceLanguage: 'en',
            targetLanguage: 'es',
            summarize: false
          }
        );
      });
    });

    it('should enable process button even when languages are the same if summarize is checked', async () => {
      const sameLanguage = 'en';

      // Detectar idioma igual al destino
      messageHandlerSpies.detectLanguage.mockImplementation(() => ({ languageCode: sameLanguage }));

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
