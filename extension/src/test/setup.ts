import { vi } from 'vitest'

// Deep mock of Chrome APIs
const deepMock = <T>(): T => {
  return new Proxy(() => {}, {
    get: (_, prop): unknown => {
      if (prop === 'then') return undefined; // Make it not then-able
      return deepMock();
    },
    apply: (): unknown => deepMock(),
  }) as T;
};

globalThis.chrome = deepMock<typeof chrome>();

// Mock de las APIs de IA integradas
Object.defineProperty(globalThis, 'translator', {
  value: {
    translate: vi.fn()
  },
  writable: true
})

Object.defineProperty(globalThis, 'languageDetector', {
  value: {
    detect: vi.fn()
  },
  writable: true
})

// Mock de clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn()
  },
  writable: true
})

// Mock de navigator.language y navigator.languages para detección de idioma
Object.defineProperty(navigator, 'language', {
  value: 'en-US',
  writable: true
})

Object.defineProperty(navigator, 'languages', {
  value: ['en-US', 'en', 'es'],
  writable: true
})

// Mock de window.getSelection
Object.defineProperty(window, 'getSelection', {
  value: vi.fn(() => ({
    toString: vi.fn(() => 'selected text'),
    rangeCount: 1
  })),
  writable: true
})
