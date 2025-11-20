/**
 * Mocks para las APIs de Chrome AI utilizados en pruebas E2E
 * 
 * Estos mocks simulan el comportamiento de las APIs de traducción,
 * resumen y detección de idioma de Chrome AI.
 */

/**
 * Mock del Translator API
 */
export const createMockTranslator = () => {
  const MockTranslatorClass = class MockTranslator {
    static async availability(_options: { sourceLanguage: string; targetLanguage: string }) {
      // Simular que el modelo está disponible
      return 'available';
    }

    static async create(options: { sourceLanguage: string; targetLanguage: string }) {
      return new MockTranslatorClass(options);
    }

    constructor(private options: { sourceLanguage: string; targetLanguage: string }) {}

    async translate(text: string): Promise<string> {
      // Simulación simple: agregar prefijo para indicar traducción
      return `[Traducido de ${this.options.sourceLanguage} a ${this.options.targetLanguage}]: ${text}`;
    }
  };

  return MockTranslatorClass;
};

/**
 * Mock del Summarizer API
 */
export const createMockSummarizer = () => {
  const MockSummarizerClass = class MockSummarizer {
    static async availability() {
      return 'available';
    }

    static async create(options?: any) {
      return new MockSummarizerClass(options);
    }

    constructor(private options?: any) {}

    async summarize(text: string): Promise<string> {
      // Simulación simple: tomar las primeras palabras
      const words = text.split(' ').slice(0, 10);
      return `[Resumen]: ${words.join(' ')}...`;
    }
  };

  return MockSummarizerClass;
};

/**
 * Mock del LanguageDetector API
 */
export const createMockLanguageDetector = () => {
  const MockLanguageDetectorClass = class MockLanguageDetector {
    static async availability() {
      return 'available';
    }

    static async create() {
      return new MockLanguageDetectorClass();
    }

    async detect(text: string): Promise<Array<{ detectedLanguage: string; confidence: number }>> {
      // Simulación simple: detectar inglés o español basado en palabras comunes
      const hasSpanishWords = /\b(el|la|los|las|de|en|y|que)\b/i.test(text);
      const detectedLanguage = hasSpanishWords ? 'es' : 'en';
      
      return [
        {
          detectedLanguage,
          confidence: 0.95
        }
      ];
    }
  };

  return MockLanguageDetectorClass;
};

/**
 * Mock con estado de descarga para simular modelos que necesitan descargarse
 */
export const createMockTranslatorWithDownload = () => {
  let downloadState: 'downloadable' | 'downloading' | 'available' = 'downloadable';

  const MockTranslatorClass = class MockTranslator {
    static async availability(_options: { sourceLanguage: string; targetLanguage: string }) {
      return downloadState;
    }

    static async create(options: { sourceLanguage: string; targetLanguage: string }) {
      if (downloadState === 'downloadable') {
        downloadState = 'downloading';
        // Simular descarga
        setTimeout(() => {
          downloadState = 'available';
        }, 100);
      }
      return new MockTranslatorClass(options);
    }

    constructor(private options: { sourceLanguage: string; targetLanguage: string }) {}

    async translate(text: string): Promise<string> {
      if (downloadState !== 'available') {
        throw new Error('Modelo no disponible');
      }
      return `[Traducido de ${this.options.sourceLanguage} a ${this.options.targetLanguage}]: ${text}`;
    }
  };

  return MockTranslatorClass;
};

/**
 * Configuración de mocks estándar para pruebas
 */
export const standardMocks = {
  Translator: createMockTranslator(),
  Summarizer: createMockSummarizer(),
  LanguageDetector: createMockLanguageDetector(),
};