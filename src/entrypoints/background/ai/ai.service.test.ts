import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '@/entrypoints/background/ai/ai.service';
import {
  onMessage,
  removeMessageListeners
} from '@/entrypoints/background/messaging';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';
import * as availableLanguagesModule from '@/entrypoints/background/languages';

// Mock ModelManager module
// TODO: usar importación dinámica
vi.mock('@/entrypoints/background/model-manager/model-manager.service', () => {
  const mockModelManagerInstance: Partial<ModelManager> = {
    summarize: vi.fn(() => Promise.resolve('Texto resumido.')),
    translate: vi.fn(() => Promise.resolve('Texto traducido.')),
    checkModelStatus: vi.fn(() => Promise.resolve({ state: 'available' as const })),
    downloadModel: vi.fn(),
  };
  return {
    ModelManager: {
      getInstance: () => mockModelManagerInstance
    }
  };
});

const mockModelManagerInstance = vi.mocked(ModelManager.getInstance());
const modelStatusUpdateSpy = vi.fn();

describe('AIService', () => {
  let aIService = new AIService();
  beforeEach(() => {
    // `reset` reestablece `browser` a su estado original (incluyendo runtime,
    // que es la base de `onMessage`)
    fakeBrowser.reset();
    vi.spyOn(browser.notifications, 'create');
    removeMessageListeners();
    onMessage('modelStatusUpdate', modelStatusUpdateSpy);
  });

  it('should follow the correct flow when summarization model is available', async () => {
    await aIService.processText('Texto a resumir', {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      summarize: true
    });

    expect(mockModelManagerInstance.checkModelStatus).toHaveBeenCalledWith({ type: 'summarization' });
    expect(mockModelManagerInstance.downloadModel).not.toHaveBeenCalled();
    expect(mockModelManagerInstance.summarize).toHaveBeenCalled();
  });

  it('should follow the correct flow when translation model is available', async () => {
    mockModelManagerInstance.translate.mockResolvedValue('Texto traducido.');

    const result = await aIService.processText('Texto a traducir', {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      summarize: false
    });

    expect(result).toBe('Texto traducido.');
    expect(mockModelManagerInstance.checkModelStatus).toHaveBeenCalledWith({
      type: 'translation',
      source: 'en',
      target: 'es'
    });
    expect(mockModelManagerInstance.downloadModel).not.toHaveBeenCalled();
    expect(mockModelManagerInstance.translate).toHaveBeenCalledWith('Texto a traducir', 'en', 'es');
  });

  it('should download model and send status messages when summarization model is downloadable', async () => {
    // Mock model downloadable
    mockModelManagerInstance.checkModelStatus.mockResolvedValueOnce({
      state: 'downloadable'
    });
    // Mock successful download
    mockModelManagerInstance.downloadModel.mockResolvedValueOnce({
      state: 'available'
    });
    mockModelManagerInstance.summarize.mockResolvedValueOnce('Resumen descargado.');

    const result = await aIService.processText('Texto a resumir', {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      summarize: true
    });

    expect(result).toBe('Resumen descargado.');
    expect(mockModelManagerInstance.checkModelStatus).toHaveBeenCalledWith({ type: 'summarization' });
    expect(mockModelManagerInstance.downloadModel).toHaveBeenCalledWith({ type: 'summarization' });
    expect(modelStatusUpdateSpy).toHaveBeenCalledTimes(2);
    // First message: downloading started
    expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(1,
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'downloading'
        })
      })
    );
    // Second message: download completed
    expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(2,
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'available'
        })
      })
    );
    expect(mockModelManagerInstance.summarize).toHaveBeenCalledWith('Texto a resumir',
      expect.objectContaining({
        expectedInputLanguages: ['en'],
        outputLanguage: 'es'
      })
    );
  });

  describe('AIService - model status messages', () => {
    it('should send downloading and available messages when summarization model needs to be downloaded', async () => {
      // Mock model not available initially
      mockModelManagerInstance.checkModelStatus.mockResolvedValueOnce({
        state: 'downloadable'
      });
      // Mock successful download
      mockModelManagerInstance.downloadModel.mockResolvedValueOnce({
        state: 'available'
      });
      mockModelManagerInstance.summarize.mockResolvedValueOnce('Resumen descargado.');

      await aIService.processText('Texto a resumir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      });

      expect(modelStatusUpdateSpy).toHaveBeenCalledTimes(2);
      // First message: downloading started
      expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'downloading'
          })
        })
      );
      // Second message: download completed
      expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'available'
          })
        })
      );
    });

    it('should not send status messages when summarization model is already available', async () => {
      // Mock model available (default behavior)
      mockModelManagerInstance.summarize.mockResolvedValueOnce('Resumen disponible.');

      await aIService.processText('Texto a resumir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      });

      expect(modelStatusUpdateSpy).not.toHaveBeenCalled();
    });

    it('should throw error when Chrome AI Summarizer API is not available', async () => {
      // Mock API not available
      const summarizerUnavailableMessage = 'Chrome AI Summarizer APIs no disponibles para descarga';
      mockModelManagerInstance.checkModelStatus.mockResolvedValueOnce({
        state: 'unavailable',
        errorMessage: summarizerUnavailableMessage
      });

      await expect(aIService.processText('Texto a resumir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      })).rejects.toThrow(summarizerUnavailableMessage);

      expect(modelStatusUpdateSpy).not.toHaveBeenCalled();
    });

    it('should send downloading and error messages when summarization model download fails', async () => {
      // Mock model not available initially
      const downloadFailedMessage = 'Descarga fallida';
      mockModelManagerInstance.checkModelStatus.mockResolvedValueOnce({
        state: 'downloadable'
      });
      // Mock failed download - throws error
      mockModelManagerInstance.downloadModel.mockRejectedValueOnce(new Error(downloadFailedMessage));

      await expect(aIService.processText('Texto a resumir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      })).rejects.toThrow(downloadFailedMessage);

      expect(modelStatusUpdateSpy).toHaveBeenCalledTimes(1);
      // First message: downloading started
      expect(modelStatusUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'downloading'
          })
        })
      );
    });

    it('should send downloading message when summarization model is already downloading', async () => {
      // Mock model already downloading
      const downloadingSummary = 'Resumen descargando.';
      mockModelManagerInstance.checkModelStatus.mockResolvedValueOnce({
        state: 'downloading'
      });
      mockModelManagerInstance.summarize.mockResolvedValueOnce(downloadingSummary);

      const result = await aIService.processText('Texto a resumir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      });

      expect(result).toBe(downloadingSummary);
      expect(mockModelManagerInstance.downloadModel).not.toHaveBeenCalled();
      expect(modelStatusUpdateSpy).toHaveBeenCalledTimes(1);
      expect(modelStatusUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'downloading'
          })
        })
      );
      // Verificar que se envíe la notificación ya que isNotificationPending está activado
      expect(browser.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'textProcessedNotification'
        })
      );
    });
  });

  describe('AIService - summarization with intermediate translation', () => {
    const mockSummarizerLanguageCodes = ['fr', 'zh', 'de'];
    const fallbackLang = mockSummarizerLanguageCodes[0];

    beforeEach(() => {
      vi.spyOn(availableLanguagesModule, 'SUMMARIZER_LANGUAGE_CODES', 'get').mockReturnValue(mockSummarizerLanguageCodes as any);
      aIService = new AIService();
    });
    it('should summarize directly when both languages are supported', async () => {
      mockModelManagerInstance.summarize.mockResolvedValueOnce('Resumen directo.');
      const supportedSourceLang = 'fr';
      const supportedTargetLang = 'zh';

      const result = await aIService.processText('Texto a resumir', {
        sourceLanguage: supportedSourceLang,
        targetLanguage: supportedTargetLang,
        summarize: true
      });

      expect(result).toBe('Resumen directo.');
      expect(mockModelManagerInstance.translate).not.toHaveBeenCalled();
      expect(mockModelManagerInstance.summarize).toHaveBeenCalledWith('Texto a resumir',
        expect.objectContaining({
          expectedInputLanguages: [supportedSourceLang],
          outputLanguage: supportedTargetLang
        })
      );
    });

    it('should translate input to fallback language and summarize when source language is not supported', async () => {
      mockModelManagerInstance.translate.mockResolvedValue('Traducido a respaldo.');
      mockModelManagerInstance.summarize.mockResolvedValue('Resumen de texto traducido.');
      const unsupportedSourceLang = 'en';
      const supportedTargetLang = 'de';

      const result = await aIService.processText('Texto a resumir', {
        sourceLanguage: unsupportedSourceLang,
        targetLanguage: supportedTargetLang,
        summarize: true
      });

      expect(result).toBe('Resumen de texto traducido.');
      expect(mockModelManagerInstance.translate).toHaveBeenCalledWith('Texto a resumir', unsupportedSourceLang, fallbackLang);
      expect(mockModelManagerInstance.summarize).toHaveBeenCalledWith('Traducido a respaldo.',
        expect.objectContaining({
          expectedInputLanguages: [fallbackLang],
          outputLanguage: supportedTargetLang
        })
      );
    });

    it('should summarize directly and translate summary when target language is not supported', async () => {
      mockModelManagerInstance.summarize.mockResolvedValue('Resumen en respaldo.');
      mockModelManagerInstance.translate.mockResolvedValue('Resumen traducido.');
      const supportedSourceLang = 'fr';
      const unsupportedTargetLang = 'en';

      const result = await aIService.processText('Texto a resumir', {
        sourceLanguage: supportedSourceLang,
        targetLanguage: unsupportedTargetLang,
        summarize: true
      });

      expect(result).toBe('Resumen traducido.');
      expect(mockModelManagerInstance.summarize).toHaveBeenCalledWith('Texto a resumir',
        expect.objectContaining({
          expectedInputLanguages: [supportedSourceLang],
          outputLanguage: fallbackLang
        })
      );
      expect(mockModelManagerInstance.translate).toHaveBeenCalledWith('Resumen en respaldo.', fallbackLang, unsupportedTargetLang);
    });

    it('should translate to fallback language, summarize, and translate summary back when neither language is supported', async () => {
      mockModelManagerInstance.translate
        .mockResolvedValueOnce('Traducido a respaldo.') // Input translation
        .mockResolvedValueOnce('Resumen traducido.'); // Summary translation

      mockModelManagerInstance.summarize.mockResolvedValue('Resumen en respaldo.');

      const unsupportedSourceLang = 'es';
      const unsupportedTargetLang = 'it';
      const fallbackLang = 'fr';

      const result = await aIService.processText('Texto en español', {
        sourceLanguage: unsupportedSourceLang,
        targetLanguage: unsupportedTargetLang,
        summarize: true
      });

      expect(result).toBe('Resumen traducido.');
      expect(mockModelManagerInstance.translate).toHaveBeenCalledTimes(2);
      expect(mockModelManagerInstance.translate).toHaveBeenNthCalledWith(1, 'Texto en español', unsupportedSourceLang, fallbackLang);
      expect(mockModelManagerInstance.translate).toHaveBeenNthCalledWith(2, 'Resumen en respaldo.', fallbackLang, unsupportedTargetLang);
      expect(mockModelManagerInstance.summarize).toHaveBeenCalledWith('Traducido a respaldo.',
        expect.objectContaining({
          expectedInputLanguages: [fallbackLang],
          outputLanguage: fallbackLang
        })
      );
    });
  });

  describe('AIService - translation', () => {
    it('should download translation model and send status messages when model requires download', async () => {
      // Mock model not available initially
      mockModelManagerInstance.checkModelStatus.mockResolvedValue({
        state: 'downloadable'
      });
      // Mock successful download
      mockModelManagerInstance.downloadModel.mockResolvedValue({
        state: 'available'
      });
      mockModelManagerInstance.translate.mockResolvedValue('Texto descargado y traducido.');

      const result = await aIService.processText('Texto a traducir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      });

      expect(result).toBe('Texto descargado y traducido.');
      expect(mockModelManagerInstance.checkModelStatus).toHaveBeenCalledWith({
        type: 'translation',
        source: 'en',
        target: 'es'
      });
      expect(mockModelManagerInstance.downloadModel).toHaveBeenCalledWith({
        type: 'translation',
        source: 'en',
        target: 'es'
      });
      expect(modelStatusUpdateSpy).toHaveBeenCalledTimes(2);
      // First message: downloading started
      expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'downloading'
          })
        })
      );
      // Second message: download completed
      expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'available'
          })
        })
      );
      expect(mockModelManagerInstance.translate).toHaveBeenCalledWith('Texto a traducir', 'en', 'es');
    });

    it('should send translation completion notification', async () => {
      // Mock model not available initially
      mockModelManagerInstance.checkModelStatus.mockResolvedValue({
        state: 'downloadable'
      });
      // Mock successful download
      mockModelManagerInstance.downloadModel.mockResolvedValue({
        state: 'available'
      });
      mockModelManagerInstance.translate.mockResolvedValue('Texto traducido.');

      await aIService.processText('Texto a traducir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      });

      // Verify browser notification was created
      expect(browser.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'textProcessedNotification'
        })
      );
    });

    it('should throw error when translation model check fails', async () => {
      // Clear default mock and set specific one for this test
      const translationApiNotSupportedMessage = 'API de traducción no soportada';
      mockModelManagerInstance.checkModelStatus.mockResolvedValue({
        state: 'unavailable',
        errorMessage: translationApiNotSupportedMessage
      });

      await expect(aIService.processText('Texto a traducir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      })).rejects.toThrow(translationApiNotSupportedMessage);

      expect(modelStatusUpdateSpy).not.toHaveBeenCalled();
    });

    it('should handle failed translation model download', async () => {
      // Mock model not available initially
      const translationDownloadFailedMessage = 'Descarga de traducción fallida';
      mockModelManagerInstance.checkModelStatus.mockResolvedValue({
        state: 'downloadable'
      });
      // Mock failed download - throws error
      mockModelManagerInstance.downloadModel.mockRejectedValue(new Error(translationDownloadFailedMessage));

      await expect(aIService.processText('Texto a traducir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      })).rejects.toThrow(translationDownloadFailedMessage);

      expect(modelStatusUpdateSpy).toHaveBeenCalledTimes(1);
      // First message: downloading started
      expect(modelStatusUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'downloading'
          })
        })
      );
      // No notification sent on failure
      expect(browser.notifications.create).not.toHaveBeenCalled();
    });
  });
});
