/// <reference types="dom-chromium-ai" />
import { vi } from 'vitest';

type Listener = Parameters<typeof Browser.contextMenus.onClicked.addListener>[0]

const DEFAULT_MODEL_AVAILABILITY = 'available';
const DEFAULT_BROWSER_LANGUAGE = 'en-US';

const translatorMock: Pick<Translator, 'translate'> = {
  translate: vi.fn<Translator['translate']>(),
};
const languageDetectorMock: Pick<LanguageDetector, 'detect'> = {
  detect: vi.fn<LanguageDetector['detect']>(),
};
const summarizerMock: Pick<Summarizer, 'summarize'> = {
  summarize: vi.fn<Summarizer['summarize']>(),
};

const globalMocks: {
  Translator: Pick<typeof Translator, 'availability' | 'create'>;
  LanguageDetector: Pick<typeof LanguageDetector, 'availability' | 'create'>;
  Summarizer: Pick<typeof Summarizer, 'availability' | 'create'>;
  navigator: {
    clipboard: Pick<typeof navigator.clipboard, 'writeText'>;
    language: typeof navigator.language;
  };
} = {
  Translator: {
    availability: vi.fn<typeof Translator.availability>(
      () => Promise.resolve(DEFAULT_MODEL_AVAILABILITY)
    ),
    create: vi.fn<typeof Translator.create>(
      () => Promise.resolve(translatorMock as Translator)
    ),
  },
  LanguageDetector: {
    availability: vi.fn<typeof LanguageDetector.availability>(
      () => Promise.resolve(DEFAULT_MODEL_AVAILABILITY)
    ),
    create: vi.fn<typeof LanguageDetector.create>(
      () => Promise.resolve(languageDetectorMock as LanguageDetector)
    ),
  },
  Summarizer: {
    availability: vi.fn<typeof Summarizer.availability>(
      () => Promise.resolve(DEFAULT_MODEL_AVAILABILITY)
    ),
    create: vi.fn<typeof Summarizer.create>(
      () => Promise.resolve(summarizerMock as Summarizer)
    ),
  },
  navigator: {
    clipboard: {
      writeText: vi.fn(),
    },
    language: DEFAULT_BROWSER_LANGUAGE,
  }, 
};

const browserMocks: {
  i18n: Pick<typeof browser.i18n, 'getMessage'>;
  contextMenus: {
    create: typeof browser.contextMenus.create;
    removeAll: typeof browser.contextMenus.removeAll;
    onClicked: Pick<typeof browser.contextMenus.onClicked, 'addListener'> &
      { trigger: Listener };
  };
  sidePanel: Pick<typeof browser.sidePanel, 'setPanelBehavior' | 'open'>;
} = {
  i18n: {
    getMessage: vi.fn<typeof browser.i18n.getMessage>((key) => {
      // Devuelve la misma clave para simplificar las pruebas
      return key;
    }),
  },
  contextMenus: (() => {
    const listeners: Listener[] = [];
    const onClicked:
      Pick<typeof browser.contextMenus.onClicked, 'addListener'> &
      { trigger: Listener } = {
      addListener: vi.fn<typeof browser.contextMenus.onClicked.addListener>(
        (listener) => {
          listeners.push(listener);
        }
      ),
      trigger: (info, tab?) => {
        listeners.forEach(listener => { listener(info, tab); });
      },
    };
    return {
      create: vi.fn<typeof browser.contextMenus.create>(),
      removeAll: vi.fn<typeof browser.contextMenus.removeAll>(
        () => Promise.resolve()
        // vi.fn no copia correctamente la firma de una función sobrecargada
      ) as unknown as typeof browser.contextMenus.removeAll,
      onClicked,
    };
  })(),
  sidePanel: {
    setPanelBehavior: vi.fn(),
    open: vi.fn(),
  },
};

export function setupBrowserMocks() {
  Object.entries(globalMocks).forEach(([key, value]) => {
    vi.stubGlobal(key, value);
  });
  // TODO: investigar por qué no funciona
  // vi.stubGlobal('browser', browserMocks);
  Object.assign(browser, browserMocks);
}
