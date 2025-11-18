import type {
  AIModelStatus,
  SummarizerOptions,
  WriterCreateOptions,
  RewriterCreateOptions,
  ProofreaderCreateOptions,
  PromptCreateOptions,
  SummarizerCreateOptions
} from '@/entrypoints/background/model-manager/model-manager.model';
import type { SupportedLanguageCode } from '../language/language.service';

export class ModelManager {
  static #instance: ModelManager | null = null;

  static getInstance(): ModelManager {
    if (!ModelManager.#instance) {
      ModelManager.#instance = new ModelManager();
    }
    return ModelManager.#instance;
  }

  #browserAPIs: {
    languageDetector: any | null
    translator: any | null
    summarizer: any | null
    writer: any | null
    rewriter: any | null
    proofreader: any | null
    prompt: any | null
  } = {
      languageDetector: null,
      translator: null,
      summarizer: null,
      writer: null,
      rewriter: null,
      proofreader: null,
      prompt: null
    };

  constructor() {
    this.#browserAPIs.languageDetector = 'LanguageDetector' in self ? (self as any).LanguageDetector : null;
    this.#browserAPIs.translator = 'Translator' in self ? (self as any).Translator : null;
    this.#browserAPIs.summarizer = 'Summarizer' in self ? (self as any).Summarizer : null;
    this.#browserAPIs.writer = 'Writer' in self ? (self as any).Writer : null;
    this.#browserAPIs.rewriter = 'Rewriter' in self ? (self as any).Rewriter : null;
    this.#browserAPIs.proofreader = 'Proofreader' in self ? (self as any).Proofreader : null;
    this.#browserAPIs.prompt = 'Prompt' in self ? (self as any).Prompt : null;
  }

  checkAPIAvailability(): boolean {
    return !!(
      this.#browserAPIs.languageDetector ??
      this.#browserAPIs.translator ??
      this.#browserAPIs.summarizer ??
      this.#browserAPIs.writer ??
      this.#browserAPIs.rewriter ??
      this.#browserAPIs.proofreader ??
      this.#browserAPIs.prompt
    );
  }

  async checkModelStatus(config:
    { type: 'language-detection' } |
    { type: 'translation'; source: SupportedLanguageCode; target: SupportedLanguageCode } |
    { type: 'summarization' } |
    { type: 'writer' } |
    { type: 'rewriter' } |
    { type: 'proofreader' } |
    { type: 'prompt' }
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
    } else if (config.type === 'summarization') {
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
    } else if (config.type === 'writer') {
      const writer = this.#browserAPIs.writer;

      if (!writer) {
        return {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('writerAPINotAvailable') ||
            'Writer API no disponible'
        };
      }

      const availability = await writer.availability();
      return {
        state: availability,
        ...(availability === 'downloading' && { downloadProgress: 0 }),
        ...(availability === 'unavailable' && {
          errorMessage: browser.i18n.getMessage('writerModelNotAvailable') ||
            'Modelo de escritura no disponible'
        })
      };
    } else if (config.type === 'rewriter') {
      const rewriter = this.#browserAPIs.rewriter;

      if (!rewriter) {
        return {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('rewriterAPINotAvailable') ||
            'Rewriter API no disponible'
        };
      }

      const availability = await rewriter.availability();
      return {
        state: availability,
        ...(availability === 'downloading' && { downloadProgress: 0 }),
        ...(availability === 'unavailable' && {
          errorMessage: browser.i18n.getMessage('rewriterModelNotAvailable') ||
            'Modelo de reescritura no disponible'
        })
      };
    } else if (config.type === 'proofreader') {
      const proofreader = this.#browserAPIs.proofreader;

      if (!proofreader) {
        return {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('proofreaderAPINotAvailable') ||
            'Proofreader API no disponible'
        };
      }

      const availability = await proofreader.availability();
      return {
        state: availability,
        ...(availability === 'downloading' && { downloadProgress: 0 }),
        ...(availability === 'unavailable' && {
          errorMessage: browser.i18n.getMessage('proofreaderModelNotAvailable') ||
            'Modelo de corrección de pruebas no disponible'
        })
      };
    } else if (config.type === 'prompt') {
      const prompt = this.#browserAPIs.prompt;

      if (!prompt) {
        return {
          state: 'unavailable',
          errorMessage: browser.i18n.getMessage('promptAPINotAvailable') ||
            'Prompt API no disponible'
        };
      }

      const availability = await prompt.availability();
      return {
        state: availability,
        ...(availability === 'downloading' && { downloadProgress: 0 }),
        ...(availability === 'unavailable' && {
          errorMessage: browser.i18n.getMessage('promptModelNotAvailable') ||
            'Modelo de prompt no disponible'
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
    { type: 'language-detection' } |
    { type: 'writer' } |
    { type: 'rewriter' } |
    { type: 'proofreader' } |
    { type: 'prompt' },
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
        throw new Error(browser.i18n.getMessage('translatorAPINotSupported') ||
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
        throw new Error(browser.i18n.getMessage('summarizerAPINotSupported') ||
          'Summarizer API no soportada');
      }
      const createOptions: SummarizerCreateOptions = {
        ...(monitor && { monitor }),
        ...(options?.signal && { signal: options.signal })
      };
      await api.create(createOptions);
    } else if (config.type === 'writer') {
      const api = this.#browserAPIs.writer;
      if (!api) {
        throw new Error(browser.i18n.getMessage('writerAPINotSupported') ||
          'Writer API no soportada');
      }
      const createOptions: WriterCreateOptions = {
        ...(monitor && { monitor }),
        ...(options?.signal && { signal: options.signal })
      };
      await api.create(createOptions);
    } else if (config.type === 'rewriter') {
      const api = this.#browserAPIs.rewriter;
      if (!api) {
        throw new Error(browser.i18n.getMessage('rewriterAPINotSupported') ||
          'Rewriter API no soportada');
      }
      const createOptions: RewriterCreateOptions = {
        ...(monitor && { monitor }),
        ...(options?.signal && { signal: options.signal })
      };
      await api.create(createOptions);
    } else if (config.type === 'proofreader') {
      const api = this.#browserAPIs.proofreader;
      if (!api) {
        throw new Error(browser.i18n.getMessage('proofreaderAPINotSupported') ||
          'Proofreader API no soportada');
      }
      const createOptions: ProofreaderCreateOptions = {
        ...(monitor && { monitor }),
        ...(options?.signal && { signal: options.signal })
      };
      await api.create(createOptions);
    } else if (config.type === 'prompt') {
      const api = this.#browserAPIs.prompt;
      if (!api) {
        throw new Error(browser.i18n.getMessage('promptAPINotSupported') ||
          'Prompt API no soportada');
      }
      const createOptions: PromptCreateOptions = {
        ...(monitor && { monitor }),
        ...(options?.signal && { signal: options.signal })
      };
      await api.create(createOptions);
    } else {
      const api = this.#browserAPIs.languageDetector;
      if (!api) {
        throw new Error(browser.i18n.getMessage('languageDetectorAPINotSupported') ||
          'LanguageDetector API no soportada');
      }
      const createOptions: LanguageDetectorCreateOptions = {
        ...(monitor && { monitor }),
        ...(options?.signal && { signal: options.signal })
      };
      await api.create(createOptions);
    }

    // Limpiar el caché y retornar disponible
    modelStatusCache.delete(config.type);
    return { state: 'available' };
  }

  // Alias para compatibilidad hacia atrás
  async downloadTranslationModel(source: string, target: string, progressCallback?: CreateMonitorCallback): Promise<AIModelStatus> {
    return this.downloadModel({ type: 'translation', source: source as SupportedLanguageCode, target: target as SupportedLanguageCode }, progressCallback);
  }

  // Traducir texto
  async translate(text: string, source: string, target: string, options?: { signal?: AbortSignal }): Promise<string> {
    const translator = this.#browserAPIs.translator;

    if (!translator) {
      throw new Error(browser.i18n.getMessage('chromeAINotAvailableForTranslation') ||
        'Error: Chrome AI APIs no disponibles para traducción');
    }

    console.log(`Translating "${text}" from ${source} to ${target}`);
    const translatorInstance = await translator.create({
      sourceLanguage: source,
      targetLanguage: target,
      ...(options?.signal && { signal: options.signal })
    });
    const translatedText = await translatorInstance.translate(text);
    console.log(`Translated: "${translatedText}"`);
    return translatedText;
  }

  // Resumir texto
  async summarize(text: string, inputOptions?: SummarizerOptions, options?: { signal?: AbortSignal }): Promise<string> {
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
    const summarizerInstance = await summarizer.create({ ...summarizerOptions, ...(options?.signal && { signal: options.signal }) });
    const summary = await summarizerInstance.summarize(text);
    console.log(`Summary generated: "${summary}"`);
    return summary;
  }

  async detectLanguage(text: string, options?: { signal?: AbortSignal }): Promise<string> {
    const languageDetector = this.#browserAPIs.languageDetector;

    if (!languageDetector) {
      throw new Error('LanguageDetector API no soportada');
    }

    const detector = await languageDetector.create(options);
    const results = await detector.detect(text);
    // Tomar el idioma más probable detectado
    const detectedLanguage = results[0]!.detectedLanguage!;
    return detectedLanguage;
  }

  async write(text: string, inputOptions?: WriterOptions): Promise<string> {
    const writer = this.#browserAPIs.writer;

    if (!writer) {
      throw new Error(browser.i18n.getMessage('writerAPINotSupported') || 'Writer API no soportada');
    }

    const writerOptions: WriterOptions = {
      // Default options for writer, if any
      ...inputOptions
    };

    console.log(`Writing text with options:`, writerOptions);
    const writerInstance = await writer.create(writerOptions);
    const writtenText = await writerInstance.write(text);
    console.log(`Written: "${writtenText}"`);
    return writtenText;
  }

  async rewrite(text: string, inputOptions?: RewriterOptions): Promise<string> {
    const rewriter = this.#browserAPIs.rewriter;

    if (!rewriter) {
      throw new Error(browser.i18n.getMessage('rewriterAPINotSupported') || 'Rewriter API no soportada');
    }

    const rewriterOptions: RewriterOptions = {
      // Default options for rewriter, if any
      ...inputOptions
    };

    console.log(`Rewriting text with options:`, rewriterOptions);
    const rewriterInstance = await rewriter.create(rewriterOptions);
    const rewrittenText = await rewriterInstance.rewrite(text);
    console.log(`Rewritten: "${rewrittenText}"`);
    return rewrittenText;
  }

  async proofread(text: string, inputOptions?: ProofreaderOptions): Promise<string> {
    const proofreader = this.#browserAPIs.proofreader;

    if (!proofreader) {
      throw new Error(browser.i18n.getMessage('proofreaderAPINotSupported') || 'Proofreader API no soportada');
    }

    const proofreaderOptions: ProofreaderOptions = {
      // Default options for proofreader, if any
      ...inputOptions
    };

    console.log(`Proofreading text with options:`, proofreaderOptions);
    const proofreaderInstance = await proofreader.create(proofreaderOptions);
    const proofreadText = await proofreaderInstance.proofread(text);
    console.log(`Proofread: "${proofreadText}"`);
    return proofreadText.results[0].text;
  }

  async prompt(text: string, inputOptions?: PromptOptions): Promise<string> {
    const promptAPI = this.#browserAPIs.prompt;

    if (!promptAPI) {
      throw new Error(browser.i18n.getMessage('promptAPINotSupported') || 'Prompt API no soportada');
    }

    const promptOptions: PromptOptions = {
      // Default options for prompt, if any
      ...inputOptions
    };

    console.log(`Prompting with options:`, promptOptions);
    const promptInstance = await promptAPI.create(promptOptions);
    const promptResult = await promptInstance.prompt(text);
    console.log(`Prompt result: "${promptResult}"`);
    return promptResult;
  }
}

// TODO: activar el uso del caché de modelos
const modelStatusCache = new Map<string, AIModelStatus>();
