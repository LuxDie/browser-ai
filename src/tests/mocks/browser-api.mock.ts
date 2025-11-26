import { vi } from 'vitest';

type ContextMenusListener = Parameters<typeof Browser.contextMenus.onClicked.addListener>[0];
type ActionListener = Parameters<typeof Browser.action.onClicked.addListener>[0];

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
  AbortController: typeof AbortController;
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
  AbortController: class {
    #signal = { aborted: false };
    get signal() { return this.#signal as AbortSignal; }
    abort = vi.fn<AbortController['abort']>(() => {
      this.#signal.aborted = true;
    });
  },
};

const browserMocks: {
  i18n: Pick<typeof browser.i18n, 'getMessage'>;
  contextMenus: {
    create: typeof browser.contextMenus.create;
    removeAll: typeof browser.contextMenus.removeAll;
    onClicked: Pick<typeof browser.contextMenus.onClicked, 'addListener'> &
    { trigger: ContextMenusListener };
  };
  action: {
    onClicked: Pick<typeof browser.action.onClicked, 'addListener'> &
    { trigger: ActionListener };
  };
  sidePanel: Pick<typeof browser.sidePanel, 'setPanelBehavior' | 'setOptions' | 'getOptions' | 'open'>;
} = {
  i18n: {
    getMessage: vi.fn<typeof browser.i18n.getMessage>((key) => {
      // Devuelve la misma clave para simplificar las pruebas
      return key;
    }),
  },
  contextMenus: (() => {
    const listeners: ContextMenusListener[] = [];
    return {
      create: vi.fn<typeof browser.contextMenus.create>(),
      removeAll: vi.fn<typeof browser.contextMenus.removeAll>(
        () => Promise.resolve()
        // vi.fn no copia correctamente la firma de una función sobrecargada
      ) as unknown as typeof browser.contextMenus.removeAll,
      onClicked: {
        addListener: vi.fn<typeof browser.contextMenus.onClicked.addListener>(
          (listener) => {
            listeners.push(listener);
          }
        ),
        trigger: (info, tab?) => {
          listeners.forEach(listener => { listener(info, tab); });
        },
      },
    };
  })(),
  action: (() => {
    const listeners: ActionListener[] = [];
    return {
      onClicked: {
        addListener: vi.fn<typeof browser.action.onClicked.addListener>(
          (listener) => {
            listeners.push(listener);
          }
        ),
        trigger: (tab) => {
          listeners.forEach(listener => { listener(tab); });
        },
      },
    };
  })(),
  sidePanel: {
    setPanelBehavior: vi.fn(),
    setOptions: vi.fn(),
    getOptions: vi.fn(() =>
      Promise.resolve({ enabled: false, path: '' })
    ),
    open: vi.fn(),
  },
};

/**
 * Función helper para configurar los mocks del navegador necesarios para las pruebas
 * Establece mocks globales para APIs del navegador y funciones de IA usando vi.stubGlobal
 * Configura mocks para Translator, LanguageDetector, Summarizer, AbortController y navigator
 * También asigna mocks directamente al objeto browser usando Object.assign
 */
export function setupBrowserMocks() {
  Object.entries(globalMocks).forEach(([key, value]) => {
    vi.stubGlobal(key, value);
  });
  // TODO: investigar por qué no funciona
  // vi.stubGlobal('browser', browserMocks);
  Object.assign(browser, browserMocks);
}
