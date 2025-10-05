import { vi } from 'vitest';

interface ChromeMessage {
  type: string;
  data?: unknown;
}

interface ChromeMessageSender {
  tab?: {
    id?: number;
  };
}

interface ChromeMessageSendResponse {
  (response?: unknown): void;
}

type ChromeMessageListener = (
  message: ChromeMessage,
  sender: ChromeMessageSender,
  sendResponse: ChromeMessageSendResponse
) => void;

/**
 * Mock completo para las APIs de Chrome que no están disponibles en el entorno de prueba de Vitest (Node.js)
 * Este mock proporciona todas las APIs necesarias para las pruebas de la extensión
 */
export const createChromeMock = () => {
  const onMessageListeners: ChromeMessageListener[] = [];

  return {
    runtime: {
      onInstalled: {
        addListener: vi.fn(),
      },
      onStartup: {
        addListener: vi.fn(),
      },
      onMessage: {
        addListener: vi.fn((listener: ChromeMessageListener) => {
          onMessageListeners.push(listener);
        }),
        removeListener: vi.fn(),
        // Custom trigger para simular la recepción de mensajes en las pruebas
        trigger: (message: ChromeMessage) => {
          onMessageListeners.forEach(listener => listener(message, {}, () => {}));
        },
      },
      sendMessage: vi.fn(),
      lastError: null,
      id: 'test-extension-id',
    },
    contextMenus: {
      create: vi.fn(),
      onClicked: {
        addListener: vi.fn(),
      },
    },
    sidePanel: {
      setPanelBehavior: vi.fn(),
      open: vi.fn(),
    },
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      },
      onChanged: {
        addListener: vi.fn(),
      },
    },
    tabs: {
      onRemoved: {
        addListener: vi.fn(),
      },
      onActivated: {
        addListener: vi.fn(),
      },
      query: vi.fn().mockResolvedValue([]),
      sendMessage: vi.fn(),
    },
    scripting: {
      executeScript: vi.fn(),
    },
    notifications: {
      create: vi.fn(),
    },
    action: {
      onClicked: {
        addListener: vi.fn(),
      },
    },
  };
};

/**
 * Configura el mock global de Chrome para las pruebas
 * @param mockChrome - El mock de Chrome a configurar
 */
export const setupChromeMock = (mockChrome: ReturnType<typeof createChromeMock>) => {
  vi.stubGlobal('chrome', mockChrome);
};

/**
 * Limpia todos los mocks de Chrome
 * @param mockChrome - El mock de Chrome a limpiar
 */
export const clearChromeMocks = (mockChrome: ReturnType<typeof createChromeMock>) => {
  Object.values(mockChrome).forEach((api) => {
    if (typeof api === 'object' && api !== null) {
      Object.values(api).forEach((method) => {
        if (typeof method === 'object' && method !== null && 'mockClear' in method) {
          (method as { mockClear: () => void }).mockClear();
        }
      });
    }
  });
};
