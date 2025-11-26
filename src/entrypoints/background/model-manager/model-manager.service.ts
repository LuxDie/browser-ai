import type { AIModelStatus, SummarizerOptions } from '@/entrypoints/background/model-manager/model-manager.model';
import type { SupportedLanguageCode } from '../language/language.service';

/**
 * Gestor singleton de modelos de IA de Chrome.
 * Maneja verificación de disponibilidad, descarga y ejecución de operaciones de traducción, resumen y detección de idioma.
 */
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

  /**
   * Verifica si las APIs de IA del navegador están disponibles.
   * @returns true si al menos una API existe.
   */
  checkAPIAvailability(): boolean {
    return !!(this.#browserAPIs.languageDetector ?? this.#browserAPIs.translator ?? this.#browserAPIs.summarizer);
  }

/**
 * Verifica si las APIs de IA del navegador están disponibles.
 * @returns true si al menos una API existe.
 */
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
          errorMessage: t('chromeAINotAvailable') || 'Chrome AI APIs no disponibles'
        };
      }

      const availability = await translator.availability({
        sourceLanguage: source,
        targetLanguage: target
      });

      return {
        state: availability,
        ...(availability === 'downloading' && { downloadProgress: 0 }),
        ...(availability === 'unavailable' && {
          errorMessage: t('modelNotSupported', [availability]) ||
            `Modelo no soportado: ${availability}`
        })
      };
    } else if (config.type === 'summarization') {
      const summarizer = this.#browserAPIs.summarizer;

      if (!summarizer) {
        return {
          state: 'unavailable',
          errorMessage: t('summarizerAPINotAvailable') ||
            'Summarizer API no disponible'
        };
      }

      const availability = await summarizer.availability();
      return {
        state: availability,
        ...(availability === 'downloading' && { downloadProgress: 0 }),
        ...(availability === 'unavailable' && {
          errorMessage: t('summarizerModelNotAvailable') ||
            'Modelo de resumen no disponible'
        })
      };
    } else {
      // config.type === 'language-detection'
      const languageDetector = this.#browserAPIs.languageDetector;

      if (!languageDetector) {
        return {
          state: 'unavailable',
          errorMessage: t('languageDetectorAPINotSupported') ||
            'LanguageDetector API no disponible'
        };
      }

      const availability = await languageDetector.availability();
      /**
       * Descarga el modelo de IA si está disponible para descarga.
       * @param config - Configuración del modelo a descargar.
       * @param monitor - Callback opcional para monitorear progreso.
       * @param options - Opciones con AbortSignal para cancelación.
       * @returns Estado del modelo tras descarga ('available').
       * @throws Error si API no soportada o cancelada.
       * @example
       * downloadModel(\{ type: 'summarization' \});
       */
      return {
        state: availability,
        ...(availability === 'downloading' && { downloadProgress: 0 }),
        ...(availability === 'unavailable' && {
          errorMessage: t('languageDetectorUnavailable') ||
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
    monitor?: CreateMonitorCallback,
    options?: { signal?: AbortSignal }):
    Promise<AIModelStatus> {
    // Verificar si la operación ya fue cancelada antes de empezar
    if (options?.signal?.aborted) {
      return { state: 'available' };
    }

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
        throw new Error(t('translatorAPINotSupported') ||
          'Translator API no soportada');
      }
      const createOptions: TranslatorCreateOptions = {
        sourceLanguage: config.source,
        targetLanguage: config.target,
        ...(monitor && { monitor }),
        ...(options?.signal && { signal: options.signal })
      };
      await api.create(createOptions);
    } else if (config.type === 'summarization') {
      const api = this.#browserAPIs.summarizer;
      if (!api) {
        throw new Error(t('summarizerAPINotSupported') ||
          'Summarizer API no soportada');
      }
      const createOptions: SummarizerCreateOptions = {
        ...(monitor && { monitor }),
        ...(options?.signal && { signal: options.signal })
      };
      await api.create(createOptions);
    } else {
      const api = this.#browserAPIs.languageDetector;
      /**
       * Traduce texto utilizando el modelo de Chrome Translator.
       * @param text - Texto fuente a traducir.
       * @param source - Código de idioma origen.
       * @param target - Código de idioma destino.
       * @param options - Opciones con AbortSignal para cancelación.
       * @returns Texto traducido al idioma destino.
       * @throws Error si Translator API no disponible o cancelada.
       * @example
       * await translate('Hola mundo', 'es', 'en'); // 'Hello world'
       */
      if (!api) {
        throw new Error(t('languageDetectorAPINotSupported') ||
          'LanguageDetector API no soportada');
      }
      const createOptions: LanguageDetectorCreateOptions = {
        ...(monitor && { monitor }),
        ...(options?.signal && { signal: options.signal })
      };
      await api.create(createOptions);
    }

    // Limpiar el caché y retornar disponible
    /**
     * Genera un resumen del texto usando Chrome Summarizer.
     * @param text - Texto a resumir.
     * @param inputOptions - Opciones específicas del summarizer.
     * @param options - AbortSignal opcional.
     * @returns Resumen del texto.
     * @throws Error si Summarizer no disponible.
     * @example
     * await summarize('Texto largo...', \{ outputLanguage: 'es' \});
     */
    modelStatusCache.delete(config.type);
    return { state: 'available' };
  }

  // Alias para compatibilidad hacia atrás
  async downloadTranslationModel(source: string, target: string, progressCallback?: CreateMonitorCallback): Promise<AIModelStatus> {
    return this.downloadModel({ type: 'translation', source: source as SupportedLanguageCode, target: target as SupportedLanguageCode }, progressCallback);
  }

  // Traducir texto
  async translate(
    text: string,
    source: string,
    target: string,
    options?: { signal?: AbortSignal }
  ): Promise<string> {
    const translator = this.#browserAPIs.translator;

    if (!translator) {
      /**
       * Detecta el idioma del texto usando Chrome LanguageDetector.
       * @param text - Texto para detectar idioma.
       * @param options - AbortSignal opcional.
       * @returns Código del idioma más probable.
       * @throws Error si LanguageDetector no disponible.
       * @example
       * await detectLanguage('Hola mundo');
       */
      throw new Error(t('chromeAINotAvailableForTranslation') ||
        'Error: Chrome AI APIs no disponibles para traducción');
    }

    const translatorInstance = await translator.create({
      sourceLanguage: source,
      targetLanguage: target,
      ...(options?.signal && { signal: options.signal })
    });
    const translatedText = await translatorInstance.translate(text);
    return translatedText;
  }

  // Resumir texto
  async summarize(
    text: string,
    inputOptions?: SummarizerOptions,
    options?: { signal?: AbortSignal }
  ): Promise<string> {
    const summarizer = this.#browserAPIs.summarizer;

    if (!summarizer) {
      throw new Error(t('summarizerAPINotSupported') || 'Summarizer API no soportada');
    }

    const summarizerOptions: SummarizerOptions = {
      type: 'tldr',
      length: 'medium',
      format: 'plain-text',
      expectedInputLanguages: ['en', 'es', 'ja'],
      outputLanguage: 'es',
      ...inputOptions
    };

    const summarizerInstance = await summarizer
      .create({
        ...summarizerOptions,
        ...(options?.signal && { signal: options.signal })
      });
    const summary = await summarizerInstance.summarize(text);
    return summary;
  }

  async detectLanguage(
    text: string,
    options?: { signal?: AbortSignal }
  ): Promise<string> {
    const languageDetector = this.#browserAPIs.languageDetector;

    if (!languageDetector) {
      throw new Error(t('languageDetectorAPINotSupported') || 'LanguageDetector API no soportada');
    }

    const detector = await languageDetector.create(options);
    const results = await detector.detect(text);
    // Tomar el idioma más probable detectado
    const detectedLanguage = results[0]!.detectedLanguage!;
    return detectedLanguage;
  }
}

// TODO: activar el uso del caché de modelos
const modelStatusCache = new Map<string, AIModelStatus>();
