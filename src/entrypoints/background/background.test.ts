import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  sendMessage,
  onMessage,
  removeMessageListeners
} from '@/entrypoints/background/messaging';
import background from '@/entrypoints/background';

// TODO: usar importación dinámica
vi.mock('@/entrypoints/background/ai/ai.service', () => {
  const mockAIService = {
    detectLanguage: vi.fn(() => Promise.resolve('es'))
  };
  return {
    getAIService() { return mockAIService; },
    registerAIService: vi.fn(),
  };
});

vi.mock('@/entrypoints/background/language/language.service', () => ({
  registerLanguageService: vi.fn(),
}));

const selectedTextMock = vi.fn();
const modelStatusUpdateMock = vi.fn();

describe('Background Script', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    // Se debe re-inicializar aquí ya que los simulacros de API de
    // navegador se reinician en cada `beforeEach` en el archivo de configuración
    // Además, una prueba podría reinicializar `main` con otros parámetros
    removeMessageListeners();
    onMessage('selectedText', selectedTextMock);
    onMessage('modelStatusUpdate', modelStatusUpdateMock);
    background.main();
  });
  describe('onInstalled Listener', () => {
    it('should create the context menu', async () => {
      await fakeBrowser.runtime.onInstalled.trigger({ reason: 'install', temporary: false });
      expect(browser.contextMenus.create).toHaveBeenCalledTimes(3);

      // Check that the parent menu is created
      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: 'browserAI',
        title: 'browserAIMenu',
        contexts: ['selection'],
      });

      // Check that translate option is created
      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        parentId: 'browserAI',
        id: 'translateSelection',
        title: 'translateMenu',
        contexts: ['selection'],
      });

      // Check that summarize option is created
      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        parentId: 'browserAI',
        id: 'summarizeSelection',
        title: 'summarizeMenu',
        contexts: ['selection'],
      });
    });
  });

  describe('onMessage Listener', () => {
    it('should handle sidepanelReady message', async () => {
      // Test pending request handling
      const pendingText = 'Texto pendiente';
      // Simulate a pending request by triggering context menu first
      await fakeBrowser.runtime.onInstalled.trigger({ reason: 'install', temporary: false });
      // Mock context menu click
      await fakeBrowser.contextMenus.onClicked.trigger({
        menuItemId: 'translateSelection',
        selectionText: pendingText
      }, { id: 1 });

      // Now trigger sidepanelReady
      await sendMessage('sidepanelReady');

      expect(selectedTextMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { text: pendingText, summarize: false }
        })
      );
    });
  });
});
