import { test as base, chromium, type BrowserContext } from '@playwright/test';
import type { Page, Worker } from '@playwright/test';
import { resolve } from 'path';

/**
 * Tipos de mocks para las APIs de Chrome AI
 */
export interface MockAIAPIs {
  Translator?: typeof Translator;
  Summarizer?: typeof Summarizer;
  LanguageDetector?: typeof LanguageDetector;
}

/**
 * Fixture extendido para pruebas E2E de la extensión
 */
export interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
  page: Page;
  serviceWorker: Worker;
  mockAIAPIs: (mocks: MockAIAPIs) => Promise<void>;
}

/**
 * Configuración de fixtures personalizados para pruebas E2E
 */
export const test = base.extend<ExtensionFixtures>({
  // Contexto del navegador con la extensión cargada
  context: async ({}, use) => {
    const pathToExtension = resolve(__dirname, '..', '.output', 'chrome-mv3');
    
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
      ],
    });

    await use(context);
    await context.close();
  },

  // ID de la extensión
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    const extensionId = background.url().split('/')[2];
    if (!extensionId) {
      throw new Error('No se pudo obtener el ID de la extensión');
    }

    await use(extensionId);
  },

  // Service Worker de la extensión
  serviceWorker: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    await use(background);
  },

  // Página principal
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
  },

  // Helper para mockear las APIs de Chrome AI
  mockAIAPIs: async ({ serviceWorker }, use) => {
    const mockFn = async (mocks: MockAIAPIs) => {
      // Inyectar mocks en el Service Worker
      await serviceWorker.evaluate((mockAPIs) => {
        // Obtener la instancia de ModelManager
        const modelManager = (self as any).ModelManager?.getInstance();
        
        if (!modelManager) {
          throw new Error('ModelManager no está disponible en el Service Worker');
        }

        // Crear mocks de las APIs
        const apiMocks: any = {};

        if (mockAPIs.Translator) {
          apiMocks.translator = mockAPIs.Translator;
        }

        if (mockAPIs.Summarizer) {
          apiMocks.summarizer = mockAPIs.Summarizer;
        }

        if (mockAPIs.LanguageDetector) {
          apiMocks.languageDetector = mockAPIs.LanguageDetector;
        }

        // Inyectar los mocks
        modelManager.setMockAPIs(apiMocks);
      }, mocks);
    };

    await use(mockFn);
  },
});

export { expect } from '@playwright/test';