import './sidepanel.css'
import type { LanguageDetectionError } from '../../messages'
import { getAvailableLanguages, getLanguageName } from '../../core'
import { sendMessage } from '../../messaging'
import { browser } from 'wxt/browser'

interface TranslationState {
  text: string
  translatedText: string
  editedTranslatedText: string
  sourceLanguage: string
  targetLanguage: string
  isLoading: boolean
  error: string | null
  usingCloud: boolean
  textReceived: boolean // Indica si el texto ya fue recibido (por mensaje o storage)
  autoTranslate: boolean // Indica si se debe traducir automáticamente cuando se detecte el idioma
  apiAvailable: {translator: boolean, languageDetector: boolean}
  modelStatus: {
    source: string
    target: string
    available: boolean
    downloading: boolean
    progress?: number
    error?: string
  } | null
  availableLanguages: {code: string, name: string}[]
  pendingAutoTranslate: boolean // Indica si hay una traducción automática pendiente después de detección de idioma
}


export class SidepanelApp {
  #state: TranslationState = {
    text: '',
    translatedText: '',
    editedTranslatedText: '',
    sourceLanguage: '',
    targetLanguage: '', // Se detecta automáticamente desde el navegador al abrir la extensión
    isLoading: false,
    error: null,
    usingCloud: false,
    textReceived: false,
    autoTranslate: false,
    apiAvailable: {translator: false, languageDetector: false},
    modelStatus: null,
    availableLanguages: [],
    pendingAutoTranslate: false
  }

  #elements = {
    inputText: null as HTMLTextAreaElement | null,
    targetLanguage: null as HTMLSelectElement | null,
    translateButton: null as HTMLButtonElement | null,
    translatedText: null as HTMLDivElement | null,
    resultTextArea: null as HTMLTextAreaElement | null,
    copyButton: null as HTMLButtonElement | null,
    errorMessage: null as HTMLDivElement | null,
    detectedLanguage: null as HTMLDivElement | null,
    modelStatusIndicator: null as HTMLDivElement | null,
    downloadProgress: null as HTMLDivElement | null,
    modelOptions: null as HTMLDivElement | null
  }

  constructor() {
    void this.#init()
  }

  async #init(): Promise<void> {
    this.#state.apiAvailable = this.#checkAPIAvailability()
    // Verificar disponibilidad de APIs dinámicamente (el listener global manejará la respuesta)
    this.#refreshAPIAvailability()
    await this.#loadAvailableLanguages()
    
    // Solo establecer el idioma por defecto si no se ha establecido antes
    if (!this.#state.targetLanguage) {
      const browserLang = this.#getBrowserLanguage()
      // Verificar si el idioma del navegador está soportado
      const isBrowserLangSupported = this.#state.availableLanguages.some(lang => lang.code === browserLang)
      this.#state.targetLanguage = (browserLang && isBrowserLangSupported) ? browserLang : 'es'
    }
    
    // Actualizar el selector de idiomas ahora que se cargaron los idiomas disponibles y el idioma por defecto
    this.#updateLanguageSelector()
    this.#setupEventListeners()
    this.#setupMessageListener()
    this.#render()
  }


  /**
   * Detecta el idioma principal del navegador del usuario
   * @returns Código de idioma (ej: 'es', 'en', 'fr') o null si no se puede detectar
   */
  #getBrowserLanguage(): string | null {
    try {
      let detectedLang: string | null = null

      if (navigator.languages && Array.isArray(navigator.languages) && navigator.languages.length > 0) {
        // Tomar el primer idioma y convertir 'es-ES' a 'es'
        const firstLanguage = navigator.languages[0] as string
        detectedLang = firstLanguage.split('-')[0]
      } else if (navigator.language) {
        // Fallback a navigator.language si navigator.languages no está disponible
        detectedLang = navigator.language.split('-')[0]
      }

      console.log('Browser language detected:', detectedLang)
      return detectedLang
    } catch (error) {
      console.error('Error detecting browser language:', error)
      return null
    }
  }

  async #loadAvailableLanguages(): Promise<void> {
    try {
      const response = await sendMessage('getAvailableLanguages')
      this.#state.availableLanguages = response.languages
    } catch (error) {
      console.error('Error loading available languages:', error)
      this.#state.availableLanguages = []
    }
  }

  #setupMessageListener(): void {
    browser.runtime.onMessage.addListener((message: ChromeMessage) => {
      console.log('Received message', message)
      switch (message.type) {
        case 'AVAILABLE_LANGUAGES_RESPONSE': {
          const availableLanguagesData = message.data as AvailableLanguagesResponse
          this.#state.availableLanguages = availableLanguagesData.languages
          this.#render()
          break
        }
        case 'MODEL_AVAILABILITY_RESPONSE':
          this.#handleModelAvailabilityResponse(message.data as ModelAvailabilityResponse)
          break
        case 'MODEL_DOWNLOAD_STARTED':
          this.#handleModelDownloadStarted(message.data as ModelDownloadProgress)
          break
        case 'MODEL_DOWNLOAD_PROGRESS':
          this.#handleModelDownloadProgress(message.data as ModelDownloadProgress)
          break
        case 'MODEL_DOWNLOAD_COMPLETED':
          this.#handleModelDownloadCompleted(message.data as ModelDownloadCompleted)
          break
        case 'MODEL_DOWNLOAD_ERROR':
          this.#handleModelDownloadError(message.data as ModelDownloadError)
          break
        case 'MODEL_DOWNLOAD_CANCELLED':
          this.#handleModelDownloadCancelled(message.data as ModelDownloadCancelled)
          break
        case 'MODEL_DOWNLOADING':
          this.#handleModelDownloading(message.data as ModelDownloadProgress)
          break
        case 'TRANSLATION_COMPLETED':
          this.#handleTranslationCompleted(message.data as TranslationCompleted)
          break
        case 'TRANSLATION_ERROR':
          this.#handleTranslationError(message.data as TranslationError)
          break
        case 'CLOUD_API_NOT_CONFIGURED':
          this.#handleCloudAPINotConfigured(message.data as CloudAPINotConfigured)
          break
        case 'LANGUAGE_DETECTED':
          this.#handleLanguageDetected(message.data as LanguageDetected)
          break
        case 'LANGUAGE_DETECTION_ERROR':
          this.#handleLanguageDetectionError(message.data as LanguageDetectionError)
          break
        case 'API_AVAILABILITY_RESPONSE':
          void this.#handleAPIAvailabilityResponse(message.data as {translator: boolean, languageDetector: boolean, languageDetectorState?: string, translatorState?: string})
          break
        case 'SELECTED_TEXT': {
          const data = message.data as { text: string; autoTranslate?: boolean }
          console.log('Handling selected text:', { text: data.text.substring(0, 50) + '...', autoTranslate: data.autoTranslate })
          this.#setSelectedText(data.text, data.autoTranslate || false)
          break
        }
      }
    })
  }

  #detectLanguage(text: string): void {
    void (async () => {
      try {
        // Limpiar errores previos
        this.#state.error = null

        // Verificar que hay suficiente texto (mínimo 15 caracteres para detección confiable)
        if (text.trim().length < 15) {
          this.#state.sourceLanguage = ''
          this.#render()
          return
        }

        // Verificar si el detector de idioma está disponible antes de intentar detectar
        if (!this.#state.apiAvailable.languageDetector) {
          console.log('Language detector not available, attempting to refresh API availability')
          this.#refreshAPIAvailability()
          return
        }

        // Enviar la solicitud y esperar la respuesta
        const response = await sendMessage('detectLanguage', { text })
        this.#state.sourceLanguage = response.language
        this.#state.error = null
        this.#render()

        // Ejecutar traducción automáticamente si está configurado
        const languagesAreDifferent = !this.#state.targetLanguage ||
          this.#state.sourceLanguage.toLowerCase() !== this.#state.targetLanguage.toLowerCase()

        if ((this.#state.autoTranslate || this.#state.pendingAutoTranslate) &&
            this.#state.text.trim().length >= 15 &&
            languagesAreDifferent) {
          this.#state.pendingAutoTranslate = false
          void this.#translateText()
        } else if (this.#state.pendingAutoTranslate) {
          this.#state.pendingAutoTranslate = false
        }
      } catch (error) {
        console.error('Error detecting language:', error)
        this.#state.sourceLanguage = ''
        this.#state.error = error instanceof Error ? error.message : 'Error al detectar el idioma'
        this.#render()
      }
    })()
  }

  #translateText(): void {
    void (async () => {
      try {
        if (!this.#state.text.trim()) return

        // Resetear la bandera de traducción automática después del primer uso
        this.#state.autoTranslate = false

        // Validar que se puede traducir antes de proceder
        const hasEnoughText = this.#state.text.trim().length >= 15
        if (!this.#state.sourceLanguage && hasEnoughText) {
          this.#state.error = 'No se pudo detectar el idioma del texto. Intenta con más texto o selecciona el idioma manualmente.'
          this.#render()
          return
        }

        this.#state.isLoading = true
        this.#state.error = null
        this.#render()

        // Enviar solicitud y esperar respuesta
        const response = await sendMessage('translateTextRequest', {
          text: this.#state.text,
          targetLanguage: this.#state.targetLanguage,
          sourceLanguage: this.#state.sourceLanguage
        })

        // Manejar respuesta exitosa
        this.#state.translatedText = response.translatedText
        this.#state.editedTranslatedText = response.translatedText
        this.#state.usingCloud = response.usingCloud
        this.#state.isLoading = false
        this.#state.error = null
        this.#state.modelStatus = null
        this.#render()
      } catch (error) {
        console.error('Error translating text:', error)
        this.#state.error = error instanceof Error ? error.message : 'Error de traducción'
        this.#state.isLoading = false
        this.#render()
      }
    })()
  }

  #checkAPIAvailability(): {translator: boolean, languageDetector: boolean} {
    try {
      // Verificar disponibilidad directamente de las APIs de Chrome
      const translatorAvailable = 'Translator' in self
      const languageDetectorAvailable = 'LanguageDetector' in self

      console.log('Sidepanel API availability check:', {
        translator: translatorAvailable,
        languageDetector: languageDetectorAvailable
      })

      return {
        translator: translatorAvailable,
        languageDetector: languageDetectorAvailable
      }
    } catch (error) {
      console.error('Error checking API availability:', error)
      return {
        translator: false,
        languageDetector: false
      }
    }
  }

  #refreshAPIAvailability(): void {
    void (async () => {
      try {
        const availability = await sendMessage('checkAPIAvailability')
        this.#state.apiAvailable = availability
        console.log('API availability updated:', availability)

        // Si el detector de idioma se volvió disponible y hay texto para detectar, intentar detectar
        if (availability.languageDetector && this.#state.text.trim().length >= 15 && !this.#state.sourceLanguage) {
          console.log('Language detector became available, attempting to detect language for existing text')
          this.#detectLanguage(this.#state.text)
        }

        this.#render()
      } catch (error) {
        console.error('Error refreshing API availability:', error)
      }
    })()
  }

  async #copyToClipboard(): Promise<void> {
    try {
      // Copiar el texto editado si existe, sino el texto traducido original
      const textToCopy = this.#state.editedTranslatedText || this.#state.translatedText
      await navigator.clipboard.writeText(textToCopy)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  #setupEventListeners(): void {
    // Input text change
    this.#elements.inputText?.addEventListener('input', (e) => {
      const previousText = this.#state.text
      this.#state.text = (e.target as HTMLTextAreaElement).value

      // Cancelar traducciones pendientes cuando cambia el texto
      if (previousText !== this.#state.text) {
        this.#cancelPendingTranslations()
      }

      this.#detectLanguage(this.#state.text)
      this.#render()
    })

    // Target language change
    this.#elements.targetLanguage?.addEventListener('change', (e) => {
      const previousTargetLanguage = this.#state.targetLanguage
      this.#state.targetLanguage = (e.target as HTMLSelectElement).value
      console.log({
        previousTargetLanguage,
        targetLanguage: this.#state.targetLanguage,
      })

      // Cancelar traducciones pendientes cuando cambia el idioma destino
      if (previousTargetLanguage !== this.#state.targetLanguage) {
        this.#cancelPendingTranslations()
      }

      // Actualizar la interfaz después del cambio de idioma
      this.#render()
    })

    // Translate button
    this.#elements.translateButton?.addEventListener('click', () => {
      void this.#translateText()
    })
  }

  #cancelPendingTranslations(): void {
    // Enviar mensaje de cancelación sin esperar respuesta
    void sendMessage('cancelPendingTranslations')
    
    // Actualizar estado inmediatamente
    this.#state.modelStatus = null
    this.#state.isLoading = false
    this.#state.error = null
    this.#render()
  }

  // Métodos de manejo de eventos del ModelManager
  #handleModelAvailabilityResponse(data: ModelAvailabilityResponse): void {
    console.log(`📨 Received MODEL_AVAILABILITY_RESPONSE for ${data.source}→${data.target}:`, data.status)
    this.#state.modelStatus = {
      source: data.source,
      target: data.target,
      ...data.status
    }
    this.#render()
  }

  #handleModelDownloadStarted(data: ModelDownloadProgress): void {
    this.#state.modelStatus = {
      source: data.source,
      target: data.target,
      available: false,
      downloading: true,
      progress: 0
    }
    this.#render()
  }

  #handleModelDownloadProgress(data: ModelDownloadProgress): void {
    if (this.#state.modelStatus) {
      this.#state.modelStatus.progress = data.progress
      this.#render()
    }
  }

  #handleModelDownloadCompleted(data: ModelDownloadCompleted): void {
    this.#state.modelStatus = {
      source: data.source,
      target: data.target,
      available: true,
      downloading: false
    }
    this.#render()
  }

  #handleModelDownloadError(data: ModelDownloadError): void {
    this.#state.modelStatus = {
      source: this.#state.sourceLanguage,
      target: this.#state.targetLanguage,
      available: false,
      downloading: false,
      error: data.error
    }
    this.#render()
  }

  #handleModelDownloadCancelled(data: ModelDownloadCancelled): void {
    // Limpiar el estado del modelo cuando se cancela la descarga
    this.#state.modelStatus = {
      source: data.source,
      target: data.target,
      available: false,
      downloading: false,
      error: 'Descarga cancelada por el usuario'
    }
    this.#render()
  }


  #handleModelDownloading(data: ModelDownloadProgress): void {
    this.#state.modelStatus = {
      source: data.source,
      target: data.target,
      available: false,
      downloading: true,
      progress: data.progress
    }
    this.#render()
  }

  #handleTranslationCompleted(data: TranslationCompleted): void {
    this.#state.translatedText = data.translatedText
    this.#state.editedTranslatedText = data.translatedText // Inicializar el texto editado con la traducción original
    this.#state.usingCloud = data.usingCloud ?? false
    this.#state.isLoading = false
    this.#state.error = null
    // Limpiar el estado del modelo después de la traducción (la notificación push es temporal)
    this.#state.modelStatus = null
    this.#render()
  }

  #handleTranslationError(data: TranslationError): void {
    this.#state.error = data.error
    this.#state.isLoading = false
    this.#render()
  }

  #handleCloudAPINotConfigured(data: CloudAPINotConfigured): void {
    this.#state.error = data.message
    this.#state.isLoading = false
    this.#render()
  }

  #handleLanguageDetected(data: LanguageDetected): void {
    this.#state.sourceLanguage = data.language
    this.#state.error = null // Limpiar cualquier error de detección previo
    this.#render()

    // Ejecutar traducción automáticamente si está configurado o si hay una traducción pendiente
    // pero solo si los idiomas fuente y destino son diferentes
    const languagesAreDifferent = !this.#state.targetLanguage ||
      this.#state.sourceLanguage.toLowerCase() !== this.#state.targetLanguage.toLowerCase()

    if ((this.#state.autoTranslate || this.#state.pendingAutoTranslate) &&
        this.#state.text.trim().length >= 15 &&
        languagesAreDifferent) {
      this.#state.pendingAutoTranslate = false // Limpiar la bandera pendiente
      void this.#translateText()
    } else if (this.#state.pendingAutoTranslate) {
      // Limpiar la bandera pendiente incluso si no se traduce
      this.#state.pendingAutoTranslate = false
    }
  }

  #handleLanguageDetectionError(data: LanguageDetectionError): void {
    this.#state.sourceLanguage = '' // Resetear el idioma fuente en caso de error
    this.#state.error = data.error
    this.#render()
  }

  #setSelectedText(text: string, autoTranslate = false): void {
    console.log('Setting selected text:', { text: text.substring(0, 50) + '...', autoTranslate })
    this.#state.text = text
    this.#state.textReceived = true
    this.#state.autoTranslate = autoTranslate

    // Si se debe traducir automáticamente, marcar como pendiente (se ejecutará cuando se detecte el idioma)
    if (autoTranslate) {
      this.#state.pendingAutoTranslate = true
    }

    // Detectar idioma del texto
    this.#detectLanguage(text)

    this.#render()
  }


  #handleAPIAvailabilityResponse(data: {translator: boolean, languageDetector: boolean, languageDetectorState?: string, translatorState?: string}): void {
    this.#state.apiAvailable = data
    console.log('API availability updated from background:', data)
    console.log('Previous API availability state:', this.#state.apiAvailable)

    // Si el detector de idioma se volvió disponible y hay texto para detectar, intentar detectar
    if (data.languageDetector && this.#state.text.trim().length >= 15 && !this.#state.sourceLanguage) {
      console.log('Language detector became available, attempting to detect language for existing text')
      this.#detectLanguage(this.#state.text)
    }

    this.#render()
  }

  // Métodos de UI para manejo de modelos

  #render(): void {
    const container = document.getElementById('root')
    if (!container) return

    // Only render the initial structure once
    if (container.innerHTML === '') {
      container.innerHTML = `
        <div class="h-full flex flex-col p-4">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-800 mb-2">Browser AI</h1>
            <p class="text-sm text-gray-600">Traducción con IA integrada</p>
            <div id="api-status-container" class="mt-3 flex gap-2 text-xs"></div>
            <div id="api-warning-container"></div>
          </div>

          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <label for="input-text" class="block text-sm font-medium text-gray-700">
                Texto a traducir
              </label>
              <div id="language-info-container"></div>
            </div>
            <textarea
              id="input-text"
              class="input-field h-32 resize-none"
              placeholder="Escribe o pega el texto aquí..."
            ></textarea>
          </div>

          <div class="mb-4">
            <label for="target-language" class="block text-sm font-medium text-gray-700 mb-2">
              Idioma destino
            </label>
            <select id="target-language" class="input-field"></select>
          </div>

          <div id="model-status-container" class="mb-4"></div>

          <button id="translate-button" class="btn-primary w-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed"></button>

          <div id="translate-warning-container" class="mb-4"></div>

          <div id="result-container"></div>
          <div id="error-container"></div>
        </div>
      `
      this.#elements.inputText = document.getElementById('input-text') as HTMLTextAreaElement
      this.#elements.targetLanguage = document.getElementById('target-language') as HTMLSelectElement
      this.#elements.translateButton = document.getElementById('translate-button') as HTMLButtonElement
      this.#setupEventListeners()
    }

    // Update dynamic content without re-rendering the whole structure
    this.#updateAPIStatus()
    this.#updateAPIWarning()
    this.#updateInputField()
    this.#updateLanguageSelector()
    this.#updateModelStatus()
    this.#updateTranslateButton()
    this.#updateTranslateWarning()
    this.#updateResult()
    this.#updateError()
    this.#updateLanguageInfo()
  }

  #updateAPIStatus(): void {
    const apiStatusContainer = document.getElementById('api-status-container')
    if (apiStatusContainer) {
      apiStatusContainer.innerHTML = `
        ${this.#renderAPIStatus('Traductor', this.#state.apiAvailable.translator)}
        ${this.#renderAPIStatus('Detector de Idioma', this.#state.apiAvailable.languageDetector)}
      `
    }
  }

  #updateAPIWarning(): void {
    const apiWarningContainer = document.getElementById('api-warning-container')
    if (apiWarningContainer) {
      apiWarningContainer.innerHTML = !this.#state.apiAvailable.translator ? `
        <div class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-yellow-800 text-xs">
            ⚠️ Las APIs nativas de Chrome no están disponibles. Asegúrate de usar Chrome 138+ con características de IA habilitadas.
          </p>
        </div>
      ` : ''
    }
  }

  #updateInputField(): void {
    if (this.#elements.inputText && this.#elements.inputText.value !== this.#state.text) {
      this.#elements.inputText.value = this.#state.text
    }
  }

  #updateLanguageSelector(): void {
    if (this.#elements.targetLanguage) {
      const optionsHTML = this.#state.availableLanguages.length > 0 ?
        this.#state.availableLanguages.map(lang =>
          `<option value="${lang.code}">${lang.name}</option>`
        ).join('') :
        getAvailableLanguages().map(code =>
          `<option value="${code}">${getLanguageName(code)}</option>`
        ).join('')

      this.#elements.targetLanguage.innerHTML = optionsHTML
      this.#elements.targetLanguage.value = this.#state.targetLanguage
    }
  }

  #updateModelStatus(): void {
    const modelStatusContainer = document.getElementById('model-status-container')
    if (modelStatusContainer) {
      const newContent = this.#renderModelStatus()
      const currentContent = modelStatusContainer.innerHTML

      // Solo actualizar si el contenido cambió realmente para evitar reinicios de animación
      if (newContent !== currentContent) {
        modelStatusContainer.innerHTML = newContent
      }
    }
  }


  #updateTranslateButton(): void {
    if (this.#elements.translateButton) {
      const hasText = this.#state.text.trim().length > 0
      const hasSourceLanguage = this.#state.sourceLanguage !== ''
      const languagesAreSame = this.#state.sourceLanguage && this.#state.targetLanguage &&
        this.#state.sourceLanguage.toLowerCase() === this.#state.targetLanguage.toLowerCase()
      const modelIsDownloading = this.#state.apiAvailable.translator && this.#state.modelStatus?.downloading === true
      const canTranslate = hasText && !this.#state.isLoading && this.#state.error === null && hasSourceLanguage && !languagesAreSame && !modelIsDownloading
      console.log('[TranslateButton state]', {
        hasText,
        hasSourceLanguage,
        languagesAreSame,
        modelIsDownloading,
        isLoading: this.#state.isLoading,
        errorIsNull: this.#state.error === null,
        targetLanguage: this.#state.targetLanguage,
        sourceLanguage: this.#state.sourceLanguage,
        canTranslate
      })
      console.count(`updateTranslateButton`)
      this.#elements.translateButton.disabled = !canTranslate

      this.#elements.translateButton.innerHTML = this.#state.isLoading ? `
        <div class="flex items-center justify-center">
          <div class="loading-spinner mr-2"></div>
          Traduciendo...
        </div>
      ` : this.#state.error !== null ? 'Traducir (No disponible)' :
        (this.#state.text.trim().length >= 15 && this.#state.sourceLanguage === '') ? 'Traducir (Detectando idioma...)' : 'Traducir'
    }
  }

  #updateResult(): void {
    const resultContainer = document.getElementById('result-container')
    if (resultContainer) {
      if (this.#state.translatedText) {
        resultContainer.innerHTML = `
          <div class="flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-700">
                  Traducción
                </label>
                ${!this.#state.usingCloud ? `
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                    🔒 Traducido localmente
                  </span>
                ` : `
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                    ☁️ Traducido en la nube
                  </span>
                `}
              </div>
              <button id="copy-button" class="btn-secondary text-xs">
                Copiar
              </button>
            </div>
            <div class="flex-1 bg-white border border-gray-300 rounded-lg p-3 overflow-auto">
              <textarea
                id="result-text"
                class="w-full h-full resize-none bg-transparent border-none outline-none text-gray-800"
                style="min-height: 120px;"
              >${this.#state.editedTranslatedText || this.#state.translatedText}</textarea>
            </div>
          </div>
        `
        this.#elements.resultTextArea = document.getElementById('result-text') as HTMLTextAreaElement
        this.#elements.resultTextArea?.addEventListener('input', (e) => {
          this.#state.editedTranslatedText = (e.target as HTMLTextAreaElement).value
        })
        this.#elements.copyButton = document.getElementById('copy-button') as HTMLButtonElement
        this.#elements.copyButton?.addEventListener('click', () => {
          void this.#copyToClipboard()
        })
      } else {
        resultContainer.innerHTML = ''
      }
    }
  }

  #updateError(): void {
    const errorContainer = document.getElementById('error-container')
    if (errorContainer) {
      errorContainer.innerHTML = this.#state.error ? `
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800 text-sm">${this.#state.error}</p>
        </div>
      ` : ''
    }
  }

  #updateLanguageInfo(): void {
    const languageInfoContainer = document.getElementById('language-info-container')
    if (languageInfoContainer) {
      const hasText = this.#state.text.trim().length > 0
      const hasEnoughText = this.#state.text.trim().length >= 15
      
      if (this.#state.sourceLanguage && hasEnoughText) {
        languageInfoContainer.innerHTML = `
          <div class="p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-blue-800 text-xs">
              Idioma detectado: <span class="font-medium">${getLanguageName(this.#state.sourceLanguage)}</span>
            </p>
          </div>
        `
      } else if (hasText && !hasEnoughText) {
        languageInfoContainer.innerHTML = `
          <div class="p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <p class="text-gray-600 text-xs">
              No hay suficiente texto para detectar el idioma
            </p>
          </div>
        `
      } else {
        languageInfoContainer.innerHTML = ''
      }
    }
  }

  #renderAPIStatus(name: string, isAvailable: boolean): string {
    if (isAvailable) {
      return `
        <span class="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
          ✅ ${name}
        </span>
      `
    } else {
      return `
        <span class="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800">
          ❌ ${name}
        </span>
      `
    }
  }

  #renderModelStatus(): string {
    if (this.#state.modelStatus?.downloading) {
      return `
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center mb-3">
            <span class="font-medium text-blue-800">📥 Descargando modelo (${this.#state.modelStatus.source}-${this.#state.modelStatus.target}) por única vez...</span>
          </div>
          <div id="download-progress-bar" class="progress-indeterminate mb-2"></div>
          <div class="text-sm text-blue-700">
            La descarga puede tomar algunos minutos. Por favor, espere...
          </div>
        </div>
      `
    }

    return ''
  }


  #updateTranslateWarning(): void {
    const warningContainer = document.getElementById('translate-warning-container')
    if (warningContainer) {
      const hasText = this.#state.text.trim().length > 0
      const hasSourceLanguage = this.#state.sourceLanguage !== ''
      const languagesAreSame = this.#state.sourceLanguage && this.#state.targetLanguage &&
        this.#state.sourceLanguage.toLowerCase() === this.#state.targetLanguage.toLowerCase()

      if (hasText && hasSourceLanguage && languagesAreSame) {
        warningContainer.innerHTML = `
          <div class="p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p class="text-amber-800 text-xs">
              ⚠️ Los idiomas de origen y destino son iguales. Selecciona un idioma destino diferente.
            </p>
          </div>
        `
      } else {
        warningContainer.innerHTML = ''
      }
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new SidepanelApp()
})
