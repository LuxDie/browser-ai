// Re-exportar todas las funciones de los mocks para facilitar las importaciones
export * from './chrome-mocks';
export * from './ai-mocks';

// Funciones adicionales para mocks específicos
import { vi } from 'vitest';

interface StorageData {
  [key: string]: unknown;
}

interface LanguageDetectorMock {
  detect: ReturnType<typeof vi.fn>;
}

interface TranslatorMock {
  translate: ReturnType<typeof vi.fn>;
}

/**
 * Crea un mock para el storage de Chrome
 * @param initialData - Datos iniciales para el storage
 */
export const createStorageMock = (initialData: StorageData = {}) => ({
  get: vi.fn().mockResolvedValue(initialData),
  set: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
});

/**
 * Configura el mock del storage
 * @param mockStorage - El mock del storage a configurar
 */
export const setupStorageMock = (mockStorage: ReturnType<typeof createStorageMock>) => {
  // Esta función se puede usar para configurar el mock del storage si es necesario
  return mockStorage;
};

/**
 * Configura el mock del detector de idiomas
 * @param mockDetector - El mock del detector a configurar
 */
export const setupLanguageDetectorMock = (mockDetector: LanguageDetectorMock) => {
  // Esta función se puede usar para configurar el mock del detector si es necesario
  return mockDetector;
};

/**
 * Configura el mock del traductor
 * @param mockTranslator - El mock del traductor a configurar
 */
export const setupTranslatorMock = (mockTranslator: TranslatorMock) => {
  // Esta función se puede usar para configurar el mock del traductor si es necesario
  return mockTranslator;
};
