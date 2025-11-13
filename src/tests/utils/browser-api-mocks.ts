import { vi } from 'vitest';

type Listener = Parameters<typeof Browser.contextMenus.onClicked.addListener>[0]

const detectorInstance = {
  detect: vi.fn(() => Promise.resolve([
    {
      confidence: 1,
      detectedLanguage: 'en',
    },
  ])),
};

const globalMocks = {
  Translator: {
    availability: vi.fn(() => Promise.resolve('available')),
    create: vi.fn(() => Promise.resolve({
      translate: vi.fn(),
    })),
  },
  LanguageDetector: {
    availability: vi.fn(() => Promise.resolve('available')),
    create: vi.fn(() => Promise.resolve(detectorInstance)),
  },
  Summarizer: {
    availability: vi.fn(() => Promise.resolve('available')),
    create: vi.fn(() => Promise.resolve({
      summarize: vi.fn(),
    })),
  },
};

const browserMocks = {
  i18n: {
    getMessage: vi.fn((key: string) => {
      // Devuelve la misma clave para simplificar las pruebas
      return key;
    }),
  },
  contextMenus: (() => {
    const listeners: Listener[] = [];
    const onClicked = {
      addListener: vi.fn((listener: Listener) => {
        listeners.push(listener);
      }),
      trigger: (info: Browser.contextMenus.OnClickData, tab?: Browser.tabs.Tab) => {
        listeners.forEach(listener => { listener(info, tab); });
      },
    };
    return {
      create: vi.fn(),
      removeAll: vi.fn().mockResolvedValue(undefined),
      onClicked,
    };
  })(),
  sidePanel: {
    setPanelBehavior: vi.fn(),
    open: vi.fn(),
  },
  navigator: {
    clipboard: {
      writeText: vi.fn(),
    },
    language: 'en-US',
    languages: ['en-US', 'en', 'es'],
  },
  getSelection: vi.fn(() => ({
    toString: vi.fn(() => 'selected text'),
    rangeCount: 1
  }))
};

export function setupBrowserMocks() {
  Object.entries(globalMocks).forEach(([key, value]) => {
    vi.stubGlobal(key, value);
  });
  // TODO: investigar por qué no funciona
  // vi.stubGlobal('browser', browserMocks);
  Object.assign(browser, browserMocks);
}
