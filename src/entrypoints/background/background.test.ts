import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import {
  sendMessage,
  onMessage,
  removeMessageListeners,
} from '@/entrypoints/background/messaging';
import background from '@/entrypoints/background';
import { getAIService } from './ai/ai.service';

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

const aIService = vi.mocked(getAIService());

// Interface for message handler spies
interface MessageHandlerSpies {
  selectedText: MockInstance
  modelStatusUpdate: MockInstance;
}

// TODO: ¿es necesaria esta función?
const registerDefaultMessageHandlers = () => {
  const selectedTextSpy = vi.fn();
  const modelStatusUpdateSpy = vi.fn();

  onMessage('selectedText', selectedTextSpy);
  onMessage('modelStatusUpdate', modelStatusUpdateSpy);

  return {
    selectedText: selectedTextSpy,
    modelStatusUpdate: modelStatusUpdateSpy
  };
};

describe('Background Script', () => {
  let messageHandlerSpies: MessageHandlerSpies;

  beforeEach(() => {
    fakeBrowser.reset();
    removeMessageListeners();
    messageHandlerSpies = registerDefaultMessageHandlers();
    background.main();
  });
  describe('onInstalled Listener', () => {

    beforeEach(async () => {
      await fakeBrowser.runtime.onInstalled.trigger();
    });

    it('should create the context menu', () => {
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

    it('should configure side panel behavior exactly once', () => {
      expect(browser.sidePanel.setPanelBehavior).toHaveBeenCalledOnce();
      expect(browser.sidePanel.setPanelBehavior).toHaveBeenCalledWith({
        openPanelOnActionClick: true,
      });
    });
  });

  describe('onMessage Listener', () => {
    describe('when receiving a detectLanguage message', () => {
      it('should call the language detection API with the correct text', async () => {
        const testText = 'This is a test';
        await sendMessage('detectLanguage', testText);
        expect(aIService.detectLanguage).toHaveBeenCalledOnce();
        expect(aIService.detectLanguage).toHaveBeenCalledWith(testText);
      });

      it('should return the detected language', async () => {
        const detectedLanguage = 'en';
        aIService.detectLanguage.mockResolvedValue(detectedLanguage);
        const result = await sendMessage('detectLanguage', 'test');
        expect(result).toEqual(detectedLanguage);
      });
    });

    describe('when receiving a translateTextRequest message with available model', () => {
      const testText = 'This is a test text to translate';
      const sourceLanguage = 'en';
      const targetLanguage = 'es';

      it('should check model availability', async () => {
        await sendMessage('translateText', {
          text: testText,
          sourceLanguage,
          targetLanguage
        });
        expect(Translator.availability).toHaveBeenCalledWith({
          sourceLanguage,
          targetLanguage
        });
      });

      it('should execute translation', async () => {
        const translatorInstance: Pick<Translator, 'translate'> = { translate: vi.fn() };
        vi.mocked(Translator.create).mockResolvedValue(translatorInstance as Translator);
        await sendMessage('translateText', {
          text: testText,
          sourceLanguage,
          targetLanguage
        });
        expect(Translator.create).toHaveBeenCalled();
        expect(translatorInstance.translate).toHaveBeenCalled();
      });

      it('should return translation result', async () => {
        const translatedText = 'Este es un texto de prueba traducido';
        const translatorInstance: Pick<Translator, 'translate'> = { translate: vi.fn(() => Promise.resolve(translatedText)) };
        vi.mocked(Translator.create).mockResolvedValue(translatorInstance as Translator);

        const result = await sendMessage('translateText', {
          text: testText,
          sourceLanguage,
          targetLanguage
        });
        
        expect(result).toEqual(translatedText);
      });

      it('should send modelStatusUpdate when model is not available', async () => {
        vi.mocked(Translator.availability).mockResolvedValue('downloadable');
        const testText = 'Test text';
        const sourceLanguage = 'en';
        const targetLanguage = 'es';
        await sendMessage('translateText', { text: testText, sourceLanguage, targetLanguage });
        expect(messageHandlerSpies.modelStatusUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              state: 'downloading',
            }),
          })
        );
      });

      it('should send browser notification when translation requires model download', async () => {
        vi.mocked(Translator.availability).mockResolvedValue('downloadable');
        vi.spyOn(browser.notifications, 'create');


        await sendMessage('translateText', {
          text: 'Test text',
          sourceLanguage: 'en',
          targetLanguage: 'es'
        });

        expect(browser.notifications.create).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'textProcessedNotification'
          })
        );
      });
    });
  });
  describe('Context Menu onClicked Listener', () => {
    it('should open sidepanel', () => {
      // Use base setup
  
      // Trigger context menu click
      const selectedText = 'This is some selected text to translate';
      fakeBrowser.contextMenus.onClicked.trigger({
        menuItemId: 'translateSelection',
        selectionText: selectedText
      }, { id: 123 });

      // Verify that sidepanel was opened
      expect(browser.sidePanel.open).toHaveBeenCalled();
    });

    it('should send selectedText message to sidepanel when sidepanel is ready', async () => {
      // Simulate sidepanel sending ready message
      await sendMessage('sidepanelReady');

      // Trigger context menu click
      const selectedText = 'This is some selected text to translate';
      fakeBrowser.contextMenus.onClicked.trigger({
        menuItemId: 'translateSelection',
        selectionText: selectedText
      }, { id: 123 });

      // Verify that selectedText message was received
      await vi.waitFor(() => {
        expect(messageHandlerSpies.selectedText).toHaveBeenCalledWith(
          expect.objectContaining({ data: { text: selectedText, summarize: false } })
        );
      });
    });

    it('should wait for sidepanel to init before sending selectedText message', async () => {
      // Use base setup

      // Trigger context menu click
      const selectedText = 'This is some selected text to translate';
      fakeBrowser.contextMenus.onClicked.trigger({
        menuItemId: 'translateSelection',
        selectionText: selectedText
      }, { id: 123 });
      // Simulate sidepanel sending ready message
      await sendMessage('sidepanelReady');
      
      // Verify that selectedText message was received
      expect(messageHandlerSpies.selectedText).toHaveBeenCalledWith(
        expect.objectContaining({ data: { text: selectedText, summarize: false } })
      );
    });
  });
});
