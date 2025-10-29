import type { TranslatorAPI, AIModelStatus } from './model-manager.model';

// Type-safe access helpers for built-in AI APIs
const getTranslatorAPI = (): TranslatorAPI | undefined => {
  return (self as typeof self & { Translator?: TranslatorAPI }).Translator;
};

export class ModelManager {
  static #instance: ModelManager | null = null;

  static getInstance(): ModelManager {
    if (!ModelManager.#instance) {
      ModelManager.#instance = new ModelManager();
    }
    return ModelManager.#instance;
  }

  // Generar clave única para par de idiomas
  #getLanguagePairKey(source: string, target: string): string {
    return `${source}-${target}`;
  }

  // Verificar disponibilidad de modelo
  async checkModelAvailability(source: string, target: string): Promise<AIModelStatus> {
    const key = this.#getLanguagePairKey(source, target);
    const translator = getTranslatorAPI();

    if (!translator) {
      return {
        state: 'unavailable',
        errorMessage: 'Chrome AI APIs no disponibles'
      };
    }

    try {
      const availability = await translator.availability({
        sourceLanguage: source,
        targetLanguage: target
      });

      console.log(`🔍 Checking model availability for ${source}→${target}:`, availability);

      let status: AIModelStatus = {
        state: availability as AIModelStatus['state'],
        downloadProgress: availability === 'downloading' ? 0 : undefined,
        errorMessage: availability === 'unavailable' ? `Modelo no soportado: ${availability}` : undefined
      };

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
        state: 'unavailable',
        errorMessage: `Error al verificar la disponibilidad del modelo: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Descargar modelo
  async downloadModel(source: string, target: string): Promise<AIModelStatus> {
    const key = this.#getLanguagePairKey(source, target);
    const translator = getTranslatorAPI();

    if (!translator) {
      const status: AIModelStatus = {
        state: 'unavailable',
        errorMessage: 'Chrome AI APIs no disponibles para descarga'
      };
      modelStatusCache.set(key, status);
      return status;
    }

    modelStatusCache.set(key, {
      state: 'downloading',
      downloadProgress: 0
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
        state: 'available'
      };
    } catch (error: unknown) {
      console.error(`❌ Error al descargar el modelo para ${source}→${target}:`, error);
      const status: AIModelStatus = {
        state: 'unavailable',
        errorMessage: `Error al descargar el modelo: ${error instanceof Error ? error.message : String(error)}`
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

// Cache de estado de modelos (mover aquí también)
const modelStatusCache = new Map<string, AIModelStatus>();
