import { vi } from 'vitest';
import { createAIMock } from '@/tests/mocks';
import { beforeEach } from 'vitest';

// Mock de clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn()
  },
  writable: true
});

// Mock de navigator.language y navigator.languages para detección de idioma
Object.defineProperty(navigator, 'language', {
  value: 'en-US',
  writable: true
});

Object.defineProperty(navigator, 'languages', {
  value: ['en-US', 'en', 'es'],
  writable: true
});

// Mock de window.getSelection
Object.defineProperty(window, 'getSelection', {
  value: vi.fn(() => ({
    toString: vi.fn(() => 'selected text'),
    rangeCount: 1
  })),
  writable: true
});

// Extend browser with additional mocks (runtime and notifications are provided by fakeBrowser)

type Listener = Parameters<typeof Browser.contextMenus.onClicked.addListener>[0]

Object.assign(browser, {
  i18n: {
    getMessage: vi.fn((key: string) => {
      // Return the key itself for simplicity in tests
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
  }
});

// Mock de las APIs de IA integradas
const mockAI = createAIMock();

beforeEach(() => {
  vi.stubGlobal('LanguageDetector', mockAI.LanguageDetector);
  vi.stubGlobal('Translator', mockAI.Translator);
  vi.stubGlobal('Summarizer', mockAI.Summarizer);
});
