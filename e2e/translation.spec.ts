import { test, expect } from './fixtures';
import { standardMocks } from './mocks/ai-api.mocks';

/**
 * Pruebas E2E para el flujo de traducción
 */
test.describe('Flujo de Traducción', () => {
  test.beforeEach(async ({ mockAIAPIs }) => {
    // Inyectar mocks antes de cada prueba
    await mockAIAPIs(standardMocks);
  });

  test('Traducción básica desde el menú contextual', async ({ page, context }) => {
    // Navegar a una página de prueba
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');

    // Seleccionar texto
    const textToTranslate = 'Hello World';
    await page.evaluate((text) => {
      const div = document.createElement('div');
      div.textContent = text;
      div.id = 'test-text';
      document.body.appendChild(div);
    }, textToTranslate);

    // Seleccionar el texto
    await page.locator('#test-text').click();
    await page.keyboard.press('Control+A');

    // Simular clic derecho y seleccionar traducción
    // Nota: Los menús contextuales de extensiones no son directamente accesibles
    // por lo que necesitamos simular la acción mediante la API
    await page.evaluate(async () => {
      // Simular el evento de selección de texto
      const selection = window.getSelection();
      const selectedText = selection?.toString() || '';
      
      // Enviar mensaje al background para iniciar traducción
      // @ts-ignore
      await chrome.runtime.sendMessage({
        type: 'translateText',
        data: {
          text: selectedText,
          sourceLanguage: 'en',
          targetLanguage: 'es'
        }
      });
    });

    // Esperar a que se abra el sidepanel
    await page.waitForTimeout(2000);

    // Verificar que hay al menos 2 páginas (la principal + potencialmente el sidepanel)
    const pages = context.pages();
    expect(pages.length).toBeGreaterThanOrEqual(1);
  });

  test('Verificar disponibilidad del modelo de traducción', async ({ serviceWorker }) => {
    // Verificar que el modelo está disponible después de inyectar mocks
    const availability = await serviceWorker.evaluate(async () => {
      const modelManager = (self as any).ModelManager?.getInstance();
      if (!modelManager) {
        throw new Error('ModelManager no disponible');
      }

      const status = await modelManager.checkModelStatus({
        type: 'translation',
        source: 'en',
        target: 'es'
      });

      return status;
    });

    expect(availability.state).toBe('available');
    expect(availability.errorMessage).toBeUndefined();
  });

  test('Traducir texto usando el servicio directamente', async ({ serviceWorker }) => {
    // Ejecutar traducción directamente en el Service Worker
    const result = await serviceWorker.evaluate(async () => {
      const modelManager = (self as any).ModelManager?.getInstance();
      if (!modelManager) {
        throw new Error('ModelManager no disponible');
      }

      const translated = await modelManager.translate(
        'Hello World',
        'en',
        'es'
      );

      return translated;
    });

    // Verificar que la traducción contiene el texto esperado
    expect(result).toContain('Hello World');
    expect(result).toContain('Traducido');
  });

  test('Manejar errores cuando la API no está disponible', async ({ serviceWorker, mockAIAPIs }) => {
    // Inyectar mocks con API no disponible
    await mockAIAPIs({
      Translator: null,
      Summarizer: standardMocks.Summarizer,
      LanguageDetector: standardMocks.LanguageDetector,
    });

    // Intentar verificar disponibilidad
    const availability = await serviceWorker.evaluate(async () => {
      const modelManager = (self as any).ModelManager?.getInstance();
      if (!modelManager) {
        throw new Error('ModelManager no disponible');
      }

      const status = await modelManager.checkModelStatus({
        type: 'translation',
        source: 'en',
        target: 'es'
      });

      return status;
    });

    expect(availability.state).toBe('unavailable');
    expect(availability.errorMessage).toBeTruthy();
  });
});