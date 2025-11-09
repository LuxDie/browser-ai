import type { AIModelStatus, SummarizerOptions } from '@/entrypoints/background/model-manager/model-manager.model';
import type { SummarizerLanguageCode } from '@/entrypoints/background/available-languages';

export class ModelManager {
  static #instance: ModelManager | null = null;

  static getInstance(): ModelManager {
    if (!ModelManager.#instance) {
      ModelManager.#instance = new ModelManager();
    }
    return ModelManager.#instance;
  }

  #browserAPIs: {
    languageDetector: typeof LanguageDetector | null
    translator: typeof Translator | null
    summarizer: typeof Summarizer | null
  } = {
      languageDetector: null,
      translator: null,
      summarizer: null
    };

  constructor() {
    this.#browserAPIs.languageDetector = (self as typeof self & { LanguageDetector?: LanguageDetector }).LanguageDetector;
    this.#browserAPIs.translator = (self as typeof self & { Translator?: Translator }).Translator;
    this.#browserAPIs.summarizer = (self as typeof self & { Summarizer?: Summarizer }).Summarizer;
  }

  // Generar clave única para par de idiomas
  #getLanguagePairKey(source: string, target: string): string {
    return `${source}-${target}`;
  }
  
  checkAPIAvailability(): boolean {
    return !!(this.#browserAPIs.languageDetector ?? this.#browserAPIs.translator ?? this.#browserAPIs.summarizer);
  }

  // Verificar disponibilidad de modelo (unificada para traducción y resumen)
  async checkModelStatus(config: { type: 'translation'; source: string; target: string } | { type: 'summarization' }): Promise<AIModelStatus> {
    if (config.type === 'translation') {
      const { source, target } = config;
      const translator = this.#browserAPIs.translator;

      if (!translator) {
        return {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('chromeAINotAvailable') || 'Chrome AI APIs no disponibles'
        };
      }

      try {
        const availability = await translator.availability({
          sourceLanguage: source,
          targetLanguage: target
        });

        console.log(`🔍 Checking translation model availability for ${source}→${target}:`, availability);

        return {
          state: availability,
          downloadProgress: availability === 'downloading' ? 0 : undefined,
          errorMessage: availability === 'unavailable' ? browser.i18n.getMessage('modelNotSupported', [availability]) || `Modelo no soportado: ${availability}` : undefined
        };

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error al verificar la disponibilidad del modelo de traducción para ${source}→${target}:`, error);
        return {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('errorCheckingModelAvailability', [errorMessage]) || `Error al verificar la disponibilidad del modelo: ${errorMessage}`
        };
      }
    } else {
      // config.type === 'summarization'
      const summarizer = this.#browserAPIs.summarizer;

      if (!summarizer) {
        return {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('summarizerAPINotAvailable') || 'Summarizer API no disponible'
        };
      }

      try {
        const availability = await summarizer.availability();
        return {
          state: availability,
          downloadProgress: availability === 'downloading' ? 0 : undefined,
          errorMessage: availability === 'unavailable' ? browser.i18n.getMessage('summarizerModelNotAvailable') || 'Modelo de resumen no disponible' : undefined
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error al verificar la disponibilidad del summarizer:', error);
        return {
          state: 'unavailable',
          errorMessage: (browser.i18n.getMessage('errorCheckingModelAvailability') || `Error al verificar la disponibilidad del summarizer: ${errorMessage}`)
        };
      }
    }
  }

  // Alias para compatibilidad hacia atrás
  async checkTranslationModelAvailability(source: string, target: string): Promise<AIModelStatus> {
    return this.checkModelStatus({ type: 'translation', source, target });
  }

  // Descargar modelo
  async downloadModel(config:
    { type: 'translation'; source: string; target: string } |
    { type: 'summarization' }):
    Promise<AIModelStatus> {
    if (config.type === 'translation') {
      const { source, target } = config;
      const key = this.#getLanguagePairKey(source, target);
      const translator = this.#browserAPIs.translator;

      if (!translator) {
        const status: AIModelStatus = {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('translatorAPINotSupported') || 'Translator API no soportada'
        };
        modelStatusCache.set(key, status);
        return status;
      }

      modelStatusCache.set(key, {
        state: 'downloading',
        downloadProgress: 0
      });

      try {
        console.log(`⏳ Downloading translation model for ${source}→${target}...`);
        // Crear el traductor (esto descarga el modelo si es necesario)
        await translator.create({
          sourceLanguage: source,
          targetLanguage: target
        });

        console.log(`✅ Translation model for ${source}→${target} downloaded successfully.`);
        modelStatusCache.delete(key);
        return {
          state: 'available'
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error al descargar el modelo de traducción para ${source}→${target}:`, error);
        const status: AIModelStatus = {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('errorDownloadingModel', [errorMessage]) || `Error al descargar el modelo: ${errorMessage}`
        };
        modelStatusCache.set(key, status);
        return status;
      }
    } else {
      // config.type === 'summarization'
      const summarizer = this.#browserAPIs.summarizer;

      if (!summarizer) {
        const status: AIModelStatus = {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('summarizerAPINotSupported') || 'Summarizer API no soportada'
        };
        return status;
      }

      // El modelo utilizado para todo menos traducción y detección de idioma es Gemini Nano
      const key = 'gemini-nano';

      modelStatusCache.set(key, {
        state: 'downloading',
        downloadProgress: 0
      });

      try {
        console.log(`⏳ Downloading summarizer model...`);
        // Crear el summarizer (esto descarga el modelo si es necesario)
        await summarizer.create();

        console.log(`✅ Summarizer model downloaded successfully.`);
        modelStatusCache.delete(key);
        return {
          state: 'available'
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error al descargar el modelo de resumen:', error);
        const status: AIModelStatus = {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('errorDownloadingSummarizerModel', [errorMessage]) || `Error al descargar el modelo de resumen: ${errorMessage}`
        };
        modelStatusCache.set(key, status);
        return status;
      }
    }
  }

  // Alias para compatibilidad hacia atrás
  async downloadTranslationModel(source: string, target: string): Promise<AIModelStatus> {
    return this.downloadModel({ type: 'translation', source, target });
  }

  // Traducir texto
  async translate(text: string, source: string, target: string): Promise<string> {
    const translator = this.#browserAPIs.translator;

    if (!translator) {
      return browser.i18n.getMessage('chromeAINotAvailableForTranslation') || 'Error: Chrome AI APIs no disponibles para traducción';
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
      return browser.i18n.getMessage('errorTranslating', [error instanceof Error ? error.message : String(error)]) || `Error al traducir: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  // Resumir texto
  async summarizeText(text: string, inputOptions?: SummarizerOptions): Promise<string> {
    const summarizer = this.#browserAPIs.summarizer;

    if (!summarizer) {
      throw new Error(browser.i18n.getMessage('summarizerAPINotSupportedError') || 'Summarizer API no soportada');
    }

    try {
      const summarizerOptions: SummarizerOptions = {
        type: 'tldr',
        length: 'medium',
        format: 'plain-text',
        expectedInputLanguages: ['en', 'es', 'ja'] as SummarizerLanguageCode[],
        outputLanguage: 'es' as SummarizerLanguageCode,
        ...inputOptions
      };

      console.log(`Summarizing text with options:`, summarizerOptions);
      const summarizerInstance = await summarizer.create(summarizerOptions);
      const summary = await summarizerInstance.summarize(text);
      console.log(`Summary generated: "${summary}"`);
      return summary;
    } catch (error: unknown) {
      console.error('❌ Error al generar resumen:', error);
      return browser.i18n.getMessage('errorGeneratingSummary', [error instanceof Error ? error.message : String(error)]) || `Error al generar resumen: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

// Cache de estado de modelos (mover aquí también)
const modelStatusCache = new Map<string, AIModelStatus>();
