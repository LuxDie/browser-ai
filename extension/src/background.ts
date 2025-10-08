/// <reference types="./types/browser" />

// Background script para Browser AI
// Maneja eventos del navegador y comunicación entre componentes

import {
  isValidContextMenuInput,
  getLanguagePairKey,
  addPendingTranslation,
  getPendingTranslations,
  getLanguageName,
  getAvailableLanguages,
  type ModelStatus,
  type PendingTranslation
} from './core'

// Cache de estado de modelos
const modelStatusCache: Map<string, ModelStatus> = new Map()

// Traducciones pendientes durante descargas
const pendingTranslations: PendingTranslation[] = []

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

    // NO usar caché para disponibilidad - siempre verificar en tiempo real
    // ya que el estado puede cambiar (modelos se descargan, etc.)
    try {
      // Verificar disponibilidad usando Chrome AI APIs con el método availability()
      if ('Translator' in self) {
        const availability = await self.Translator.availability({
          sourceLanguage: source,
          targetLanguage: target
        })

        console.log(`🔍 Checking model availability for ${source}→${target}:`, availability)

        let status: ModelStatus

        if (availability === 'available') {
          // Modelo ya descargado y listo
          status = {
            available: true,
            downloading: false
          }
        } else if (availability === 'downloadable') {
          // Modelo se puede descargar, pero no está disponible localmente
          status = {
            available: false,
            downloading: false,
            error: 'Modelo descargable pero no disponible localmente'
          }
        } else if (availability === 'downloading') {
          // Modelo está siendo descargado
          status = {
            available: false,
            downloading: true,
            progress: 0 // No tenemos progreso real aquí
          }
        } else {
          // Modelo no soportado o no disponible
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
      } else {
        // Fallback: asumir que no está disponible si no hay API
        const status: ModelStatus = {
          available: false,
          downloading: false,
          error: 'Chrome AI APIs no disponibles'
        }

        return status
      }
    } catch (error) {
      console.error('Error checking model availability:', error)

      const status: ModelStatus = {
        available: false,
        downloading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }

      return status
    }
  }

  // Iniciar descarga de modelo
  async downloadModel(source: string, target: string): Promise<void> {
    const key = this.#getLanguagePairKey(source, target)
    
    try {
      // Marcar como descargándose
      const status: ModelStatus = {
        available: false,
        downloading: true,
        progress: 0
      }
      modelStatusCache.set(key, status)

      // Notificar al sidepanel sobre el inicio de descarga
      await this.notifySidepanel('MODEL_DOWNLOAD_STARTED', { source, target, progress: 0 })

      if ('Translator' in self) {
        await self.Translator.create({
          sourceLanguage: source,
          targetLanguage: target
        })

        // Simular progreso de descarga (en una implementación real, esto vendría de eventos de la API)
        for (let progress = 10; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 500)) // Simular tiempo de descarga
          
          const currentStatus: ModelStatus = {
            available: false,
            downloading: true,
            progress
          }
          modelStatusCache.set(key, currentStatus)
          
          // Notificar progreso
          await this.notifySidepanel('MODEL_DOWNLOAD_PROGRESS', { source, target, progress })
        }

        // Marcar como disponible
        const finalStatus: ModelStatus = {
          available: true,
          downloading: false
        }
        modelStatusCache.set(key, finalStatus)

        // Notificar que está listo
        await this.notifySidepanel('MODEL_DOWNLOAD_COMPLETED', { source, target })
        
        // Enviar notificación push
        this.#sendNotification(`${source.toUpperCase()}→${target.toUpperCase()} listo`, 'La traducción se está completando...')
        
        // Ejecutar traducciones pendientes
        await this.#processPendingTranslations(source, target)
        
      } else {
        throw new Error('Chrome AI APIs no disponibles')
      }
    } catch (error) {
      console.error('Error downloading model:', error)
      
      const errorStatus: ModelStatus = {
        available: false,
        downloading: false,
        error: error instanceof Error ? error.message : 'Error de descarga'
      }
      modelStatusCache.set(key, errorStatus)
      
      await this.notifySidepanel('MODEL_DOWNLOAD_ERROR', { source, target, error: errorStatus.error })
    }
  }

  // Agregar traducción pendiente
  addPendingTranslation(text: string, sourceLanguage: string, targetLanguage: string): void {
    addPendingTranslation(text, sourceLanguage, targetLanguage, pendingTranslations)
    console.log('Added pending translation:', { text, sourceLanguage, targetLanguage })
  }

  // Procesar traducciones pendientes cuando el modelo esté listo
  async #processPendingTranslations(source: string, target: string): Promise<void> {
    const relevant = getPendingTranslations(source, target, pendingTranslations)

    for (const pending of relevant) {
      try {
        // Ejecutar traducción automáticamente
        await this.#executeTranslation(pending.text, pending.sourceLanguage, pending.targetLanguage)

        // Remover de pendientes
        const index = pendingTranslations.indexOf(pending)
        if (index > -1) {
          pendingTranslations.splice(index, 1)
        }
      } catch (error) {
        console.error('Error processing pending translation:', error)
        // Notificar al sidepanel del error para que resetee el estado de loading
        await this.notifySidepanel('TRANSLATION_ERROR', {
          error: error instanceof Error ? error.message : 'Error procesando traducción pendiente'
        })
      }
    }
  }

  async #executeTranslation(text: string, sourceLanguage: string, targetLanguage: string): Promise<void> {
    try {
      if ('Translator' in self) {
        const translator = await self.Translator.create({
          sourceLanguage,
          targetLanguage
        })

        const result = await translator.translate(text);

        // Notificar resultado al sidepanel
        await this.notifySidepanel('TRANSLATION_COMPLETED', {
          originalText: text,
          translatedText: result,
          sourceLanguage,
          targetLanguage,
          usingCloud: false
        })
      }
    } catch (error) {
      console.error('Error executing translation:', error)
      await this.notifySidepanel('TRANSLATION_ERROR', {
        error: error instanceof Error ? error.message : 'Error de traducción'
      })
    }
  }

  // Notificar al sidepanel
  async notifySidepanel(type: string, data: unknown): Promise<void> {
    try {
      await chrome.runtime.sendMessage({ type, data })
    } catch (error) {
      console.error('Error notifying sidepanel:', error)
    }
  }

  // Enviar notificación push
  #sendNotification(title: string, message: string): void {
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title,
        message
      })
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  // Cancelar descarga
  async cancelDownload(source: string, target: string): Promise<void> {
    const key = this.#getLanguagePairKey(source, target)
    const status = modelStatusCache.get(key)
    
    if (status?.downloading) {
      const cancelledStatus: ModelStatus = {
        available: false,
        downloading: false,
        error: 'Descarga cancelada por el usuario'
      }
      modelStatusCache.set(key, cancelledStatus)
      
      await this.notifySidepanel('MODEL_DOWNLOAD_CANCELLED', { source, target })
    }
  }

  // Obtener estado de modelo
  getModelStatus(source: string, target: string): ModelStatus | null {
    const key = this.#getLanguagePairKey(source, target)
    return modelStatusCache.get(key) || null
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
      if ('LanguageDetector' in self) {
        // Verificar disponibilidad antes de intentar crear el detector
        const availability = await self.LanguageDetector.availability()
        console.log('LanguageDetector availability for detection:', availability)
        
        if (availability === 'available') {
          const detector = await self.LanguageDetector.create()
          const results = await detector.detect(text)
          return results[0]?.detectedLanguage || 'en' // Fallback a inglés
        } else if (availability === 'downloadable') {
          console.log('LanguageDetector model is downloadable, attempting to download...')
          // Intentar crear el detector para iniciar la descarga
          const detector = await self.LanguageDetector.create()
          const results = await detector.detect(text)
          return results[0]?.detectedLanguage || 'en'
        } else if (availability === 'downloading') {
          console.log('LanguageDetector model is currently downloading, waiting...')
          // Esperar a que termine la descarga y reintentar
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
      throw error // Re-lanzar el error en lugar de usar fallback
    }
  }

  // Verificar disponibilidad real de APIs usando el método availability() correcto
  async checkAPIAvailability(): Promise<{translator: boolean, languageDetector: boolean, languageDetectorState?: string, translatorState?: string}> {
    const result = { 
      translator: false, 
      languageDetector: false,
      languageDetectorState: 'unavailable',
      translatorState: 'unavailable'
    }
    
    try {
      // Verificar LanguageDetector usando el método availability()
      if ('LanguageDetector' in self) {
        try {
          const availability = await self.LanguageDetector.availability()
          result.languageDetectorState = availability
          // LanguageDetector está disponible si es 'available' o 'downloadable'
          result.languageDetector = availability === 'available' || availability === 'downloadable'
          console.log('LanguageDetector availability check:', availability)
        } catch (error) {
          console.warn('LanguageDetector availability check failed:', error)
          result.languageDetector = false
          result.languageDetectorState = 'unavailable'
        }
      } else {
        console.log('LanguageDetector API not found in self')
      }

      // Verificar Translator usando el método availability()
      if ('Translator' in self) {
        try {
          const availability = await self.Translator.availability({
            sourceLanguage: 'en',
            targetLanguage: 'es'
          })
          result.translatorState = availability
          // Translator está disponible si es 'available' o 'downloadable'
          result.translator = availability === 'available' || availability === 'downloadable'
          console.log('Translator availability check:', availability)
        } catch (error) {
          console.warn('Translator availability check failed:', error)
          result.translator = false
          result.translatorState = 'unavailable'
        }
      } else {
        console.log('Translator API not found in self')
      }
    } catch (error) {
      console.error('Error checking API availability:', error)
    }

    console.log('Final API availability result:', result)

    // Actualizar el storage con el estado real
    await chrome.storage.local.set({
      translatorAPIAvailable: result.translator,
      languageDetectorAPIAvailable: result.languageDetector,
      languageDetectorState: result.languageDetectorState,
      translatorState: result.translatorState
    })

    return result
  }


  // Traducir texto con gestión de modelos
  async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<void> {
    try {
      // Detectar idioma origen si no se proporciona
      const detectedSourceLanguage = sourceLanguage || await this.detectLanguage(text)

      // Validar que los idiomas origen y destino no sean iguales
      if (detectedSourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
        console.log('Skipping translation: source and target languages are the same', {
          sourceLanguage: detectedSourceLanguage,
          targetLanguage
        })
        await this.#modelManager.notifySidepanel('TRANSLATION_COMPLETED', {
          translatedText: text, // Devolver el texto original sin cambios
          sourceLanguage: detectedSourceLanguage,
          targetLanguage,
          usingCloud: false
        })
        return
      }

      console.log('Translation request:', {
        text: text.substring(0, 100) + '...',
        sourceLanguage: detectedSourceLanguage,
        targetLanguage
      })

      // Verificar disponibilidad del modelo
      const modelStatus = await this.#modelManager.checkModelAvailability(detectedSourceLanguage, targetLanguage)

      if (modelStatus.available) {
        // Modelo disponible, notificar al sidepanel y traducir directamente
        await this.#modelManager.notifySidepanel('MODEL_AVAILABILITY_RESPONSE', {
          source: detectedSourceLanguage,
          target: targetLanguage,
          status: modelStatus
        })
        await this.#executeTranslation(text, detectedSourceLanguage, targetLanguage)
      } else if (modelStatus.downloading) {
        // Modelo descargándose, agregar a pendientes
        this.#modelManager.addPendingTranslation(text, detectedSourceLanguage, targetLanguage)

        // Notificar al sidepanel sobre el estado
        await this.#modelManager.notifySidepanel('MODEL_DOWNLOADING', {
          source: detectedSourceLanguage,
          target: targetLanguage,
          progress: modelStatus.progress || 0
        })
      } else {
        // Modelo no disponible localmente, iniciar descarga automática
        console.log('Model not locally available, starting automatic download')
        // Agregar traducción a pendientes antes de iniciar la descarga
        this.#modelManager.addPendingTranslation(text, detectedSourceLanguage, targetLanguage)
        await this.#modelManager.downloadModel(detectedSourceLanguage, targetLanguage)
      }
    } catch (error) {
      console.error('Error in translateText:', error)
      await this.#modelManager.notifySidepanel('TRANSLATION_ERROR', {
        error: error instanceof Error ? error.message : 'Error de traducción'
      })
    }
  }

  // Ejecutar traducción usando APIs integradas
  async #executeTranslation(text: string, sourceLanguage: string, targetLanguage: string): Promise<void> {
    try {
      if ('Translator' in self) {
        const translator = await self.Translator.create({
          sourceLanguage,
          targetLanguage
        })

        const result = await translator.translate(text)

        // Notificar resultado al sidepanel
        await this.#modelManager.notifySidepanel('TRANSLATION_COMPLETED', {
          originalText: text,
          translatedText: result,
          sourceLanguage,
          targetLanguage,
          usingCloud: false
        })
      } else {
        throw new Error('Chrome AI APIs no disponibles')
      }
    } catch (error) {
      console.error('Error executing translation:', error)
      await this.#modelManager.notifySidepanel('TRANSLATION_ERROR', {
        error: error instanceof Error ? error.message : 'Error de traducción'
      })
    }
  }

  // Traducir usando servicios en la nube (fallback)
  async translateWithCloudService(text: string, sourceLanguage: string, targetLanguage: string): Promise<void> {
    try {
      // Validar que los idiomas origen y destino no sean iguales
      if (sourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
        console.log('Skipping cloud translation: source and target languages are the same', {
          sourceLanguage,
          targetLanguage
        })
        await this.#modelManager.notifySidepanel('TRANSLATION_COMPLETED', {
          translatedText: text, // Devolver el texto original sin cambios
          sourceLanguage,
          targetLanguage,
          usingCloud: true
        })
        return
      }

      // Obtener configuración de API en nube
      const config = await chrome.storage.local.get(['cloudAPIKey', 'cloudProvider'])
      
      if (!config.cloudAPIKey || !config.cloudProvider) {
        await this.#modelManager.notifySidepanel('CLOUD_API_NOT_CONFIGURED', {
          message: 'Configura tu API de traducción en nube en las Opciones'
        })
        return
      }

      // Aquí se implementaría la llamada a la API en nube
      // Por ahora, simular una respuesta
      const translatedText = `[Traducido con ${config.cloudProvider}: ${text}]`
      
      await this.#modelManager.notifySidepanel('TRANSLATION_COMPLETED', {
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
        usingCloud: true
      })
    } catch (error) {
      console.error('Error with cloud translation:', error)
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


// Configurar menú contextual cuando se instala la extensión
chrome.runtime.onInstalled.addListener(() => {
  console.log('Browser AI: Installing extension and creating context menu')
  
  // Verificar si la API de sidePanel está disponible
  if (!chrome.sidePanel) {
    console.error('sidePanel API is not available. This extension requires Chrome 114+')
    return
  }
  
  // Crear menú contextual para texto seleccionado
  chrome.contextMenus.create({
    id: 'translate-selected-text',
    title: 'Traducir con Browser AI',
    contexts: ['selection']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error creating context menu:', chrome.runtime.lastError)
    } else {
      console.log('Context menu created successfully')
    }
  })

  // Configurar side panel
  try {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .then(() => {
        console.log('Side panel behavior configured successfully')
      })
      .catch((error) => {
        console.error('Error configuring side panel behavior:', error)
      });
  } catch (error) {
    console.error('Exception configuring side panel behavior:', error)
  }

  // Verificar disponibilidad de APIs y configurar por defecto
  void (async () => {
    try {
      console.log('Browser AI: Checking API availability on install...')
      
      const hasTranslatorAPI = 'Translator' in self
      const hasLanguageDetectorAPI = 'LanguageDetector' in self
      
      console.log('Browser AI: Basic API check on install:', {
        Translator: hasTranslatorAPI,
        LanguageDetector: hasLanguageDetectorAPI
      })
      
      // Hacer verificación más robusta si las APIs están disponibles
      let translatorAvailable = false
      let languageDetectorAvailable = false
      
      if (hasLanguageDetectorAPI) {
        try {
          const availability = await self.LanguageDetector.availability()
          languageDetectorAvailable = availability === 'available' || availability === 'downloadable'
          console.log('Browser AI: LanguageDetector availability on install:', availability)
        } catch (error) {
          console.warn('Browser AI: LanguageDetector availability check failed on install:', error)
        }
      }
      
      if (hasTranslatorAPI) {
        try {
          const availability = await self.Translator.availability({
            sourceLanguage: 'en',
            targetLanguage: 'es'
          })
          translatorAvailable = availability === 'available' || availability === 'downloadable'
          console.log('Browser AI: Translator availability on install:', availability)
        } catch (error) {
          console.warn('Browser AI: Translator availability check failed on install:', error)
        }
      }
      
      // TODO: Eliminar uso de storage local
      await chrome.storage.local.set({
        translatorAPIAvailable: translatorAvailable,
        languageDetectorAPIAvailable: languageDetectorAvailable,
        privacyMode: false
      })
      
      console.log('Browser AI: Final API availability on install:', {
        translator: translatorAvailable,
        languageDetector: languageDetectorAvailable
      })
    } catch (error) {
      console.error('Browser AI: Error checking API availability on install:', error)
      // Configuración por defecto sin APIs
      await chrome.storage.local.set({
        translatorAPIAvailable: false,
        languageDetectorAPIAvailable: false,
        defaultTargetLanguage: 'es',
        privacyMode: false
      })
    }
  })()
})

// Función auxiliar para enviar mensaje al sidepanel con reintento
const sendMessageToSidepanel = async (message: ChromeMessage, maxRetries: number = 3): Promise<void> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await chrome.runtime.sendMessage(message)
      console.log(`Message sent to sidepanel successfully (attempt ${attempt})`)
      return
    } catch (error) {
      console.warn(`Failed to send message to sidepanel (attempt ${attempt}/${maxRetries}):`, error)

      if (attempt < maxRetries) {
        // Esperar un poco más en cada intento (backoff exponencial)
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        // Último intento falló
        throw error
      }
    }
  }
}

// Manejar clics en el menú contextual
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', { menuItemId: info.menuItemId, selectionText: info.selectionText, tab })

  if (isValidContextMenuInput(String(info.menuItemId), info.selectionText, tab && tab.id && tab.windowId ? { id: tab.id, windowId: tab.windowId } : undefined)) {
    console.log('Processing context menu click for translation')

    const textData = {
      text: info.selectionText!,
      fromContextMenu: true,
      autoTranslate: true
    }

    if (tab?.windowId) {
      // Procesar de forma asíncrona sin bloquear el listener
      void (async () => {
        try {
          // Esperar a que el panel se abra completamente
          await chrome.sidePanel.open({ windowId: tab.windowId });

          // Enviar mensaje con reintento (sin delay adicional)
          await sendMessageToSidepanel({
            type: 'SELECTED_TEXT_FROM_CONTEXT_MENU',
            data: textData
          })

        } catch (error) {
          console.error('Failed to send message to sidepanel after retries:', error)
          // No hay fallback - el mensaje se perdió
        }
      })()
    }
  } else {
    console.log('Context menu click ignored - requirements not met:', {
      correctMenuItem: info.menuItemId === 'translate-selected-text',
      hasSelection: !!info.selectionText,
      hasTabId: !!tab?.id
    })
  }
});

// Manejar clics en el icono de la extensión
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension action clicked:', { tabId: tab.id, windowId: tab.windowId })
  
  if (tab.id && tab.windowId) {
    try {
      chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId })
        .then(() => {
          console.log('Side panel opened successfully from action click')
        })
        .catch((error) => {
          console.error('Error opening side panel from action click:', error)
          console.error('Error details:', JSON.stringify(error))
        });
    } catch (error) {
      console.error('Exception opening side panel from action click:', error)
    }
  } else {
    console.error('Missing tab.id or windowId in action click:', { tabId: tab.id, windowId: tab.windowId })
  }
});

// Escuchar mensajes desde content scripts y sidepanel
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender) => {
  console.log('Received message:', { type: message.type, sender })
  
  if (message.type === 'TRANSLATE_TEXT') {
    console.log('Processing TRANSLATE_TEXT message')
    
    chrome.storage.local.set({ selectedText: message.data as string })
      .then(() => {
        if (sender.tab?.id && sender.tab?.windowId) {
          try {
            chrome.sidePanel.open({ tabId: sender.tab.id, windowId: sender.tab.windowId })
              .then(() => {
                console.log('Side panel opened successfully from content script message')
              })
              .catch((error) => {
                console.error('Error opening side panel from content script:', error)
                console.error('Error details:', JSON.stringify(error))
              });
          } catch (error) {
            console.error('Exception opening side panel from content script:', error)
          }
        } else {
          console.error('Missing tab info in content script message:', { 
            tabId: sender.tab?.id,
            windowId: sender.tab?.windowId
          })
        }
      })
      .catch(error => {
        console.error('Error storing selected text from content script:', error)
      });
  } else if (message.type === 'OPEN_SIDEPANEL_USER_GESTURE') {
    console.log('Processing OPEN_SIDEPANEL_USER_GESTURE message')
    
    // Este mensaje viene de un clic directo del usuario en la notificación
    // por lo que SÍ debe contar como user gesture válido
    if (sender.tab?.id && sender.tab?.windowId) {
      try {
        chrome.sidePanel.open({ tabId: sender.tab.id, windowId: sender.tab.windowId })
          .then(() => {
            console.log('Side panel opened successfully from user gesture in notification')
          })
          .catch((error) => {
            console.error('Error opening side panel from user gesture:', error)
            console.error('Error details:', JSON.stringify(error))
          });
      } catch (error) {
        console.error('Exception opening side panel from user gesture:', error)
      }
    } else {
      console.error('Missing tab info in user gesture message:', {
        tabId: sender.tab?.id,
        windowId: sender.tab?.windowId
      })
    }
  } else if (message.type === 'CHECK_MODEL_AVAILABILITY') {
    // Verificar disponibilidad de modelo
    const data = message.data as { source: string; target: string } | undefined
    if (data?.source && data?.target) {
      const modelManager = ModelManager.getInstance()
      modelManager.checkModelAvailability(data.source, data.target)
        .then(status => {
          const response: ModelAvailabilityResponse = {
            source: data.source,
            target: data.target,
            status
          }
          // Enviar respuesta al runtime para que llegue al sidepanel
          chrome.runtime.sendMessage({
            type: 'MODEL_AVAILABILITY_RESPONSE',
            data: response
          }).catch(() => {
            // Ignorar errores si no hay listeners
          })
        })
        .catch(error => {
          console.error('Error checking model availability:', error)
        })
    }
  } else if (message.type === 'DOWNLOAD_MODEL') {
    // Iniciar descarga de modelo
    const data = message.data as { source: string; target: string } | undefined
    if (data?.source && data?.target) {
      const modelManager = ModelManager.getInstance()
      modelManager.downloadModel(data.source, data.target)
        .catch(error => {
          console.error('Error downloading model:', error)
        })
    }
  } else if (message.type === 'CANCEL_DOWNLOAD') {
    // Cancelar descarga de modelo
    const data = message.data as { source: string; target: string } | undefined
    if (data?.source && data?.target) {
      const modelManager = ModelManager.getInstance()
      modelManager.cancelDownload(data.source, data.target)
        .catch(error => {
          console.error('Error cancelling download:', error)
        })
    }
  } else if (message.type === 'ADD_PENDING_TRANSLATION') {
    // Agregar traducción pendiente
    const data = message.data as { text: string; sourceLanguage: string; targetLanguage: string } | undefined
    if (data?.text && data?.sourceLanguage && data?.targetLanguage) {
      const modelManager = ModelManager.getInstance()
      modelManager.addPendingTranslation(data.text, data.sourceLanguage, data.targetLanguage)
    }
  } else if (message.type === 'TRANSLATE_TEXT_REQUEST') {
    // Solicitud de traducción desde sidepanel
    const data = message.data as { text: string; targetLanguage: string; sourceLanguage?: string } | undefined
    if (data?.text && data?.targetLanguage) {
      const translationService = TranslationService.getInstance()
      translationService.translateText(data.text, data.targetLanguage, data.sourceLanguage)
        .catch(error => {
          console.error('Error in translation request:', error)
        })
    }
  } else if (message.type === 'TRANSLATE_WITH_CLOUD') {
    // Traducir usando servicio en nube
    const data = message.data as { text: string; sourceLanguage: string; targetLanguage: string } | undefined
    if (data?.text && data?.sourceLanguage && data?.targetLanguage) {
      const translationService = TranslationService.getInstance()
      translationService.translateWithCloudService(data.text, data.sourceLanguage, data.targetLanguage)
        .catch(error => {
          console.error('Error with cloud translation:', error)
        })
    }
  } else if (message.type === 'DETECT_LANGUAGE') {
    // Detectar idioma del texto
    const data = message.data as { text: string } | undefined
    if (data?.text) {
      const translationService = TranslationService.getInstance()
      translationService.detectLanguage(data.text)
        .then(language => {
          const response: LanguageDetected = { language }
          void chrome.runtime.sendMessage({
            type: 'LANGUAGE_DETECTED',
            data: response
          });
        })
        .catch((error: Error) => {
          console.error('Error detecting language:', error)
          // Enviar error al sidepanel
          if (sender.tab?.id) {
            void chrome.runtime.sendMessage({
              type: 'LANGUAGE_DETECTION_ERROR',
              data: { error: error.message }
            })
          }
        })
    }
  } else if (message.type === 'CHECK_API_AVAILABILITY') {
    // Verificar disponibilidad de APIs dinámicamente
    const translationService = TranslationService.getInstance()
    translationService.checkAPIAvailability()
      .then(availability => {
        // Enviar respuesta al sidepanel
        if (sender.tab?.id) {
          void chrome.runtime.sendMessage({
            type: 'API_AVAILABILITY_RESPONSE',
            data: availability
          })
        }
      })
      .catch((error: Error) => {
        console.error('Error checking API availability:', error)
      })
  } else if (message.type === 'GET_AVAILABLE_LANGUAGES') {
    // Obtener idiomas disponibles
    const translationService = TranslationService.getInstance()
    const languages = translationService.getAvailableLanguages()
    const languageNames = languages.map(code => ({
      code,
      name: translationService.getLanguageName(code)
    }))
    
    const response: AvailableLanguagesResponse = { languages: languageNames }
    if (sender.tab?.id) {
      void chrome.runtime.sendMessage({
        type: 'AVAILABLE_LANGUAGES_RESPONSE',
        data: response
      })
    }
  }
});

// Verificar disponibilidad de APIs integradas
chrome.runtime.onStartup.addListener(() => {
  void (async () => {
  try {
    console.log('Browser AI: Checking API availability on startup...')
    
    // Verificar si las APIs están disponibles usando el método recomendado por la documentación
    const hasTranslatorAPI = 'Translator' in self
    const hasLanguageDetectorAPI = 'LanguageDetector' in self
    
    console.log('Browser AI: Basic API availability check:', {
      Translator: hasTranslatorAPI,
      LanguageDetector: hasLanguageDetectorAPI,
      userAgent: navigator.userAgent,
      chromeVersion: navigator.userAgent.match(/Chrome\/(\d+)/)?.[1]
    })
    
    // Hacer verificación más robusta si las APIs están disponibles
    if (hasLanguageDetectorAPI || hasTranslatorAPI) {
      const translationService = TranslationService.getInstance()
      const realAvailability = await translationService.checkAPIAvailability()
      console.log('Browser AI: Real API availability after testing:', realAvailability)
    }
  } catch (error) {
    console.error('Browser AI: Error checking API availability on startup:', error)
    // En caso de error, asumir que las APIs no están disponibles
    void chrome.storage.local.set({
      translatorAPIAvailable: false,
      languageDetectorAPIAvailable: false
    })
  }
  })()
})

export {}
