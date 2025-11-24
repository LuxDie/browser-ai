import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  sendMessage,
  onMessage,
  removeMessageListeners
} from '@/entrypoints/background/messaging';
import background from '@/entrypoints/background';
import { SIDEPANEL_PATH } from '@/utils/constants';

// Mock dependencies
vi.mock('@/entrypoints/background/ai/ai.service', () => {
  return {
    getAIService() { return {}; },
    registerAIService: vi.fn(),
  };
});

vi.mock('@/entrypoints/background/language/language.service', () => ({
  registerLanguageService: vi.fn(),
}));

const selectedTextMock = vi.fn();

describe('Background Script - Sidepanel', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    removeMessageListeners();
    onMessage('selectedText', selectedTextMock);
    background.main();
  });

  describe('Context Menu onClicked Listener', () => {
    it('should open sidepanel on tab', () => {
      const tabId = 123;
      const selectedText = 'Este es un texto seleccionado para traducir';

      fakeBrowser.contextMenus.onClicked.trigger({
        menuItemId: 'translateSelection',
        selectionText: selectedText
      }, { id: tabId });

      expect(browser.sidePanel.setOptions).toHaveBeenCalledWith({
        tabId,
        path: SIDEPANEL_PATH,
        enabled: true
      });
      expect(browser.sidePanel.open).toHaveBeenCalledWith({
        tabId
      });
    });

    it('should send selectedText message to sidepanel when sidepanel is ready', async () => {
      await sendMessage('sidepanelReady');

      const selectedText = 'Este es un texto seleccionado para traducir';
      fakeBrowser.contextMenus.onClicked.trigger({
        menuItemId: 'translateSelection',
        selectionText: selectedText
      }, { id: 123 });

      await vi.waitFor(() => {
        expect(selectedTextMock).toHaveBeenCalledWith(
          expect.objectContaining({ data: { text: selectedText, summarize: false } })
        );
      });
    });

    it('should wait for sidepanel to init before sending selectedText message', async () => {
      const selectedText = 'Este es un texto seleccionado para traducir';
      fakeBrowser.contextMenus.onClicked.trigger({
        menuItemId: 'translateSelection',
        selectionText: selectedText
      }, { id: 123 });

      await sendMessage('sidepanelReady');

      expect(selectedTextMock).toHaveBeenCalledWith(
        expect.objectContaining({ data: { text: selectedText, summarize: false } })
      );
    });
  });

  describe('Action onClicked Listener', () => {
    it('should open sidepanel if it is closed', () => {
      const tabId = 456;

      // Simulate click on extension icon
      fakeBrowser.action.onClicked.trigger({ id: tabId });

      expect(browser.sidePanel.setOptions).toHaveBeenCalledWith({
        tabId,
        path: SIDEPANEL_PATH,
        enabled: true
      });
      expect(browser.sidePanel.open).toHaveBeenCalledWith({
        tabId
      });
    });

    it('should close sidepanel if it is already open on the same tab', () => {
      const tabId = 789;

      // First click to open
      fakeBrowser.action.onClicked.trigger({ id: tabId });

      expect(browser.sidePanel.open).toHaveBeenCalledWith({ tabId });

      // Clear mocks to verify second click
      vi.mocked(browser.sidePanel.setOptions).mockClear();
      vi.mocked(browser.sidePanel.open).mockClear();

      // Second click to close
      fakeBrowser.action.onClicked.trigger({ id: tabId });

      expect(browser.sidePanel.setOptions).toHaveBeenCalledWith({
        tabId,
        path: SIDEPANEL_PATH,
        enabled: false
      });
      // Should not call open again
      expect(browser.sidePanel.open).not.toHaveBeenCalled();
    });
  });
});
