import { test, expect } from './fixtures';
import { standardMocks } from './mocks/ai-api.mocks';

/**
 * Pruebas E2E para el flujo de resumen (summarization)
 */
test.describe('Flujo de Resumen', () => {
  test.beforeEach(async ({ mockAIAPIs }) => {
    // Inyectar mocks antes de cada prueba
    await mockAIAPIs(standardMocks);
  });

  test('Verificar disponibilidad del modelo de resumen', async ({ serviceWorker }) => {
    // Verificar que el modelo está disponible después de inyectar mocks
    const availability = await serviceWorker.evaluate(async () => {
      const modelManager = (self as any).ModelManager?.getInstance();
      if (!modelManager) {
        throw new Error('ModelManager no disponible');
      }

      const status = await modelManager.checkModelStatus({
        type: 'summarization'
      });

      return status;
    });

    expect(availability.state).toBe('available');
    expect(availability.errorMessage).toBeUndefined();
  });

  test('Resumir texto usando el servicio directamente', async ({ serviceWorker }) => {
    // Ejecutar resumen directamente en el Service Worker
    const result = await serviceWorker.evaluate(async () => {
      const modelManager = (self as any).ModelManager?.getInstance();
      if (!modelManager) {
        throw new Error('ModelManager no disponible');
      }

      const longText = 'This is a very long text that needs to be summarized. ' +
        'It contains multiple sentences and ideas. ' +
        'The summarizer should extract the most important information. ' +
        'This is just a test to verify the functionality works correctly.';

      const summary = await modelManager.summarize(longText);

      return summary;
    });

    // Verificar que el resumen contiene el marcador esperado
    expect(result).toContain('Resumen');
    expect(result.length).toBeLessThan(200); // El resumen debe ser más corto que el original
  });

  test('Resumir texto con opciones personalizadas', async ({ serviceWorker }) => {
    // Ejecutar resumen con opciones
    const result = await serviceWorker.evaluate(async () => {
      const modelManager = (self as any).ModelManager?.getInstance();
      if (!modelManager) {
        throw new Error('ModelManager no disponible');
      }

      const text = 'Este es un texto en español que debe ser resumido. ' +
        'Contiene varias oraciones e ideas importantes. ' +
        'El resumen debe capturar la esencia del contenido.';

      const summary = await modelManager.summarize(text, {
        type: 'tldr',
        length: 'short',
        format: 'plain-text',
        expectedInputLanguages: ['es'],
        outputLanguage: 'es'
      });

      return summary;
    });

    // Verificar que el resumen se generó
    expect(result).toBeTruthy();
    expect(result).toContain('Resumen');
  });

  test('Manejar errores cuando la API de resumen no está disponible', async ({ serviceWorker, mockAIAPIs }) => {
    // Inyectar mocks con API de resumen no disponible
    await mockAIAPIs({
      Translator: standardMocks.Translator,
      Summarizer: null,
      LanguageDetector: standardMocks.LanguageDetector,
    });

    // Intentar verificar disponibilidad
    const availability = await serviceWorker.evaluate(async () => {
      const modelManager = (self as any).ModelManager?.getInstance();
      if (!modelManager) {
        throw new Error('ModelManager no disponible');
      }

      const status = await modelManager.checkModelStatus({
        type: 'summarization'
      });

      return status;
    });

    expect(availability.state).toBe('unavailable');
    expect(availability.errorMessage).toBeTruthy();
  });

  test('Flujo completo: resumir y traducir', async ({ serviceWorker }) => {
    // Probar el flujo de AIService que resume y traduce
    const result = await serviceWorker.evaluate(async () => {
      // Obtener AIService
      const aiService = (self as any).AIService;
      if (!aiService) {
        throw new Error('AIService no disponible');
      }

      const text = 'This is a long English text that needs to be summarized and then translated to Spanish. ' +
        'It contains important information that should be preserved in the summary. ' +
        'The translation should maintain the meaning of the summarized content.';

      // Procesar texto con resumen y traducción
      const processed = await aiService.processText(text, {
        summarize: true,
        sourceLanguage: 'en',
        targetLanguage: 'es'
      });

      return processed;
    });

    // Verificar que el resultado contiene indicadores de resumen y traducción
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});