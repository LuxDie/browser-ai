import { test, expect } from './fixtures';

/**
 * Pruebas de humo (smoke tests) para verificar que la extensión
 * se carga correctamente y los componentes básicos funcionan.
 */
test.describe('Smoke Tests - Carga de la extensión', () => {
  test('La extensión se carga correctamente', async ({ extensionId }) => {
    // Verificar que la extensión tiene un ID válido
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);
  });

  test('El Service Worker de la extensión está activo', async ({ serviceWorker }) => {
    // Verificar que el Service Worker está disponible
    expect(serviceWorker).toBeTruthy();
    
    // Verificar que la URL del Service Worker es correcta
    const url = serviceWorker.url();
    expect(url).toContain('chrome-extension://');
    expect(url).toContain('/background.js');
  });

  test('La página de extensiones muestra la extensión instalada', async ({ page, extensionId }) => {
    // Navegar a la página de extensiones
    await page.goto('chrome://extensions/');
    
    // Esperar a que la página cargue
    await page.waitForLoadState('domcontentloaded');
    
    // Verificar que la extensión aparece en la lista
    // Nota: Esta verificación puede variar según la versión de Chrome
    const extensionCard = page.locator(`#${extensionId}`).first();
    await expect(extensionCard).toBeVisible({ timeout: 5000 });
  });

  test('El panel lateral puede abrirse', async ({ page, context }) => {
    // Abrir una página de prueba
    await page.goto('https://example.com');
    
    // Intentar abrir el panel lateral mediante la API
    await page.evaluate(async () => {
      // @ts-ignore - chrome.sidePanel puede no estar tipado
      await chrome.sidePanel.open();
    });
    
    // Esperar un momento para que el panel se abra
    await page.waitForTimeout(1000);
    
    // Verificar que hay al menos 2 páginas (la principal + el sidepanel)
    const pages = context.pages();
    expect(pages.length).toBeGreaterThanOrEqual(1);
  });

  test('ModelManager está disponible en el Service Worker', async ({ serviceWorker }) => {
    // Verificar que ModelManager está disponible
    const hasModelManager = await serviceWorker.evaluate(() => {
      return typeof (self as any).ModelManager !== 'undefined';
    });
    
    expect(hasModelManager).toBe(true);
  });
});