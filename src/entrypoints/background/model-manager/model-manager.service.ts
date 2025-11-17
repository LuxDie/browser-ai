import type { AIModelStatus, SummarizerOptions, DownloadProgressCallback } from '@/entrypoints/background/model-manager/model-manager.model';
import type { SupportedLanguageCode } from '../languages';

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
    this.#browserAPIs.languageDetector = 'LanguageDetector' in self ? LanguageDetector : null;
    this.#browserAPIs.translator = 'Translator' in self ? Translator : null;
    this.#browserAPIs.summarizer = 'Summarizer' in self ? Summarizer : null;
  }

  checkAPIAvailability(): boolean {
    return !!(this.#browserAPIs.languageDetector ?? this.#browserAPIs.translator ?? this.#browserAPIs.summarizer);
  }

  async checkModelStatus(config:
    { type: 'language-detection' } |
    { type: 'translation'; source: SupportedLanguageCode; target: SupportedLanguageCode } |
    { type: 'summarization' }
  ): Promise<AIModelStatus> {
    if (config.type === 'translation') {
      const { source, target } = config;
      const translator = this.#browserAPIs.translator;

      if (!translator) {
        return {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('chromeAINotAvailable') || 'Chrome AI APIs no disponibles'
        };
      }

      const availability = await translator.availability({
        sourceLanguage: source,
        targetLanguage: target
      });

      console.log(`🔍 Checking translation model availability for ${source}→${target}:`, availability);

      return {
        state: availability,
        ...(availability === 'downloading' && { downloadProgress: 0 }),
        ...(availability === 'unavailable' && {
          errorMessage: browser.i18n.getMessage('modelNotSupported', [availability]) ||
            `Modelo no soportado: ${availability}`
        })
      };
    } else if(config.type === 'summarization') {
      const summarizer = this.#browserAPIs.summarizer;

      if (!summarizer) {
        return {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('summarizerAPINotAvailable') ||
            'Summarizer API no disponible'
        };
      }

      const availability = await summarizer.availability();
      return {
        state: availability,
        ...(availability === 'downloading' && { downloadProgress: 0 }),
        ...(availability === 'unavailable' && {
          errorMessage: browser.i18n.getMessage('summarizerModelNotAvailable') ||
            'Modelo de resumen no disponible'
        })
      };
    } else {
      // config.type === 'language-detection'
      const languageDetector = this.#browserAPIs.languageDetector;

      if (!languageDetector) {
        return {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('languageDetectorAPINotSupported') ||
            'LanguageDetector API no disponible'
        };
      }

      const availability = await languageDetector.availability();
      return {
        state: availability,
        ...(availability === 'downloading' && { downloadProgress: 0 }),
        ...(availability === 'unavailable' && {
          errorMessage: browser.i18n.getMessage('languageDetectorUnavailable') ||
            'Modelo de detección de idioma no disponible'
        })
      };
    }
  }

  // Descargar modelo
  async downloadModel(config:
    { type: 'translation'; source: SupportedLanguageCode; target: SupportedLanguageCode } |
    { type: 'summarization' } |
    { type: 'language-detection' },
    monitor?: DownloadProgressCallback):
    Promise<AIModelStatus> {
    // Marcar como descargando en el caché
    const cacheKey = (config.type === 'translation' ?
      `${config.source}-${config.target}` :
      config.type);
    modelStatusCache.set(cacheKey, {
      state: 'downloading',
      downloadProgress: 0
    });

    // Crear la instancia del modelo según el tipo
    if (config.type === 'translation') {
      const api = this.#browserAPIs.translator;
      if (!api) {
        throw new Error(browser.i18n.getMessage('translatorAPINotSupported') ||
          'Translator API no soportada');
      }
      const createOptions: TranslatorCreateOptions = {
        sourceLanguage: config.source,
        targetLanguage: config.target,
        ...(monitor && { monitor })
      };
      await api.create(createOptions);
    } else if (config.type === 'summarization') {
      const api = this.#browserAPIs.summarizer;
      if (!api) {
        throw new Error(browser.i18n.getMessage('summarizerAPINotSupported') ||
          'Summarizer API no soportada');
      }
      const createOptions: SummarizerCreateOptions = { ...(monitor && { monitor }) };
      await api.create(createOptions);
    } else {
      const api = this.#browserAPIs.languageDetector;
      if (!api) {
        throw new Error(browser.i18n.getMessage('languageDetectorAPINotSupported') ||
          'LanguageDetector API no soportada');
      }
      const createOptions: LanguageDetectorCreateOptions = { ...(monitor && { monitor } )};
      await api.create(createOptions);
    }

    // Limpiar el caché y retornar disponible
    modelStatusCache.delete(config.type);
    return { state: 'available' };
  }

  // Alias para compatibilidad hacia atrás
  async downloadTranslationModel(source: string, target: string, progressCallback?: DownloadProgressCallback): Promise<AIModelStatus> {
    return this.downloadModel({ type: 'translation', source: source as SupportedLanguageCode, target: target as SupportedLanguageCode }, progressCallback);
  }

  // Traducir texto
  async translate(text: string, source: string, target: string): Promise<string> {
    const translator = this.#browserAPIs.translator;

    if (!translator) {
      throw new Error(browser.i18n.getMessage('chromeAINotAvailableForTranslation') ||
        'Error: Chrome AI APIs no disponibles para traducción');
    }

    console.log(`Translating "${text}" from ${source} to ${target}`);
    const translatorInstance = await translator.create({
      sourceLanguage: source,
      targetLanguage: target
    });
    const translatedText = await translatorInstance.translate(text);
    console.log(`Translated: "${translatedText}"`);
    return translatedText;
  }

  // Resumir texto
  async summarize(text: string, inputOptions?: SummarizerOptions): Promise<string> {
    const summarizer = this.#browserAPIs.summarizer;

    if (!summarizer) {
      throw new Error(browser.i18n.getMessage('summarizerAPINotSupported') || 'Summarizer API no soportada');
    }

    const summarizerOptions: SummarizerOptions = {
      type: 'tldr',
      length: 'medium',
      format: 'plain-text',
      expectedInputLanguages: ['en', 'es', 'ja'],
      outputLanguage: 'es',
      ...inputOptions
    };

    console.log(`Summarizing text with options:`, summarizerOptions);
    const summarizerInstance = await summarizer.create(summarizerOptions);
    const summary = await summarizerInstance.summarize(text);
    console.log(`Summary generated: "${summary}"`);
    return summary;
  }

  async detectLanguage(text: string): Promise<string> {
    const languageDetector = this.#browserAPIs.languageDetector;

    if (!languageDetector) {
      throw new Error('LanguageDetector API no soportada');
    }

    const detector = await languageDetector.create();
    const results = await detector.detect(text);
    // Tomar el idioma más probable detectado
    const detectedLanguage = results[0]!.detectedLanguage!;
    return detectedLanguage;
  }
}

// TODO: activar el uso del caché de modelos
const modelStatusCache = new Map<string, AIModelStatus>();
