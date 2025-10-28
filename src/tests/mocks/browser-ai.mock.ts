import { vi } from 'vitest';

/**
 * Mock para las APIs de IA (self.Translator, self.LanguageDetector, self.Summarizer)
 * Este mock simula el comportamiento de las APIs de IA del navegador
 */
export const createAIMock = () => ({
  Translator: {
    availability: vi.fn().mockResolvedValue('available'),
    create: vi.fn().mockResolvedValue({
      translate: vi.fn(),
    }),
  },
  LanguageDetector: {
    availability: vi.fn().mockResolvedValue('available'),
    create: vi.fn().mockResolvedValue({
      detect: vi.fn(),
    }),
  },
  Summarizer: {
    availability: vi.fn().mockResolvedValue('available'),
    create: vi.fn().mockResolvedValue({
      summarize: vi.fn(),
    }),
  },
});

/**
 * Configura el mock global de self (APIs de IA) para las pruebas
 * @param mockAI - El mock de AI a configurar
 */
export const setupAIMock = (mockAI: ReturnType<typeof createAIMock>) => {
  vi.stubGlobal('self', mockAI);
};

/**
 * Crea un mock específico para el detector de idiomas
 * @param language - El idioma a detectar
 * @param confidence - El nivel de confianza (0-1)
 */
export const createLanguageDetectorMock = (language: string, confidence = 0.95) => ({
  detect: vi.fn().mockResolvedValue({
    language,
    confidence,
  }),
});

/**
 * Crea un mock específico para el traductor
 * @param translatedText - El texto traducido
 */
export const createTranslatorMock = (translatedText = '') => ({
  translate: vi.fn().mockResolvedValue(translatedText),
});

/**
 * Crea un mock que simula un error en la detección de idioma
 * @param errorMessage - Mensaje de error
 */
export const createLanguageDetectorErrorMock = (errorMessage: string) => ({
  detect: vi.fn().mockRejectedValue(new Error(errorMessage)),
});

/**
 * Crea un mock que simula un error en la traducción
 * @param errorMessage - Mensaje de error
 */
export const createTranslatorErrorMock = (errorMessage: string) => ({
  translate: vi.fn().mockRejectedValue(new Error(errorMessage)),
});

/**
 * Crea un mock específico para el summarizer
 * @param summaryText - El texto resumido a retornar
 */
export const createSummarizerMock = (summaryText = '') => ({
  summarize: vi.fn().mockResolvedValue(summaryText),
});

/**
 * Crea un mock que simula un error en el resumen
 * @param errorMessage - Mensaje de error
 */
export const createSummarizerErrorMock = (errorMessage: string) => ({
  summarize: vi.fn().mockRejectedValue(new Error(errorMessage)),
});

/**
 * Configura el mock del traductor en el mock global de AI
 * @param mockTranslator - El mock del traductor a configurar
 */
export const setupTranslatorMock = (mockTranslator: ReturnType<typeof createTranslatorMock>) => {
  const mockAI = createAIMock();
  mockAI.Translator.create = vi.fn().mockResolvedValue(mockTranslator);
  vi.stubGlobal('self', mockAI);
};

/**
 * Configura el mock del detector de idiomas en el mock global de AI
 * @param mockDetector - El mock del detector a configurar
 */
export const setupLanguageDetectorMock = (mockDetector: ReturnType<typeof createLanguageDetectorMock>) => {
  const mockAI = createAIMock();
  mockAI.LanguageDetector.create = vi.fn().mockResolvedValue(mockDetector);
  vi.stubGlobal('self', mockAI);
};
