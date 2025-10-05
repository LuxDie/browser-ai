
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createChromeMock, createAIMock, setupChromeMock, setupAIMock } from './test-utils';

// Mock para las APIs de Chrome y del navegador que no están disponibles en el entorno de prueba de Vitest (Node.js)
const mockChrome = createChromeMock();
const mockAI = createAIMock();

// Configuramos los mocks globales
setupChromeMock(mockChrome);
setupAIMock(mockAI);

describe('Background Script', () => {
  describe('onInstalled Listener', () => {
    // Se ejecuta una vez antes de todas las pruebas en este bloque.
    beforeAll(async () => {
      // 1. Limpiamos cualquier estado de pruebas anteriores.
      vi.resetModules();
      vi.clearAllMocks();

      // 2. Configuramos el comportamiento de los mocks que devuelven promesas.
      mockChrome.sidePanel.setPanelBehavior.mockResolvedValue(undefined);
      mockChrome.storage.local.set.mockResolvedValue(undefined);

      // 3. Importamos el script de fondo para que sus listeners se registren en nuestros mocks.
      await import('../background');

      // 4. Capturamos y ejecutamos el callback de onInstalled, simulando el evento.
      const onInstalledCallback = (mockChrome.runtime.onInstalled.addListener.mock.calls[0] as [() => Promise<void>])[0];
      await onInstalledCallback();

      // 5. Esperamos a que se completen las operaciones asíncronas iniciadas por el callback.
      await new Promise<void>((resolve) => process.nextTick(resolve));
    });

    it('should create the context menu exactly once', () => {
      expect(mockChrome.contextMenus.create).toHaveBeenCalledOnce();
      expect(mockChrome.contextMenus.create).toHaveBeenCalledWith(
        {
          id: 'translate-selected-text',
          title: 'Traducir con Browser AI',
          contexts: ['selection'],
        },
        expect.any(Function)
      );
    });

    it('should configure side panel behavior exactly once', () => {
      expect(mockChrome.sidePanel.setPanelBehavior).toHaveBeenCalledOnce();
      expect(mockChrome.sidePanel.setPanelBehavior).toHaveBeenCalledWith({
        openPanelOnActionClick: true,
      });
    });

    it('should set default values in storage exactly once', () => {
      expect(mockChrome.storage.local.set).toHaveBeenCalledOnce();
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        translatorAPIAvailable: true,
        languageDetectorAPIAvailable: true,
        defaultTargetLanguage: 'es',
        privacyMode: false,
      });
    });
  });

  describe('onMessage Listener', () => {
    describe('when receiving a DETECT_LANGUAGE message', () => {
      const testText = 'This is a test';
      const detectedLanguage = 'en';
      const tabId = 123;
      const detectMock = vi.fn().mockResolvedValue([{ detectedLanguage, confidence: 0.9 }]);

      beforeAll(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        // Mock AI API
        mockAI.LanguageDetector.availability.mockResolvedValue('available');
        mockAI.LanguageDetector.create.mockResolvedValue({ detect: detectMock });

        // Mock Chrome API
        mockChrome.tabs.sendMessage.mockResolvedValue(undefined);

        // Import background script to register listeners
        await import('../background');

        // Get and call the onMessage listener
        const onMessageCallback = (mockChrome.runtime.onMessage.addListener.mock.calls[0] as [(message: any, sender: any) => Promise<void>])[0];
        
        const message = {
          type: 'DETECT_LANGUAGE',
          data: { text: testText },
        };
        const sender = {
          tab: { id: tabId },
        };

        await onMessageCallback(message, sender);

        // Wait for async operations to complete
        await new Promise(resolve => process.nextTick(resolve));
      });

      it('should call the language detection API with the correct text', () => {
        expect(detectMock).toHaveBeenCalledOnce();
        expect(detectMock).toHaveBeenCalledWith(testText);
      });

      it('should send a LANGUAGE_DETECTED message back to the sidepanel', async () => {
        await new Promise(resolve => process.nextTick(resolve));
        expect(mockChrome.runtime.sendMessage).toHaveBeenCalledOnce();
        expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'LANGUAGE_DETECTED',
          data: { language: detectedLanguage },
        });
      });
    });
  });

  describe('onMessage Listener', () => {
    describe('when receiving a TRANSLATE_TEXT_REQUEST with available model', () => {
      const testText = 'This is a test text to translate';
      const sourceLanguage = 'en';
      const targetLanguage = 'es';

      beforeAll(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        // Mock AI API - modelo disponible
        mockAI.Translator.availability.mockResolvedValue('available');
        mockAI.Translator.create.mockResolvedValue({
          translate: vi.fn().mockResolvedValue('Este es un texto de prueba traducido')
        });

        // Mock Chrome API
        mockChrome.runtime.sendMessage.mockResolvedValue(undefined);

        // Import background script to register listeners
        await import('../background');

        // Get and call the onMessage listener
        const onMessageCallback = (mockChrome.runtime.onMessage.addListener.mock.calls[0] as [(message: any, sender: any) => Promise<void>])[0];

        const message = {
          type: 'TRANSLATE_TEXT_REQUEST',
          data: {
            text: testText,
            sourceLanguage,
            targetLanguage
          },
        };
        const sender = {
          tab: { id: 123 },
        };

        await onMessageCallback(message, sender);

        // Wait for async operations to complete
        await new Promise(resolve => process.nextTick(resolve));
      });

      it('should check model availability', () => {
        expect(mockAI.Translator.availability).toHaveBeenCalledWith({
          sourceLanguage,
          targetLanguage
        });
      });

      it('should send MODEL_AVAILABILITY_RESPONSE when model is available', () => {
        expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'MODEL_AVAILABILITY_RESPONSE',
          data: {
            source: sourceLanguage,
            target: targetLanguage,
            status: {
              available: true,
              downloading: false
            }
          }
        });
      });

      it('should execute translation', () => {
        expect(mockAI.Translator.create).toHaveBeenCalled();
      });

      it('should send TRANSLATION_COMPLETED message', () => {
        expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'TRANSLATION_COMPLETED',
          data: {
            originalText: testText,
            translatedText: 'Este es un texto de prueba traducido',
            sourceLanguage,
            targetLanguage,
            usingCloud: false
          }
        });
      });
    });

    describe('when receiving a TRANSLATE_TEXT_REQUEST with same source and target languages', () => {
      const testText = 'Hello world';
      const sourceLanguage = 'en';
      const targetLanguage = 'en';

      beforeAll(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        // Mock Chrome API
        mockChrome.runtime.sendMessage.mockResolvedValue(undefined);

        // Import background script to register listeners
        await import('../background');

        // Get and call the onMessage listener
        const onMessageCallback = (mockChrome.runtime.onMessage.addListener.mock.calls[0] as [(message: any, sender: any) => Promise<void>])[0];

        const message = {
          type: 'TRANSLATE_TEXT_REQUEST',
          data: {
            text: testText,
            sourceLanguage,
            targetLanguage
          },
        };
        const sender = {
          tab: { id: 123 },
        };

        await onMessageCallback(message, sender);

        // Wait for async operations to complete
        await new Promise(resolve => process.nextTick(resolve));
      });

      it('should skip translation and return original text when languages are the same', () => {
        expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'TRANSLATION_COMPLETED',
          data: {
            translatedText: testText, // Original text returned unchanged
            sourceLanguage,
            targetLanguage,
            usingCloud: false
          }
        });
      });

      it('should not check model availability', () => {
        expect(mockAI.Translator.availability).not.toHaveBeenCalled();
      });

      it('should not create translator instance', () => {
        expect(mockAI.Translator.create).not.toHaveBeenCalled();
      });
    });

    describe('when receiving a TRANSLATE_WITH_CLOUD message with same source and target languages', () => {
      const testText = 'Hello world';
      const sourceLanguage = 'en';
      const targetLanguage = 'en';

      beforeAll(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        // Mock Chrome API
        mockChrome.runtime.sendMessage.mockResolvedValue(undefined);

        // Import background script to register listeners
        await import('../background');

        // Get and call the onMessage listener
        const onMessageCallback = (mockChrome.runtime.onMessage.addListener.mock.calls[0] as [(message: any, sender: any) => Promise<void>])[0];

        const message = {
          type: 'TRANSLATE_WITH_CLOUD',
          data: {
            text: testText,
            sourceLanguage,
            targetLanguage
          },
        };
        const sender = {
          tab: { id: 123 },
        };

        await onMessageCallback(message, sender);

        // Wait for async operations to complete
        await new Promise(resolve => process.nextTick(resolve));
      });

      it('should skip cloud translation and return original text when languages are the same', () => {
        expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'TRANSLATION_COMPLETED',
          data: {
            translatedText: testText, // Original text returned unchanged
            sourceLanguage,
            targetLanguage,
            usingCloud: true
          }
        });
      });

      it('should not access cloud API configuration', () => {
        expect(mockChrome.storage.local.get).not.toHaveBeenCalledWith(['cloudAPIKey', 'cloudProvider']);
      });
    });
  });
});
