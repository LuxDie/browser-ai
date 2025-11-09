import '@/entrypoints/sidepanel/sidepanel.css';
import {
  DEFAULT_TARGET_LANGUAGE,
} from '@/entrypoints/background';
import type { AvailableLanguages, LanguageCode, } from '@/entrypoints/background';
import { onMessage, sendMessage, type SelectedTextData } from '@/entrypoints/background/messaging';
import type { AIModelStatus } from '../background/model-manager/model-manager.model';
import { getAIService } from '../background/ai/ai.service';
import type { Component } from 'vue';
import { createApp, nextTick } from 'vue';
import ProcessControls from './components/ProcessControls.vue';

interface TranslationState {
  text: string
  translatedText: string
  editedTranslatedText: string
  summaryText: string
  sourceLanguage: LanguageCode | null
  targetLanguage: LanguageCode
  summarize: boolean
  isLoading: boolean
  error: string | null
  apiAvailable: boolean
  modelStatus: AIModelStatus | null
  availableLanguages: AvailableLanguages | null
}

export class SidepanelApp {
  #AIService = getAIService();
  #state: TranslationState = {
    text: '',
    translatedText: '',
    editedTranslatedText: '',
    summaryText: '',
    sourceLanguage: null,
    targetLanguage: DEFAULT_TARGET_LANGUAGE,
    summarize: false,
    isLoading: false,
    error: null,
    apiAvailable: false,
    modelStatus: null,
    availableLanguages: null,
  };

  #elements = {
    inputText: null as HTMLTextAreaElement | null,
    targetLanguage: null as HTMLSelectElement | null,
    summarizeCheckbox: null as HTMLInputElement | null,
    processButton: null as HTMLButtonElement | null,
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

  async #processText(): Promise<void> {
    this.#state.isLoading = true;
    this.#state.error = null;
    this.#render();

    try {
      const response = await this.#AIService.processText(this.#state.text, {
        sourceLanguage: this.#state.sourceLanguage!,
        targetLanguage: this.#state.targetLanguage,
        summarize: this.#state.summarize
      });

      // Manejar respuesta exitosa
      // TODO: tipar mejor response
      this.#state.translatedText = response ?? '';
      this.#state.editedTranslatedText = response ?? '';
    } catch (error) {
      this.#state.error = error instanceof Error ? error.message : browser.i18n.getMessage('processError');;
    } finally {
      this.#state.isLoading = false;

      this.#render();
    }
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
    // Solo para elementos que no están en el componente Vue montado
    // Cuando se modifica el texto del textarea:
    this.#elements.inputText?.addEventListener('input', (e) => {
      const text = (e.target as HTMLTextAreaElement).value;
      void this.#handleInputChange(text);
    });
  }

  #setupAllEventListeners(): void {
    this.#setupEventListeners();
    this.#setupProcessRowEventListeners();
  }

  #setupProcessRowEventListeners(): void {
    // Listener de casilla de verificación "Resumir"
    this.#elements.summarizeCheckbox?.addEventListener('change', (e) => {
      this.#state.summarize = (e.target as HTMLInputElement).checked;
      this.#render();
    });

    // Listener de selector de idioma destino
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

    // Listener del botón "Procesar"
    this.#elements.processButton?.addEventListener('click', () => {
      void this.#processText();
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

  async #handleSelectedText(data: SelectedTextData): Promise<void> {
    await this.#handleInputChange(data.text);

    // Si viene de menú de resumen, activar resumen; si viene de menú de traducción, desactivar resumen
    this.#state.summarize = data.summarize ?? false;
    this.#render(); // Actualizar checkbox antes de procesar

    // Verificar si los idiomas son iguales antes de traducción automática desde menú contextual
    if (this.#state.sourceLanguage === this.#state.targetLanguage && !this.#state.summarize) {
      this.#state.isLoading = false;
      this.#state.modelStatus = null;
      this.#render();
      return;
    }

    void this.#processText();
  }

  // Métodos de UI para manejo de modelos

  #render(): void {
    const container = document.getElementById('root');
    if (!container) return;

    // Solo renderizar la estructura inicial una vez
    if (container.innerHTML === '') {
      container.innerHTML = `
        <div class="h-full flex flex-col p-4">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-800 mb-2">${browser.i18n.getMessage('extName')}</h1>
            <p class="text-sm text-gray-600">${browser.i18n.getMessage('extDescription')}</p>
            <div id="api-warning-container"></div>
          </div>

          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <label for="input-text" class="block text-sm font-medium text-gray-700">
                ${browser.i18n.getMessage('inputLabel')}
              </label>
              <div id="language-info-container"></div>
            </div>
            <textarea
              id="input-text"
              class="input-field h-32 resize-none"
              placeholder="${browser.i18n.getMessage('inputPlaceholder')}"
            ></textarea>
          </div>

          <div id="process-row" class="mb-4"></div>
          
          <div id="error-container"></div>
          <div id="process-warning-container" class="mb-4"></div>

          <div id="model-status-container" class="mb-4"></div>


          <div id="result-container"></div>
        </div>
      `;
      this.#elements.inputText = document.getElementById('input-text') as HTMLTextAreaElement;

      // Montar el componente Vue una vez
      const processRow = document.getElementById('process-row');
      if (processRow) {
        const app = createApp(ProcessControls as Component);
        app.mount(processRow);

        void nextTick(() => {
          // Obtener referencias después de mount
          // TODO: verificar que los elementos tienen el tipo correcto en vez de castear
          this.#elements.targetLanguage = document.getElementById('target-language') as HTMLSelectElement;
          this.#elements.summarizeCheckbox = document.getElementById('summarize-checkbox') as HTMLInputElement;
          this.#elements.processButton = document.getElementById('process-button') as HTMLButtonElement;

          // Configurar todos los event listeners
          this.#setupAllEventListeners();

          // Actualizaciones iniciales
          this.#updateLanguageSelector();
          this.#updateProcessButton();
          this.#elements.summarizeCheckbox.checked = this.#state.summarize;
        });
      } else {
        // TODO: revisar si esto es plausible
        // Si por algún motivo no se monta, configurar listeners básicos
        this.#setupEventListeners();
      }
    }

    // Actualizar contenido dinámico sin re-renderizar toda la estructura
    this.#updateAPIWarning();
    this.#updateInputField();
    this.#updateSummarizeCheckbox();
    this.#updateModelStatus();
    this.#updateProcessButton();
    this.#updateProcessRowWarning();
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
            ${browser.i18n.getMessage('apiWarning')}
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

  #updateSummarizeCheckbox(): void {
    if (this.#elements.summarizeCheckbox) {
      this.#elements.summarizeCheckbox.checked = this.#state.summarize;
    }
  }

  #updateLanguageSelector(): void {
    if (this.#elements.targetLanguage) {
      if (this.#state.availableLanguages) {
        const optionsHTML = this.#state.availableLanguages.map(lang =>
          `<option value="${lang.code}">${browser.i18n.getMessage(lang.nameKey)}</option>`
        ).join('');
        this.#elements.targetLanguage.innerHTML = optionsHTML;
      } else {
        this.#elements.targetLanguage.innerHTML = `<option value="">${browser.i18n.getMessage('languagesUnavailable')}</option>`;
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

  #updateProcessButton(): void {
    if (this.#elements.processButton) {
      const hasText = this.#state.text.trim().length > 0;
      const hasSourceLanguage = this.#state.sourceLanguage !== null;
      const languagesAreSame = this.#state.sourceLanguage?.toLowerCase() === this.#state.targetLanguage.toLowerCase() && !this.#state.summarize;
      const modelIsDownloading = this.#state.modelStatus?.state === 'downloading';
      const canProcess = (hasText && hasSourceLanguage && (!languagesAreSame || this.#state.summarize))
        && !this.#state.isLoading
        && !modelIsDownloading;

      this.#elements.processButton.disabled = !canProcess;

      this.#elements.processButton.innerHTML = this.#state.isLoading ? `
        <div class="flex items-center justify-center">
          <div class="loading-spinner mr-2"></div>
          ${browser.i18n.getMessage('processingButton')}
        </div>
      ` : browser.i18n.getMessage('processButton');
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
                  ${browser.i18n.getMessage('resultLabel')}
                </label>
                <span id="processing-source" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  ${browser.i18n.getMessage('localProcessingBadge')}
                </span>
              </div>
              <button id="copy-button" class="btn-secondary text-xs">
                ${browser.i18n.getMessage('copyButton')}
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
          throw new Error(browser.i18n.getMessage('languageDetectionFailed') || 'El dioma detectado no está disponible');
        }
        const languageName = browser.i18n.getMessage(detectedLanguage.nameKey);
        languageInfoContainer.innerHTML = `
          <div class="p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-blue-800 text-xs">
              ${browser.i18n.getMessage('detectedLanguage', [languageName])}
            </p>
          </div>
        `;
      } else if (hasText && !hasEnoughText) {
        languageInfoContainer.innerHTML = `
          <div class="p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <p class="text-gray-600 text-xs">
              ${browser.i18n.getMessage('insufficientTextForDetection')}
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
      const downloadingText = this.#state.summarize
        ? browser.i18n.getMessage('downloadingSummarizer')
        : browser.i18n.getMessage('downloadingTranslator', [this.#state.sourceLanguage!, this.#state.targetLanguage]);

      return `
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center mb-3">
            <span class="font-medium text-blue-800">${downloadingText}</span>
          </div>
          <div id="download-progress-bar" class="progress-indeterminate mb-2"></div>
          <div class="text-sm text-blue-700">
            ${browser.i18n.getMessage('downloadWaitMessage')}
          </div>
        </div>
      `;
    }

    return '';
  }

  #updateProcessRowWarning(): void {
    const warningContainer = document.getElementById('process-warning-container');
    if (warningContainer) {
      const hasText = this.#state.text.trim().length > 0;
      const hasSourceLanguage = this.#state.sourceLanguage !== null;
      const languagesAreSame = this.#state.sourceLanguage?.toLowerCase() === this.#state.targetLanguage.toLowerCase() && !this.#state.summarize;

      if (hasText && hasSourceLanguage && languagesAreSame) {
        warningContainer.innerHTML = `
          <div id="warning-container" class="p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p class="text-amber-800 text-xs">
              ${browser.i18n.getMessage('sameLanguageWarning')}
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
