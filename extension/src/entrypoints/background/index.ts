import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import {
  getLanguagePairKey,
  type ModelStatus,
  type PendingTranslation
} from '@/utils';
import { AVAILABLE_LANGUAGES, type LanguageCode } from '@/entrypoints/background/available-languages';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';

export type { LanguageCode } from '@/entrypoints/background/available-languages';
export type AvailableLanguages = typeof AVAILABLE_LANGUAGES;
export const DEFAULT_TARGET_LANGUAGE: LanguageCode = 'es';

export default defineBackground({
  type: 'module',
  main() {
  // Declare Chrome AI API interfaces for type safety
  interface TranslatorAPI {
    availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
    create(options: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorInstance>;
  }

  interface TranslatorInstance {
    translate(text: string): Promise<string>;
  }

  interface LanguageDetectionResult {
    confidence: number;
    detectedLanguage: LanguageCode;
  }

  interface LanguageDetectorInstance {
    detect(text: string): Promise<LanguageDetectionResult[]>;
  }

  interface LanguageDetectorAPI {
    availability(): Promise<string>;
    create(): Promise<LanguageDetectorInstance>;
  }

  // Type-safe access helpers for buil-in AI APIs
  const getTranslatorAPI = (): TranslatorAPI | undefined => {
    return (self as typeof self & { Translator?: TranslatorAPI }).Translator;
  };

  const getLanguageDetectorAPI = (): LanguageDetectorAPI | undefined => {
    return (self as typeof self & { LanguageDetector?: LanguageDetectorAPI }).LanguageDetector;
  };

  // Background script para Browser AI
  // Maneja eventos del navegador y comunicación entre componentes

  // Cache de estado de modelos
  const modelStatusCache = new Map<string, ModelStatus>();

  // Traducción pendiente durante descarga
  let pendingTranslation: PendingTranslation | null = null;

  // Texto seleccionado pendiente para envío al sidepanel
  let pendingSelectedText: string | null = null;

  // Estado de preparación del sidepanel
  let isSidepanelReady = false;

  /**
   * Detecta el idioma principal del navegador del usuario
   * @returns Código de idioma (ej: 'es', 'en', 'fr') o null si no se puede detectar
   */
  function getBrowserLanguage(): LanguageCode | null {
    let detectedLang: LanguageCode | null = null;

    if (navigator.languages.length > 0) {
      // Tomar el primer idioma y convertir 'es-ES' a 'es'
      const firstLanguage = navigator.languages[0] as LanguageCode;
      detectedLang = firstLanguage.split('-')[0] as LanguageCode;
    } else if (navigator.language) {
      // Fallback a navigator.language si navigator.languages no está disponible
      detectedLang = navigator.language.split('-')[0] as LanguageCode;
    }

    console.log('Browser language detected:', detectedLang);
    return detectedLang;
  }

  // ModelManager: Gestión de modelos de traducción
  class ModelManager {
    static #instance: ModelManager | null = null;

    static getInstance(): ModelManager {
      if (!ModelManager.#instance) {
        ModelManager.#instance = new ModelManager();
      }
      return ModelManager.#instance;
    }

    // Generar clave única para par de idiomas
    #getLanguagePairKey(source: string, target: string): string {
      return getLanguagePairKey(source, target);
    }

    // Verificar disponibilidad de modelo
    async checkModelAvailability(source: string, target: string): Promise<ModelStatus> {
      const key = this.#getLanguagePairKey(source, target);
      const translator = getTranslatorAPI();

      if (!translator) {
        return {
          available: false,
          downloading: false,
          error: 'Chrome AI APIs no disponibles'
        };
      }

      try {
        const availability = await translator.availability({
          sourceLanguage: source,
          targetLanguage: target
        });

        console.log(`🔍 Checking model availability for ${source}→${target}:`, availability);

        let status: ModelStatus;

        if (availability === 'available') {
          status = {
            available: true,
            downloading: false
          };
        } else if (availability === 'downloadable') {
          status = {
            available: false,
            downloading: false,
            error: 'Modelo descargable pero no disponible localmente'
          };
        } else if (availability === 'downloading') {
          status = {
            available: false,
            downloading: true,
            progress: 0
          };
        } else {
          status = {
            available: false,
            downloading: false,
            error: `Modelo no soportado: ${availability}`
          };
        }

        // Actualizar caché solo para estados de descarga en progreso
        if (availability === 'downloading') {
          modelStatusCache.set(key, status);
        } else if (availability === 'available') {
          // Limpiar caché cuando el modelo está disponible
          modelStatusCache.delete(key);
        }

        return status;
      } catch (error: unknown) {
        console.error(`❌ Error al verificar la disponibilidad del modelo para ${source}→${target}:`, error);
        return {
          available: false,
          downloading: false,
          error: `Error al verificar la disponibilidad del modelo: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

    // Descargar modelo
    async downloadModel(source: string, target: string): Promise<ModelStatus> {
      const key = this.#getLanguagePairKey(source, target);
      const translator = getTranslatorAPI();

      if (!translator) {
        const status: ModelStatus = {
          available: false,
          downloading: false,
          error: 'Chrome AI APIs no disponibles para descarga'
        };
        modelStatusCache.set(key, status);
        return status;
      }

      modelStatusCache.set(key, {
        available: false,
        downloading: true,
        progress: 0
      });

      try {
        console.log(`⏳ Downloading model for ${source}→${target}...`);
        // Crear el traductor (esto descarga el modelo si es necesario)
        await translator.create({
          sourceLanguage: source,
          targetLanguage: target
        });

        console.log(`✅ Model for ${source}→${target} downloaded successfully.`);
        modelStatusCache.delete(key);
        return {
          available: true,
          downloading: false
        };
      } catch (error: unknown) {
        console.error(`❌ Error al descargar el modelo para ${source}→${target}:`, error);
        const status: ModelStatus = {
          available: false,
          downloading: false,
          error: `Error al descargar el modelo: ${error instanceof Error ? error.message : String(error)}`
        };
        modelStatusCache.set(key, status);
        return status;
      }
    }

    // Traducir texto
    async translate(text: string, source: string, target: string): Promise<string> {
      const translator = getTranslatorAPI();

      if (!translator) {
        return 'Error: Chrome AI APIs no disponibles para traducción';
      }

      try {
        console.log(`Translating "${text}" from ${source} to ${target}`);
        const translatorInstance = await translator.create({
          sourceLanguage: source,
          targetLanguage: target
        });
        const translatedText = await translatorInstance.translate(text);
        console.log(`Translated: "${translatedText}"`);
        return translatedText;
      } catch (error: unknown) {
        console.error('❌ Error al traducir texto:', error);
        return `Error al traducir: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
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

    async detectLanguage(text: string): Promise<LanguageCode> {
      const languageDetectorAPI = getLanguageDetectorAPI();
      
      if (languageDetectorAPI) {
        // Verificar disponibilidad antes de intentar crear el detector
        const availability = await languageDetectorAPI.availability();
        console.log('LanguageDetector availability for detection:', availability);
        
        if (availability === 'available') {
          const detector = await languageDetectorAPI.create();
          const results = await detector.detect(text);
          const detected = results[0]?.detectedLanguage;
          if (!detected) {
            throw new Error('No se pudo detectar el idioma del texto proporcionado');
          }
          return detected;
        } else if (availability === 'downloadable') {
          console.log('LanguageDetector model is downloadable, attempting to download...');
          // Intentar crear el detector para iniciar la descarga
          const detector = await languageDetectorAPI.create();
          const results = await detector.detect(text);
          const detected = results[0]?.detectedLanguage;
          if (!detected) {
            throw new Error('No se pudo detectar el idioma del texto proporcionado');
          }
          return detected;
        } else if (availability === 'downloading') {
          console.log('LanguageDetector model is currently downloading, waiting...');
          throw new Error('El modelo LanguageDetector se está descargando actualmente. Por favor, espere e inténtelo de nuevo.');
        } else {
          console.log('LanguageDetector is unavailable');
          throw new Error('La API LanguageDetector no está disponible');
        }
      } else {
        throw new Error('La API LanguageDetector no es compatible con este navegador');
      }
    }

    // Verificar disponibilidad real de APIs
    async checkAPIAvailability(): Promise<{translator: boolean, languageDetector: boolean, languageDetectorState?: string, translatorState?: string}> {
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

      return result;
    }
  }

  // Instancias de servicios
  const modelManager = ModelManager.getInstance();
  const translationService = TranslationService.getInstance();

  // Función para crear el menú contextual
  async function createContextMenu(): Promise<void> {
    // Eliminar menús contextuales existentes para evitar duplicados
    await browser.contextMenus.removeAll();
    browser.contextMenus.create({
      id: 'translateSelection',
      title: 'Traducir con Browser AI',
      contexts: ['selection']
    });
  }

  // Manejador de clics en el menú contextual
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab) {
      throw new Error('No se encontró la pestaña para el clic del menú contextual');
    }

    if (info.menuItemId === 'translateSelection' && info.selectionText) {
      const selectedText = info.selectionText;
      void (async () => {
        await browser.sidePanel.open({ windowId: tab.windowId });
        if (isSidepanelReady) {
          void sendMessage('selectedText', selectedText);
        } else {
          pendingSelectedText = selectedText;
        }
      })();
    }
  });

  // Manejadores de mensajes usando @webext-core/messaging
  onMessage('getModelStatus', async (message) => {
    const { source, target } = message.data as { source: string; target: string };
    return await modelManager.checkModelAvailability(source, target);
  });

  onMessage('detectLanguage', async (message) => {
    const { text } = message.data as { text: string };
    const language = await translationService.detectLanguage(text);
    console.log(`🔍 Language detected: ${language}`);
    return { languageCode: language };
  });

  onMessage('translateText', async (message) => {
    const { text, sourceLanguage, targetLanguage } = message.data;
    let sendNotification = false;

    // Verificar disponibilidad del modelo
    let modelStatus = await modelManager.checkModelAvailability(sourceLanguage, targetLanguage);
    if (!modelStatus.available) {
      // Si la traducción requiere descargar un modelo, mostraremos una notificación al finalizar
      sendNotification = true;
      modelStatus.downloading = true;
      void sendMessage('modelStatusUpdate', modelStatus);
      modelStatus = await modelManager.downloadModel(sourceLanguage, targetLanguage);
      void sendMessage('modelStatusUpdate', modelStatus);
    }

    const translatedText = await modelManager.translate(text, sourceLanguage, targetLanguage);
    
    if (sendNotification) {
      void browser.notifications.create({
        type: 'basic',
        title: 'Notificación de traducción',
        message: 'La traducción se ha completado',
        iconUrl: 'icons/icon-128.png'
      });
    }
    
    return translatedText;
  });

  onMessage('checkAPIAvailability', async () => {
    const availability = await translationService.checkAPIAvailability();
    console.log('API availability check:', availability);
    return availability;
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
    isSidepanelReady = true;
    if (pendingSelectedText) {
      void sendMessage('selectedText', pendingSelectedText);
      pendingSelectedText = null;
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
