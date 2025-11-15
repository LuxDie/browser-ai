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
    summarizeText: vi.fn(() => Promise.resolve('Texto resumido.')),
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
    await aIService.processText('Text to summarize', {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      summarize: true
    });

    expect(mockModelManagerInstance.checkModelStatus).toHaveBeenCalledWith({ type: 'summarization' });
    expect(mockModelManagerInstance.downloadModel).not.toHaveBeenCalled();
    expect(mockModelManagerInstance.summarizeText).toHaveBeenCalled();
  });

  it('should follow the correct flow when translation model is available', async () => {
    mockModelManagerInstance.translate.mockResolvedValue('Texto traducido.');

    const result = await aIService.processText('Text to translate', {
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
    expect(mockModelManagerInstance.translate).toHaveBeenCalledWith('Text to translate', 'en', 'es');
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
    mockModelManagerInstance.summarizeText.mockResolvedValueOnce('Downloaded summary.');

    const result = await aIService.processText('Text to summarize', {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      summarize: true
    });

    expect(result).toBe('Downloaded summary.');
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
    expect(mockModelManagerInstance.summarizeText).toHaveBeenCalledWith('Text to summarize',
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
      mockModelManagerInstance.summarizeText.mockResolvedValueOnce('Downloaded summary.');

      await aIService.processText('Text to summarize', {
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
      mockModelManagerInstance.summarizeText.mockResolvedValueOnce('Available summary.');

      await aIService.processText('Text to summarize', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      });

      expect(modelStatusUpdateSpy).not.toHaveBeenCalled();
    });

    it('should throw error when Chrome AI Summarizer API is not available', async () => {
      // Mock API not available
      mockModelManagerInstance.checkModelStatus.mockResolvedValueOnce({
        state: 'unavailable',
        errorMessage: 'Chrome AI Summarizer APIs no disponibles para descarga'
      });

      await expect(aIService.processText('Text to summarize', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      })).rejects.toThrow('Chrome AI Summarizer APIs no disponibles para descarga');

      expect(modelStatusUpdateSpy).not.toHaveBeenCalled();
    });

    it('should send downloading and error messages when summarization model download fails', async () => {
      // Mock model not available initially
      mockModelManagerInstance.checkModelStatus.mockResolvedValueOnce({
        state: 'downloadable'
      });
      // Mock failed download - model still not available
      mockModelManagerInstance.downloadModel.mockResolvedValueOnce({
        state: 'unavailable',
        errorMessage: 'Download failed'
      });

      const result = await aIService.processText('Text to summarize', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      });

      expect(result).toBeUndefined();
      expect(modelStatusUpdateSpy).toHaveBeenCalledTimes(2);
      // First message: downloading started
      expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'downloading'
          })
        })
      );
      // Second message: download failed
      expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'unavailable',
            errorMessage: 'Download failed'
          })
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
      mockModelManagerInstance.summarizeText.mockResolvedValueOnce('Direct summary.');
      const supportedSourceLang = 'fr';
      const supportedTargetLang = 'zh';

      const result = await aIService.processText('Text to summarize', {
        sourceLanguage: supportedSourceLang,
        targetLanguage: supportedTargetLang,
        summarize: true
      });

      expect(result).toBe('Direct summary.');
      expect(mockModelManagerInstance.translate).not.toHaveBeenCalled();
      expect(mockModelManagerInstance.summarizeText).toHaveBeenCalledWith('Text to summarize',
        expect.objectContaining({
          expectedInputLanguages: [supportedSourceLang],
          outputLanguage: supportedTargetLang
        })
      );
    });

    it('should translate input to fallback language and summarize when source language is not supported', async () => {
      mockModelManagerInstance.translate.mockResolvedValue('Traducido a respaldo.');
      mockModelManagerInstance.summarizeText.mockResolvedValue('Resumen de texto traducido.');
      const unsupportedSourceLang = 'en';
      const supportedTargetLang = 'de';

      const result = await aIService.processText('Texto a resumir', {
        sourceLanguage: unsupportedSourceLang,
        targetLanguage: supportedTargetLang,
        summarize: true
      });

      expect(result).toBe('Resumen de texto traducido.');
      expect(mockModelManagerInstance.translate).toHaveBeenCalledWith('Texto a resumir', unsupportedSourceLang, fallbackLang);
      expect(mockModelManagerInstance.summarizeText).toHaveBeenCalledWith('Traducido a respaldo.',
        expect.objectContaining({
          expectedInputLanguages: [fallbackLang],
          outputLanguage: supportedTargetLang
        })
      );
    });

    it('should summarize directly and translate summary when target language is not supported', async () => {
      mockModelManagerInstance.summarizeText.mockResolvedValue('Resumen en respaldo.');
      mockModelManagerInstance.translate.mockResolvedValue('Resumen traducido.');
      const supportedSourceLang = 'fr';
      const unsupportedTargetLang = 'en';

      const result = await aIService.processText('Text to summarize', {
        sourceLanguage: supportedSourceLang,
        targetLanguage: unsupportedTargetLang,
        summarize: true
      });

      expect(result).toBe('Resumen traducido.');
      expect(mockModelManagerInstance.summarizeText).toHaveBeenCalledWith('Text to summarize',
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

      mockModelManagerInstance.summarizeText.mockResolvedValue('Resumen en respaldo.');

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
      expect(mockModelManagerInstance.summarizeText).toHaveBeenCalledWith('Traducido a respaldo.',
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

      const result = await aIService.processText('Text to translate', {
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
      expect(mockModelManagerInstance.translate).toHaveBeenCalledWith('Text to translate', 'en', 'es');
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

      await aIService.processText('Text to translate', {
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
      mockModelManagerInstance.checkModelStatus.mockReset();
      mockModelManagerInstance.checkModelStatus.mockResolvedValue({
        state: 'unavailable',
        errorMessage: 'Translation API not supported'
      });

      await expect(aIService.processText('Text to translate', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      })).rejects.toThrow('Translation API not supported');

      expect(modelStatusUpdateSpy).not.toHaveBeenCalled();
      expect(mockModelManagerInstance.translate).not.toHaveBeenCalled();
    });

    it('should handle failed translation model download', async () => {
      // Mock model not available initially
      mockModelManagerInstance.checkModelStatus.mockResolvedValue({
        state: 'downloadable'
      });
      // Mock failed download - model still not available
      mockModelManagerInstance.downloadModel.mockResolvedValue({
        state: 'unavailable',
        errorMessage: 'Translation download failed'
      });

      const result = await aIService.processText('Text to translate', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      });

      expect(result).toBeUndefined();
      expect(modelStatusUpdateSpy).toHaveBeenCalledTimes(2);
      // First message: downloading started
      expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'downloading'
          })
        })
      );
      // Second message: download failed
      expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'unavailable',
            errorMessage: 'Translation download failed'
          })
        })
      );
      // No notification sent on failure
      expect(browser.notifications.create).not.toHaveBeenCalled();
    });
  });
});
