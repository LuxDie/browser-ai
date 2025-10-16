import { defineBackground } from 'wxt/utils/define-background'
import { browser } from 'wxt/browser'
import {
  getLanguagePairKey,
  getAvailableLanguages,
  getLanguageName,
  type ModelStatus,
  type PendingTranslation
} from '../core'
import { onMessage } from '../messaging'

export default defineBackground(() => {
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
    detectedLanguage: string;
  }

  interface LanguageDetectorInstance {
    detect(text: string): Promise<LanguageDetectionResult[]>;
  }

  interface LanguageDetectorAPI {
    availability(): Promise<string>;
    create(): Promise<LanguageDetectorInstance>;
  }

  // Type-safe access helpers for Chrome AI APIs
  const getTranslatorAPI = (): TranslatorAPI | undefined => {
    return (self as typeof self & { Translator?: TranslatorAPI }).Translator;
  };

  const getLanguageDetectorAPI = (): LanguageDetectorAPI | undefined => {
    return (self as typeof self & { LanguageDetector?: LanguageDetectorAPI }).LanguageDetector;
  };

  // Background script para Browser AI
  // Maneja eventos del navegador y comunicación entre componentes

  // Cache de estado de modelos
  const modelStatusCache = new Map<string, ModelStatus>()

  // Traducción pendiente durante descarga
  let pendingTranslation: PendingTranslation | null = null

  // ModelManager: Gestión de modelos de traducción
  class ModelManager {
    static #instance: ModelManager

    static getInstance(): ModelManager {
      if (!ModelManager.#instance) {
        ModelManager.#instance = new ModelManager()
      }
      return ModelManager.#instance
    }

    // Generar clave única para par de idiomas
    #getLanguagePairKey(source: string, target: string): string {
      return getLanguagePairKey(source, target)
    }

    // Verificar disponibilidad de modelo
    async checkModelAvailability(source: string, target: string): Promise<ModelStatus> {
      const key = this.#getLanguagePairKey(source, target)
      const translator = getTranslatorAPI();

      if (!translator) {
        return {
          available: false,
          downloading: false,
          error: 'Chrome AI APIs no disponibles'
        }
      }

      try {
        const availability = await translator.availability({
          sourceLanguage: source,
          targetLanguage: target
        })

        console.log(`🔍 Checking model availability for ${source}→${target}:`, availability)

        let status: ModelStatus

        if (availability === 'available') {
          status = {
            available: true,
            downloading: false
          }
        } else if (availability === 'downloadable') {
          status = {
            available: false,
            downloading: false,
            error: 'Modelo descargable pero no disponible localmente'
          }
        } else if (availability === 'downloading') {
          status = {
            available: false,
            downloading: true,
            progress: 0
          }
        } else {
          status = {
            available: false,
            downloading: false,
            error: `Modelo no soportado: ${availability}`
          }
        }

        // Actualizar caché solo para estados de descarga en progreso
        if (availability === 'downloading') {
          modelStatusCache.set(key, status)
        } else if (availability === 'available') {
          // Limpiar caché cuando el modelo está disponible
          modelStatusCache.delete(key)
        }

        return status
      } catch (error: unknown) {
        console.error(`❌ Error al verificar la disponibilidad del modelo para ${source}→${target}:`, error)
        return {
          available: false,
          downloading: false,
          error: `Error al verificar la disponibilidad del modelo: ${error instanceof Error ? error.message : String(error)}`
        }
      }
    }

    // Descargar modelo
    async downloadModel(source: string, target: string): Promise<ModelStatus> {
      const key = this.#getLanguagePairKey(source, target)
      const translator = getTranslatorAPI();

      if (!translator) {
        const status: ModelStatus = {
          available: false,
          downloading: false,
          error: 'Chrome AI APIs no disponibles para descarga'
        }
        modelStatusCache.set(key, status)
        return status
      }

      modelStatusCache.set(key, {
        available: false,
        downloading: true,
        progress: 0
      })

      try {
        console.log(`⏳ Downloading model for ${source}→${target}...`)
        // Crear el traductor (esto descarga el modelo si es necesario)
        await translator.create({
          sourceLanguage: source,
          targetLanguage: target
        })

        console.log(`✅ Model for ${source}→${target} downloaded successfully.`)
        modelStatusCache.delete(key)
        return {
          available: true,
          downloading: false
        }
      } catch (error: unknown) {
        console.error(`❌ Error al descargar el modelo para ${source}→${target}:`, error)
        const status: ModelStatus = {
          available: false,
          downloading: false,
          error: `Error al descargar el modelo: ${error instanceof Error ? error.message : String(error)}`
        }
        modelStatusCache.set(key, status)
        return status
      }
    }

    // Traducir texto
    async translate(text: string, source: string, target: string): Promise<string> {
      const translator = getTranslatorAPI();

      if (!translator) {
        return 'Error: Chrome AI APIs no disponibles para traducción'
      }

      try {
        console.log(`Translating "${text}" from ${source} to ${target}`)
        const translatorInstance = await translator.create({
          sourceLanguage: source,
          targetLanguage: target
        })
        const translatedText = await translatorInstance.translate(text)
        console.log(`Translated: "${translatedText}"`)
        return translatedText
      } catch (error: unknown) {
        console.error('❌ Error al traducir texto:', error)
        return `Error al traducir: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  // TranslationService: Abstracción de proveedores y gestión de traducciones
  class TranslationService {
    static #instance: TranslationService
    #modelManager: ModelManager

    static getInstance(): TranslationService {
      if (!TranslationService.#instance) {
        TranslationService.#instance = new TranslationService()
      }
      return TranslationService.#instance
    }

    constructor() {
      this.#modelManager = ModelManager.getInstance()
    }

    // Detectar idioma del texto usando solo la API oficial
    async detectLanguage(text: string): Promise<string> {
      try {
        const languageDetectorAPI = getLanguageDetectorAPI();
        
        if (languageDetectorAPI) {
          // Verificar disponibilidad antes de intentar crear el detector
          const availability = await languageDetectorAPI.availability()
          console.log('LanguageDetector availability for detection:', availability)
          
          if (availability === 'available') {
            const detector = await languageDetectorAPI.create()
            const results = await detector.detect(text)
            return results[0]?.detectedLanguage || 'en' // Fallback a inglés
          } else if (availability === 'downloadable') {
            console.log('LanguageDetector model is downloadable, attempting to download...')
            // Intentar crear el detector para iniciar la descarga
            const detector = await languageDetectorAPI.create()
            const results = await detector.detect(text)
            return results[0]?.detectedLanguage || 'en'
          } else if (availability === 'downloading') {
            console.log('LanguageDetector model is currently downloading, waiting...')
            throw new Error('LanguageDetector model is currently downloading. Please wait and try again.')
          } else {
            console.log('LanguageDetector is unavailable')
            throw new Error('LanguageDetector API is not available')
          }
        } else {
          throw new Error('LanguageDetector API is not supported in this browser')
        }
      } catch (error) {
        console.error('Error detecting language:', error)
        throw error
      }
    }

    // Verificar disponibilidad real de APIs
    async checkAPIAvailability(): Promise<{translator: boolean, languageDetector: boolean, languageDetectorState?: string, translatorState?: string}> {
      const result = { 
        translator: false, 
        languageDetector: false,
        languageDetectorState: 'unavailable',
        translatorState: 'unavailable'
      }
      
      try {
        const languageDetectorAPI = getLanguageDetectorAPI();
        if (languageDetectorAPI) {
          try {
            const availability = await languageDetectorAPI.availability()
            result.languageDetectorState = availability
            result.languageDetector = availability === 'available' || availability === 'downloadable'
            console.log('LanguageDetector availability check:', availability)
          } catch (error) {
            console.warn('LanguageDetector availability check failed:', error)
            result.languageDetector = false
            result.languageDetectorState = 'unavailable'
          }
        }

        const translatorAPI = getTranslatorAPI();
        if (translatorAPI) {
          try {
            const availability = await translatorAPI.availability({
              sourceLanguage: 'en',
              targetLanguage: 'es'
            })
            result.translatorState = availability
            result.translator = availability === 'available' || availability === 'downloadable'
            console.log('Translator availability check:', availability)
          } catch (error) {
            console.warn('Translator availability check failed:', error)
            result.translator = false
            result.translatorState = 'unavailable'
          }
        }
      } catch (error) {
        console.error('Error checking API availability:', error)
      }

      return result
    }

    // Traducir texto con gestión de modelos
    async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<void> {
      try {
        // Detectar idioma origen si no se proporciona
        const detectedSourceLanguage = sourceLanguage || await this.detectLanguage(text)

        // Validar que los idiomas origen y destino no sean iguales
        if (detectedSourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
          console.log('Skipping translation: source and target languages are the same')
          browser.runtime.sendMessage({
            type: 'TRANSLATION_COMPLETED',
            data: {
              translatedText: text,
              sourceLanguage: detectedSourceLanguage,
              targetLanguage,
              usingCloud: false
            }
          }).catch((error) => console.error('Error sending message:', error))
          return
        }

        // Verificar disponibilidad del modelo
        const modelStatus = await this.#modelManager.checkModelAvailability(detectedSourceLanguage, targetLanguage)

        if (modelStatus.available) {
          // Traducir directamente
          const translatedText = await this.#modelManager.translate(text, detectedSourceLanguage, targetLanguage)
          browser.runtime.sendMessage({
            type: 'TRANSLATION_COMPLETED',
            data: { translatedText, usingCloud: false }
          }).catch((error) => console.error('Error sending message:', error))
        } else if (modelStatus.downloading) {
          // Modelo descargándose
          browser.runtime.sendMessage({
            type: 'MODEL_DOWNLOADING',
            data: { progress: modelStatus.progress || 0 }
          }).catch((error) => console.error('Error sending message:', error))
        } else {
          // Iniciar descarga del modelo
          await this.#modelManager.downloadModel(detectedSourceLanguage, targetLanguage)
        }
      } catch (error) {
        console.error('Error in translateText:', error)
        browser.runtime.sendMessage({
          type: 'TRANSLATION_ERROR',
          data: { error: error instanceof Error ? error.message : 'Error de traducción' }
        }).catch((err) => console.error('Error sending error message:', err))
      }
    }

    // Obtener idiomas disponibles
    getAvailableLanguages(): string[] {
      return getAvailableLanguages()
    }

    // Obtener nombre del idioma
    getLanguageName(code: string): string {
      return getLanguageName(code)
    }
  }

  // Instancias de servicios
  const modelManager = ModelManager.getInstance()
  const translationService = TranslationService.getInstance()

  // Función para crear el menú contextual
  function createContextMenu(): void {
    // Eliminar menús contextuales existentes para evitar duplicados
    browser.contextMenus.removeAll(() => {
      browser.contextMenus.create({
        id: 'translateSelection',
        title: 'Traducir "%s" con Browser AI',
        contexts: ['selection']
      })
      console.log('Context menu created.')
    })
  }

  // Manejador de clics en el menú contextual
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'translateSelection' && info.selectionText) {
      const selectedText = info.selectionText
      console.log('Texto seleccionado:', selectedText)

      // Wrap async logic in named function to avoid lint issues
      const handleTranslate = async () => {
        const availableLanguages = getAvailableLanguages()
        const defaultSource = availableLanguages[0] || 'en'
        const defaultTarget = availableLanguages[1] || 'es'

        const status = await modelManager.checkModelAvailability(defaultSource, defaultTarget)

        if (status.available) {
          // Si el modelo está disponible, traducir directamente
          const translatedText = await modelManager.translate(
            selectedText,
            defaultSource,
            defaultTarget
          )
          // Enviar mensaje al sidepanel con la traducción
          if (tab?.id) {
            browser.tabs.sendMessage(tab.id, {
              type: 'TRANSLATION_RESULT',
              data: translatedText
            }).catch((error: Error) => {
              console.error('Error sending translation result:', error);
            })
          }
        } else if (status.downloading) {
          // Si el modelo se está descargando, notificar al usuario
          void browser.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'Browser AI',
            message: 'El modelo de traducción se está descargando. Por favor, espera.'
          })
          // Guardar traducción pendiente
          pendingTranslation = {
            text: selectedText,
            sourceLanguage: defaultSource,
            targetLanguage: defaultTarget,
            tabId: tab?.id || 0
          }
        } else {
          // Si el modelo no está disponible, iniciar descarga y notificar
          void browser.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'Browser AI',
            message: 'Descargando modelo de traducción. Esto puede tardar unos minutos.'
          })
          // Iniciar descarga y luego traducir
          modelManager.downloadModel(defaultSource, defaultTarget).then(async (downloadStatus) => {
            if (downloadStatus.available) {
              const translatedText = await modelManager.translate(
                selectedText,
                defaultSource,
                defaultTarget
              )
              if (tab?.id) {
                browser.tabs.sendMessage(tab.id, {
                  type: 'TRANSLATION_RESULT',
                  data: translatedText
                }).catch((error: Error) => {
                  console.error('Error sending translation result:', error);
                })
              }
            } else if (downloadStatus.error) {
              void browser.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon-48.png',
                title: 'Browser AI',
                message: `Error al descargar el modelo: ${downloadStatus.error}`
              })
            }
          }).catch((error: Error) => {
            console.error('Error downloading model:', error);
          })
        }
      }

      // Execute with proper error handling
      handleTranslate().catch((error: Error) => {
        console.error('Error:', error);
      });
    }
  })

  // Manejadores de mensajes usando @webext-core/messaging
  onMessage('getModelStatus', async (message) => {
    const { source, target } = message.data as { source: string; target: string };
    return await modelManager.checkModelAvailability(source, target);
  });

  onMessage('downloadModel', async (message) => {
    const { source, target } = message.data as { source: string; target: string };
    return await modelManager.downloadModel(source, target);
  });

  onMessage('translateText', async (message) => {
    const { text, source, target } = message.data as { text: string; source: string; target: string };
    return await modelManager.translate(text, source, target);
  });

  onMessage('modelDownloadProgress', (message) => {
    const { key, progress } = message.data as { key: string; progress: number };
    const status = modelStatusCache.get(key);
    if (status) {
      modelStatusCache.set(key, { ...status, progress });
      // Si hay una traducción pendiente y el modelo está listo, ejecutarla
      if (pendingTranslation && progress === 1 && status.downloading) {
        modelManager
          .translate(
            pendingTranslation.text,
            pendingTranslation.sourceLanguage,
            pendingTranslation.targetLanguage
          )
          .then((translatedText) => {
            if (pendingTranslation?.tabId) {
              browser.tabs.sendMessage(pendingTranslation.tabId, {
                type: 'TRANSLATION_RESULT',
                data: translatedText
              }).catch((error) => {
                console.error('Error sending translation result:', error);
              });
            }
            pendingTranslation = null; // Limpiar traducción pendiente
          })
          .catch((error) => {
            console.error('Error translating pending text:', error);
            pendingTranslation = null;
          });
      }
    }
  });

  onMessage('detectLanguage', async (message) => {
    const { text } = message.data as { text: string };
    
    try {
      const language = await translationService.detectLanguage(text);
      console.log(`🔍 Language detected: ${language}`);
      
      // Devolver el resultado directamente
      return { language };
    } catch (error: unknown) {
      console.error('Error detecting language:', error);
      // Lanzar el error para que el sidepanel lo maneje
      throw new Error(error instanceof Error ? error.message : 'Error desconocido');
    }
  });

  onMessage('translateTextRequest', async (message) => {
    const { text, sourceLanguage, targetLanguage } = message.data as { 
      text: string; 
      sourceLanguage: string; 
      targetLanguage: string 
    };
    
    try {
      // Detectar idioma origen si no se proporciona
      const detectedSourceLanguage = sourceLanguage || await translationService.detectLanguage(text);

      // Validar que los idiomas origen y destino no sean iguales
      if (detectedSourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
        return {
          translatedText: text,
          sourceLanguage: detectedSourceLanguage,
          targetLanguage,
          usingCloud: false
        };
      }

      // Verificar disponibilidad del modelo
      const modelStatus = await modelManager.checkModelAvailability(detectedSourceLanguage, targetLanguage);

      if (modelStatus.available) {
        // Traducir directamente
        const translatedText = await modelManager.translate(text, detectedSourceLanguage, targetLanguage);
        return { translatedText, usingCloud: false };
      } else if (modelStatus.downloading) {
        // Modelo descargándose - lanzar error para que el sidepanel lo maneje
        throw new Error('MODEL_DOWNLOADING');
      } else {
        // Iniciar descarga del modelo - lanzar error para que el sidepanel lo maneje
        throw new Error('MODEL_NOT_AVAILABLE');
      }
    } catch (error: unknown) {
      console.error('Error in translateTextRequest:', error);
      throw error;
    }
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
    const languages = translationService.getAvailableLanguages()
    console.log('Available languages requested:', languages.length)
    return { languages: languages.map(code => ({ code, name: translationService.getLanguageName(code) })) }
  });

  // Inicializar menú contextual al instalar la extensión y configurar side panel behavior al instalar la extensión
  browser.runtime.onInstalled.addListener(() => {
    createContextMenu()

    // Configurar comportamiento del panel lateral para que se abra al hacer click en el ícono
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .then(() => {
        console.log('Side panel behavior configured successfully')
      })
      .catch((error) => {
        console.error('Error configuring side panel behavior:', error)
      })
  })

  // Recrear menú contextual al iniciar el navegador
  browser.runtime.onStartup.addListener(() => {
    createContextMenu()
  })
})
