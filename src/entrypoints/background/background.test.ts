import { beforeAll, beforeEach, describe, expect, it, vi, MockInstance } from 'vitest';
import { createAIMock, createTranslatorMock, detectorInstance } from '@/tests/mocks';
import {
  sendMessage,
  onMessage,
  removeMessageListeners,
} from '@/entrypoints/background/messaging';
import background, { LanguageCode } from '@/entrypoints/background';
import { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';

// Mock para las APIs de Chrome AI que no están disponibles en el entorno de prueba de Vitest (Node.js)
const mockAI = createAIMock();

// Interface for message handler spies
interface MessageHandlerSpies {
  selectedText: MockInstance
  modelStatusUpdate: MockInstance;
}

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

  beforeAll(() => {
    vi.stubGlobal('self', {
      LanguageDetector: mockAI.LanguageDetector,
      Translator: mockAI.Translator,
    });
    // Mock contextMenus.onClicked to support trigger
    const listeners: ((info: any, tab?: any) => void)[] = [];
    vi.mocked(browser.contextMenus.onClicked).addListener = vi.fn((listener: (info: any, tab?: any) => void) => {
      listeners.push(listener);
    });
    (browser.contextMenus.onClicked as any).trigger = (info: any, tab?: any) => {
      listeners.forEach(listener => { listener(info, tab); });
    };

    (browser.sidePanel as any) = {
      setPanelBehavior: vi.fn().mockResolvedValue(undefined),
      open: vi.fn().mockResolvedValue(undefined),
    };

    (browser.notifications as any) = {
      create: vi.fn(),
    };
  });
  beforeEach(() => {
    fakeBrowser.reset();
    removeMessageListeners();
    messageHandlerSpies = registerDefaultMessageHandlers();
    background.main();
  });
  describe('onInstalled Listener', () => {
    // Se ejecuta una vez antes de todas las pruebas en este bloque.
    beforeAll(() => {
      browser.contextMenus.removeAll = vi.fn().mockResolvedValue(undefined);
      browser.contextMenus.create = vi.fn();
    });
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
        await sendMessage('detectLanguage', { text: testText });
        expect(detectorInstance.detect).toHaveBeenCalledOnce();
        expect(detectorInstance.detect).toHaveBeenCalledWith(testText);
      });

      it('should return the detected language', async () => {
        const detectedLanguage = 'en';
        detectorInstance.detect.mockResolvedValue([
          {
            confidence: 1,
            detectedLanguage,
          },
        ]);
        const result = await sendMessage('detectLanguage', { text: 'test' });
        expect(result).toEqual({ languageCode: detectedLanguage });
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
        expect(mockAI.Translator.availability).toHaveBeenCalledWith({
          sourceLanguage,
          targetLanguage
        });
      });

      it('should execute translation', async () => {
        const translatorInstance = createTranslatorMock();
        mockAI.Translator.create.mockResolvedValue(translatorInstance);
        await sendMessage('translateText', {
          text: testText,
          sourceLanguage,
          targetLanguage
        });
        expect(mockAI.Translator.create).toHaveBeenCalled();
        expect(translatorInstance.translate).toHaveBeenCalled();
      });

      it('should return translation result', async () => {
        const translatedText = 'Este es un texto de prueba traducido';
        const translatorInstance = createTranslatorMock(translatedText);
        mockAI.Translator.create.mockResolvedValue(translatorInstance);

        const result = await sendMessage('translateText', {
          text: testText,
          sourceLanguage,
          targetLanguage
        });
        
        expect(result).toEqual(translatedText);
      });

      it('should send modelStatusUpdate when model is not available', async () => {
        mockAI.Translator.availability.mockResolvedValue('downloadable');
        const testText = 'Test text';
        const sourceLanguage = 'en' as LanguageCode;
        const targetLanguage = 'es' as LanguageCode;
        await sendMessage('translateText', { text: testText, sourceLanguage, targetLanguage });
        expect(messageHandlerSpies.modelStatusUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              state: 'downloading',
            }) as AIModelStatus,
          })
        );
      });

      it('should send browser notification when translation requires model download', async () => {
        mockAI.Translator.availability.mockResolvedValue('downloadable');
        vi.spyOn(browser.notifications, 'create');


        await sendMessage('translateText', {
          text: 'Test text',
          sourceLanguage: 'en' as LanguageCode,
          targetLanguage: 'es' as LanguageCode
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
      (browser.contextMenus.onClicked as any).trigger({
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
      (browser.contextMenus.onClicked as any).trigger({
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
      (browser.contextMenus.onClicked as any).trigger({
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
