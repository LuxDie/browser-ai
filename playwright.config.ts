import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';

/**
 * Configuración de Playwright para pruebas E2E de la extensión Browser AI.
 * 
 * Esta configuración carga la extensión sin empaquetar en un contexto de navegador
 * persistente para permitir pruebas E2E completas con las APIs de Chrome AI mockeadas.
 */
export default defineConfig({
  testDir: './e2e',
  
  // Tiempo máximo para cada prueba
  timeout: 60000,
  
  // Configuración global de expect
  expect: {
    timeout: 10000
  },
  
  // Ejecutar pruebas en serie para evitar conflictos con la extensión
  fullyParallel: false,
  workers: 1,
  
  // Configuración de reportes
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['list']
  ],
  
  // Directorio para artefactos de prueba
  outputDir: 'e2e-results',
  
  use: {
    // URL base para navegación
    baseURL: 'chrome://extensions',
    
    // Captura de screenshots en caso de fallo
    screenshot: 'only-on-failure',
    
    // Captura de video en caso de fallo
    video: 'retain-on-failure',
    
    // Trace en caso de fallo
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Args necesarios para cargar la extensión
        launchOptions: {
          args: [
            `--disable-extensions-except=${resolve(__dirname, '.output/chrome-mv3')}`,
            `--load-extension=${resolve(__dirname, '.output/chrome-mv3')}`,
            '--no-sandbox'
          ],
          // Mantener el navegador abierto para debugging si es necesario
          headless: process.env['CI'] ? true : false,
        }
      },
    },
  ],
});