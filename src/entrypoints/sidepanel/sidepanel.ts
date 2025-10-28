import '@/entrypoints/sidepanel/sidepanel.css';
import {
  DEFAULT_TARGET_LANGUAGE,
  AvailableLanguages,
  LanguageCode,
} from '@/entrypoints/background';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import type { AIModelStatus } from '../background/model-manager/model-manager.model';

interface TranslationState {
  text: string
  translatedText: string
  editedTranslatedText: string
  summaryText: string
  sourceLanguage: LanguageCode | null
  targetLanguage: LanguageCode
  isLoading: boolean
  error: string | null
  apiAvailable: boolean
  modelStatus: AIModelStatus | null
  availableLanguages: AvailableLanguages | null
}

export class SidepanelApp {
  #state: TranslationState = {
    text: '',
    translatedText: '',
    editedTranslatedText: '',
    summaryText: '',
    sourceLanguage: null,
    targetLanguage: DEFAULT_TARGET_LANGUAGE,
    isLoading: false,
    error: null,
    apiAvailable: false,
    modelStatus: null,
    availableLanguages: null,
  };

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
  };

  #defaultTargetLanguage = DEFAULT_TARGET_LANGUAGE;

  constructor() {
    void this.#init();
  }

  async #init(): Promise<void> {
    this.#state.apiAvailable = await this.#checkAPIAvailability();
    this.#state.availableLanguages = (await sendMessage('getAvailableLanguages')).languages;
    
    const browserLang = await sendMessage('getBrowserLanguage');
    // Verificar si el idioma del navegador está soportado
    const isBrowserLangSupported = this.#state.availableLanguages.some(lang => lang.code === browserLang);
    this.#state.targetLanguage = (browserLang && isBrowserLangSupported) ? browserLang : this.#defaultTargetLanguage;
    
    this.#render();

    // Notificar al background que el sidepanel está listo
    void sendMessage('sidepanelReady');
    this.#setupMessageListeners();

  }

  #setupMessageListeners(): void {
    onMessage('selectedText', (message) => {
      void this.#handleSelectedText(message.data);
    });
    onMessage('modelStatusUpdate', (message) => {
      this.#handleModelStatusUpdate(message.data);
    });
  }

  async #translateText(): Promise<void> {
    this.#state.isLoading = true;
    this.#state.error = null;
    this.#render();

    const response = await sendMessage('translateText', {
      text: this.#state.text,
      targetLanguage: this.#state.targetLanguage,
      sourceLanguage: this.#state.sourceLanguage!
    });

    // Manejar respuesta exitosa
    this.#state.translatedText = response;
    this.#state.editedTranslatedText = response;
    this.#resetTranslationState();
    this.#render();
  }

  async #checkAPIAvailability(): Promise<boolean> {
    try {
      const response = await sendMessage('checkAPIAvailability');
      return response;
    } catch (error) {
      console.error('Error checking API availability:', error);
      return false;
    }
  }

  async #copyToClipboard(): Promise<void> {
    try {
      // Copiar el texto editado si existe, sino el texto traducido original
      // TODO: revisar cambio por ??
      const textToCopy = this.#state.editedTranslatedText || this.#state.translatedText;
      await navigator.clipboard.writeText(textToCopy);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }

  #setupEventListeners(): void {
    // Cuando se modifica el texto del textarea:
    this.#elements.inputText?.addEventListener('input', (e) => {
      const text = (e.target as HTMLTextAreaElement).value;
      void this.#handleInputChange(text);
    });

    // Target language change
    this.#elements.targetLanguage?.addEventListener('change', (e) => {
      const previousTargetLanguage = this.#state.targetLanguage;
      this.#state.targetLanguage = (e.target as HTMLSelectElement).value as LanguageCode;

      // Cancelar traducciones pendientes cuando cambia el idioma destino
      if (previousTargetLanguage !== this.#state.targetLanguage) {
        this.#cancelPendingTranslations();
      }

      // Actualizar la interfaz después del cambio de idioma
      this.#render();
    });
    

    // Translate button
    this.#elements.translateButton?.addEventListener('click', () => {
      void this.#translateText();
    });
  }
  async #handleInputChange(text: string): Promise<void> {
    const previousText = this.#state.text;
    this.#state.text = text;
    if (previousText === this.#state.text) {
      return;
    }

    this.#cancelPendingTranslations();
    this.#state.sourceLanguage = await this.#detectLanguage();
    this.#render();
  }

  async #detectLanguage(): Promise<LanguageCode | null> {
    if (this.#state.text.trim().length >= 15) {
      const response = await sendMessage('detectLanguage', { text: this.#state.text });
      return response.languageCode;
    } else {
      return null;
    }
  }

  #cancelPendingTranslations(): void {
    // Enviar mensaje de cancelación sin esperar respuesta
    void sendMessage('cancelPendingTranslations');
    
    this.#resetTranslationState();
    this.#render();
  }

  #resetTranslationState(): void {
    this.#state.isLoading = false;
    this.#state.error = null;
    this.#state.modelStatus = null;
  }

  // Métodos de manejo de eventos del ModelManager
  #handleModelStatusUpdate(data: AIModelStatus): void {
    this.#state.modelStatus = data;
    this.#render();
  }

  async #handleSelectedText(text: string) {
    await this.#handleInputChange(text);
    
    // Verificar si los idiomas son iguales antes de traducción automática desde menú contextual
    if (this.#state.sourceLanguage === this.#state.targetLanguage) {
      this.#state.isLoading = false;
      this.#state.modelStatus = null;
      this.#render();
      return;
    }
    
    void this.#translateText();
  }

  // Métodos de UI para manejo de modelos

  #render(): void {
    const container = document.getElementById('root');
    if (!container) return;

    // Only render the initial structure once
    if (container.innerHTML === '') {
      container.innerHTML = `
        <div class="h-full flex flex-col p-4">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-800 mb-2">Browser AI</h1>
            <p class="text-sm text-gray-600">Traducción con IA integrada</p>
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
      `;
      this.#elements.inputText = document.getElementById('input-text') as HTMLTextAreaElement;
      this.#elements.targetLanguage = document.getElementById('target-language') as HTMLSelectElement;
      this.#elements.translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      this.#setupEventListeners();
    }

    // Update dynamic content without re-rendering the whole structure
    this.#updateAPIWarning();
    this.#updateInputField();
    this.#updateLanguageSelector();
    this.#updateModelStatus();
    this.#updateTranslateButton();
    this.#updateTranslateWarning();
    this.#updateResult();
    this.#updateError();
    this.#updateLanguageInfo();
  }

  #updateAPIWarning(): void {
    const apiWarningContainer = document.getElementById('api-warning-container');
    if (apiWarningContainer) {
      apiWarningContainer.innerHTML = !this.#state.apiAvailable ? `
        <div class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-yellow-800 text-xs">
            ⚠️ Las APIs nativas del navegador no están disponibles. Asegúrate de tener la versión más reciente de tu navegador.
          </p>
        </div>
      ` : '';
    }
  }

  #updateInputField(): void {
    if (this.#elements.inputText && this.#elements.inputText.value !== this.#state.text) {
      this.#elements.inputText.value = this.#state.text;
    }
  }

  #updateLanguageSelector(): void {
    if (this.#elements.targetLanguage) {
      if (this.#state.availableLanguages) {
        const optionsHTML = this.#state.availableLanguages.map(lang =>
          `<option value="${lang.code}">${lang.name}</option>`
        ).join('');
        this.#elements.targetLanguage.innerHTML = optionsHTML;
      } else {
        this.#elements.targetLanguage.innerHTML = '<option value="">Idiomas no disponibles</option>';
      }
      this.#elements.targetLanguage.value = this.#state.targetLanguage;
    }
  }

  #updateModelStatus(): void {
    const modelStatusContainer = document.getElementById('model-status-container');
    if (modelStatusContainer) {
      const newContent = this.#renderModelStatus();
      const currentContent = modelStatusContainer.innerHTML;

      // Solo actualizar si el contenido cambió realmente para evitar reinicios de animación
      if (newContent !== currentContent) {
        modelStatusContainer.innerHTML = newContent;
      }
    }
  }

  #updateTranslateButton(): void {
    if (this.#elements.translateButton) {
      const hasText = this.#state.text.trim().length > 0;
      const hasSourceLanguage = this.#state.sourceLanguage !== null;
      const languagesAreSame = this.#state.sourceLanguage?.toLowerCase() === this.#state.targetLanguage.toLowerCase();
      const modelIsDownloading = this.#state.modelStatus?.state === 'downloading';
      const canTranslate = hasText 
        && !this.#state.isLoading 
        && this.#state.error === null 
        && hasSourceLanguage 
        && !languagesAreSame 
        && !modelIsDownloading;
      this.#elements.translateButton.disabled = !canTranslate;

      this.#elements.translateButton.innerHTML = this.#state.isLoading ? `
        <div class="flex items-center justify-center">
          <div class="loading-spinner mr-2"></div>
          Traduciendo...
        </div>
      ` : 'Traducir';
    }
  }

  #updateResult(): void {
    const resultContainer = document.getElementById('result-container');
    if (resultContainer) {
      if (this.#state.translatedText) {
        resultContainer.innerHTML = `
          <div class="flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-gray-700">
                  Traducción
                </label>
                <span id="translation-source" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  🔒 Traducido localmente
                </span>
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
        `;
        this.#elements.resultTextArea = document.getElementById('result-text') as HTMLTextAreaElement;
        this.#elements.resultTextArea.addEventListener('input', (e) => {
          this.#state.editedTranslatedText = (e.target as HTMLTextAreaElement).value;
        });
        this.#elements.copyButton = document.getElementById('copy-button') as HTMLButtonElement;
        this.#elements.copyButton.addEventListener('click', () => {
          void this.#copyToClipboard();
        });
      } else {
        resultContainer.innerHTML = '';
      }
    }
  }

  #updateError(): void {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.innerHTML = this.#state.error ? `
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800 text-sm">${this.#state.error}</p>
        </div>
      ` : '';
    }
  }

  #updateLanguageInfo(): void {
    const languageInfoContainer = document.getElementById('language-info-container');
    if (languageInfoContainer) {
      const hasText = this.#state.text.trim().length > 0;
      const hasEnoughText = this.#state.text.trim().length >= 15;
      
      if (this.#state.sourceLanguage && hasEnoughText) {
        const detectedLanguage = this.#state.availableLanguages?.find(lang => lang.code === this.#state.sourceLanguage);
        if (!detectedLanguage) {
          throw new Error('Idioma detectado no está configurado');
        }
        const languageName = detectedLanguage.name;
        languageInfoContainer.innerHTML = `
          <div class="p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-blue-800 text-xs">
              Idioma detectado: <span class="font-medium">${languageName}</span>
            </p>
          </div>
        `;
      } else if (hasText && !hasEnoughText) {
        languageInfoContainer.innerHTML = `
          <div class="p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <p class="text-gray-600 text-xs">
              No hay suficiente texto para detectar el idioma
            </p>
          </div>
        `;
      } else {
        languageInfoContainer.innerHTML = '';
      }
    }
  }

  #renderModelStatus(): string {
    if (this.#state.modelStatus?.state === 'downloading') {
      return `
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center mb-3">
            <span class="font-medium text-blue-800">📥 Descargando traductor (${this.#state.sourceLanguage!} - ${this.#state.targetLanguage}) por única vez...</span>
          </div>
          <div id="download-progress-bar" class="progress-indeterminate mb-2"></div>
          <div class="text-sm text-blue-700">
            La descarga puede tomar algunos minutos. Por favor, espere...
          </div>
        </div>
      `;
    }

    return '';
  }


  #updateTranslateWarning(): void {
    const warningContainer = document.getElementById('translate-warning-container');
    if (warningContainer) {
      const hasText = this.#state.text.trim().length > 0;
      const hasSourceLanguage = this.#state.sourceLanguage !== null;
      const languagesAreSame = this.#state.sourceLanguage?.toLowerCase() === this.#state.targetLanguage.toLowerCase();

      if (hasText && hasSourceLanguage && languagesAreSame) {
        warningContainer.innerHTML = `
          <div id="warning-container" class="p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p class="text-amber-800 text-xs">
              ⚠️ Los idiomas de origen y destino son iguales. Selecciona un idioma destino diferente.
            </p>
          </div>
        `;
      } else {
        warningContainer.innerHTML = '';
      }
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new SidepanelApp();
});
