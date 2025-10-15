import { vi } from 'vitest';

/**
 * Mock para las APIs de IA (self.Translator, self.LanguageDetector)
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
