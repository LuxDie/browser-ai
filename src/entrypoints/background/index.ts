import {
  type PendingTranslation
} from '@/entrypoints/background/background.model';
import { AVAILABLE_LANGUAGES, type AvailableLanguageCode } from '@/entrypoints/background/available-languages';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';
import { registerAIService } from '@/entrypoints/background/ai/ai.service';

// Registrar servicios proxy
registerAIService();

export type { AvailableLanguageCode } from '@/entrypoints/background/available-languages';
export type AvailableLanguages = typeof AVAILABLE_LANGUAGES;
export type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
export const DEFAULT_TARGET_LANGUAGE: AvailableLanguageCode = 'es';

export default defineBackground({
  type: 'module',
  main() {

  // Type-safe access helpers for built-in AI APIs
  const getTranslatorAPI = (): typeof Translator | undefined => {
    return (self as typeof self & { Translator?: typeof Translator }).Translator;
  };

  const getLanguageDetectorAPI = (): typeof LanguageDetector | undefined => {
    return (self as typeof self & { LanguageDetector?: typeof LanguageDetector }).LanguageDetector;
  };

  // Background script para Browser AI
  // Maneja eventos del navegador y comunicación entre componentes

  // Traducción pendiente durante descarga
  let pendingTranslation: PendingTranslation | null = null;

  // Texto seleccionado pendiente para envío al sidepanel
  let pendingRequest: { text: string, summarize: boolean } | null = null;

  /**
   * Detecta el idioma principal del navegador del usuario
   * @returns Código de idioma (ej: 'es', 'en', 'fr') o null si no se puede detectar
   */
  function getBrowserLanguage(): string {
    // Tomar el primer idioma y convertir 'es-ES' a 'es'
    return navigator.language.split('-')[0]!;
  }


  // TranslationService: Abstracción de proveedores y gestión de traducciones
  class TranslationService {
    static #instance: TranslationService | null = null;

    static getInstance(): TranslationService {
      if (!TranslationService.#instance) {
        TranslationService.#instance = new TranslationService();
      }
      return TranslationService.#instance;
    }

    async detectLanguage(text: string): Promise<string> {
      const languageDetectorAPI = getLanguageDetectorAPI();
      
      if (languageDetectorAPI) {
        // Verificar disponibilidad antes de intentar crear el detector
        const availability = await languageDetectorAPI.availability();
        console.log('LanguageDetector availability for detection:', availability);
        
        if (availability === 'available') {
          const detector = await languageDetectorAPI.create();
          const results = await detector.detect(text);
          // Take the most probable detected language
          const detectedLanguage = results[0]!.detectedLanguage!;
          return detectedLanguage;
        } else if (availability === 'downloadable') {
          console.log('LanguageDetector model is downloadable, attempting to download...');
          // Intentar crear el detector para iniciar la descarga
          const detector = await languageDetectorAPI.create();
          const results = await detector.detect(text);
          const detectedLanguage = results[0]!.detectedLanguage!;
          return detectedLanguage as AvailableLanguageCode;
        } else if (availability === 'downloading') {
          console.log('LanguageDetector model is currently downloading, waiting...');
          throw new Error(browser.i18n.getMessage('languageDetectorDownloading'));
        } else {
          console.log('LanguageDetector is unavailable');
          throw new Error(browser.i18n.getMessage('languageDetectorUnavailable'));
        }
      } else {
        throw new Error(browser.i18n.getMessage('languageDetectorNotSupported'));
      }
    }

    // Verificar disponibilidad real de APIs
    async checkAPIAvailability(): Promise<boolean> {
      const result = { 
        translator: false, 
        languageDetector: false,
        languageDetectorState: 'unavailable',
        translatorState: 'unavailable'
      };
      
      try {
        const languageDetectorAPI = getLanguageDetectorAPI();
        if (languageDetectorAPI) {
          try {
            const availability = await languageDetectorAPI.availability();
            result.languageDetectorState = availability;
            result.languageDetector = availability === 'available' || availability === 'downloadable';
            console.log('LanguageDetector availability check:', availability);
          } catch (error) {
            console.warn('LanguageDetector availability check failed:', error);
            result.languageDetector = false;
            result.languageDetectorState = 'unavailable';
          }
        }

        const translatorAPI = getTranslatorAPI();
        if (translatorAPI) {
          try {
            const availability = await translatorAPI.availability({
              sourceLanguage: 'en',
              targetLanguage: 'es'
            });
            result.translatorState = availability;
            result.translator = availability === 'available' || availability === 'downloadable';
            console.log('Translator availability check:', availability);
          } catch (error) {
            console.warn('Translator availability check failed:', error);
            result.translator = false;
            result.translatorState = 'unavailable';
          }
        }
      } catch (error) {
        console.error('Error checking API availability:', error);
      }

      return result.languageDetector || result.translator;
    }
  }

  // Instancias de servicios
  const modelManager = ModelManager.getInstance();
  const translationService = TranslationService.getInstance();

  // Función para crear el menú contextual
  async function createContextMenu(): Promise<void> {
    // Eliminar menús contextuales existentes para evitar duplicados
    await browser.contextMenus.removeAll();

    // Crear menú padre
    browser.contextMenus.create({
      id: 'browserAI',
      title: browser.i18n.getMessage('browserAIMenu'),
      contexts: ['selection']
    });

    // Opción de traducción
    browser.contextMenus.create({
      id: 'translateSelection',
      parentId: 'browserAI',
      title: browser.i18n.getMessage('translateMenu'),
      contexts: ['selection']
    });

    // Opción de resumen
    browser.contextMenus.create({
      id: 'summarizeSelection',
      parentId: 'browserAI',
      title: browser.i18n.getMessage('summarizeMenu'),
      contexts: ['selection']
    });
  }

  // Manejador de clics en el menú contextual
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab) {
      throw new Error(browser.i18n.getMessage('tabNotFoundError'));
    }

    if (info.selectionText && (info.menuItemId === 'translateSelection' || info.menuItemId === 'summarizeSelection')) {
      const selectedText = info.selectionText;
      const summarize = info.menuItemId === 'summarizeSelection';

      void (async () => {
        await browser.sidePanel.open({ windowId: tab.windowId });

        // Intentar enviar el texto al sidepanel inmediatamente
        try {
          await sendMessage('selectedText', { text: selectedText, summarize });
        } catch (error) {
          if (error instanceof Error && error.message === browser.i18n.getMessage('connectionErrorMessage')) {
            // El panel lateral está cerrado, guardar el texto seleccionado para enviarlo cuando esté listo
            pendingRequest = { text: selectedText, summarize };
          } else {
            throw error;
          }
        }
      })();
    }
  });

  // Manejadores de mensajes usando @webext-core/messaging
  onMessage('getModelStatus', async (message) => {
    const { source, target } = message.data;
    return await modelManager.checkModelStatus({ type: 'translation', source, target });
  });

  onMessage('detectLanguage', async (message) => {
    const { text } = message.data;
    const language = await translationService.detectLanguage(text);
    console.log(`🔍 Language detected: ${language}`);
    return { languageCode: language };
  });

  onMessage('translateText', async (message) => {
    const { text, sourceLanguage, targetLanguage } = message.data;
    let sendNotification = false;

    // Verificar disponibilidad del modelo
    let modelStatus = await modelManager.checkModelStatus({ type: 'translation', source: sourceLanguage, target: targetLanguage });
    if (modelStatus.state === 'downloadable') {
      // Si la traducción requiere descargar un modelo, mostraremos una notificación al finalizar
      sendNotification = true;
      modelStatus.state = 'downloading';
      void sendMessage('modelStatusUpdate', modelStatus);
      modelStatus = await modelManager.downloadModel({ type: 'translation', source: sourceLanguage, target: targetLanguage });
      void sendMessage('modelStatusUpdate', modelStatus);
    }

    const translatedText = await modelManager.translate(text, sourceLanguage, targetLanguage);
    
    if (sendNotification) {
      void browser.notifications.create({
        type: 'basic',
        title: browser.i18n.getMessage('extName'),
        message: browser.i18n.getMessage('textProcessedNotification'),
        iconUrl: 'icons/icon-128.png'
      });
    }
    
    return translatedText;
  });

  onMessage('checkAPIAvailability', () => {
    return modelManager.checkAPIAvailability();
  });

  onMessage('cancelPendingTranslations', () => {
    if (pendingTranslation) {
      console.log('Cancelling pending translation:', pendingTranslation);
      pendingTranslation = null;
      return { cancelled: true };
    }
    return { cancelled: false };
  });

  onMessage('getAvailableLanguages', () => {
    return { languages: AVAILABLE_LANGUAGES };
  });

  onMessage('getBrowserLanguage', () => {
    return getBrowserLanguage();
  });

  onMessage('sidepanelReady', () => {
    if (pendingRequest) {
      void sendMessage('selectedText', pendingRequest);
      pendingRequest = null;
    }
  });

  // Inicializar menú contextual al instalar la extensión y configurar side panel behavior al instalar la extensión
  browser.runtime.onInstalled.addListener(() => {
    void (async () => {
      await createContextMenu();

      // Configurar comportamiento del panel lateral para que se abra al hacer click en el ícono
      await browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
      console.log('Side panel behavior configured successfully');
    })();
  });

  // Recrear menú contextual al iniciar el navegador
  browser.runtime.onStartup.addListener(() => {
    void createContextMenu();
  });
}});
