import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { AIService } from '@/entrypoints/background/ai/ai.service';
import {
  onMessage,
  removeMessageListeners
} from '@/entrypoints/background/messaging';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';
import * as availableLanguagesModule from '@/entrypoints/background/available-languages';

// Mock ModelManager module
// TODO: usar importación dinámica
vi.mock('@/entrypoints/background/model-manager/model-manager.service', () => {
  const mockModelManagerInstance: Partial<ModelManager> = {
    summarizeText: vi.fn(() => Promise.resolve('Service summary.')),
    translate: vi.fn(() => Promise.resolve('Texto traducido.')),
    checkModelStatus: vi.fn(() => Promise.resolve({ state: 'available' as Availability })),
    downloadModel: vi.fn(),
  };
  return {
    ModelManager: {
      getInstance: () => mockModelManagerInstance
    }
  };
});

const aiService = new AIService();
const mockModelManagerInstance = vi.mocked(ModelManager.getInstance());
const modelStatusUpdateSpy = vi.fn();

describe('AIService', () => {
  beforeEach(() => {
    // `reset` reestablece `browser` a su estado original (incluyendo runtime,
    // que es la base de `onMessage`)
    fakeBrowser.reset();
    vi.spyOn(browser.notifications, 'create');
    removeMessageListeners();
    onMessage('modelStatusUpdate', modelStatusUpdateSpy);
  });

  it('should delegate summarizeText to ModelManager when model is available', async () => {
    const result = await aiService.processText('Text to summarize', {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      summarize: true
    });

    expect(result).toBe('Service summary.');
    expect(mockModelManagerInstance.checkModelStatus).toHaveBeenCalledWith({ type: 'summarization' });
    expect(mockModelManagerInstance.downloadModel).not.toHaveBeenCalled();
    expect(mockModelManagerInstance.summarizeText).toHaveBeenCalled();
  });

  it('should handle translation when model is available', async () => {
    mockModelManagerInstance.translate.mockResolvedValue('Texto traducido.');

    const processTextService = new AIService();

    const result = await processTextService.processText('Text to translate', {
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

    const processTextService = new AIService();

    const result = await processTextService.processText('Text to summarize', {
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

      const processTextService = new AIService();

      await processTextService.processText('Text to summarize', {
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

      const processTextService = new AIService();

      await processTextService.processText('Text to summarize', {
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

      const processTextService = new AIService();

      await expect(processTextService.processText('Text to summarize', {
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

      const processTextService = new AIService();

      const result = await processTextService.processText('Text to summarize', {
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
    beforeAll(() => {
      const mockSummarizerLanguageCodes = ['fr', 'zh', 'de'] as const;
      vi.spyOn(availableLanguagesModule, 'SUMMARIZER_LANGUAGE_CODES', 'get').mockReturnValue(mockSummarizerLanguageCodes as any);
    });
    beforeEach(() => {
    });
    it('should summarize directly when both languages are supported', async () => {
      mockModelManagerInstance.summarizeText.mockResolvedValue('Direct summary.');

      const processTextService = new AIService();

      const result = await processTextService.processText('Text to summarize', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      });

      expect(result).toBe('Direct summary.');
      expect(mockModelManagerInstance.translate).not.toHaveBeenCalled();
      expect(mockModelManagerInstance.summarizeText).toHaveBeenCalledWith('Text to summarize',
        expect.objectContaining({
          expectedInputLanguages: ['en'],
          outputLanguage: 'es'
        })
      );
    });

    it('should translate input to English and summarize when source language is not supported', async () => {
      mockModelManagerInstance.translate.mockResolvedValue('Translated to English.');
      mockModelManagerInstance.summarizeText.mockResolvedValue('Summary from translated text.');

      const processTextService = new AIService();

      const result = await processTextService.processText('Texto a resumir', {
        sourceLanguage: 'fr', // French not supported
        targetLanguage: 'es',
        summarize: true
      });

      expect(result).toBe('Summary from translated text.');
      expect(mockModelManagerInstance.translate).toHaveBeenCalledWith('Texto a resumir', 'fr', 'en');
      expect(mockModelManagerInstance.summarizeText).toHaveBeenCalledWith('Translated to English.',
        expect.objectContaining({
          expectedInputLanguages: ['en'],
          outputLanguage: 'es'
        })
      );
    });

    it('should summarize in English and translate summary when target language is not supported', async () => {
      mockModelManagerInstance.summarizeText.mockResolvedValue('English summary.');
      mockModelManagerInstance.translate.mockResolvedValue('Resumen traducido.');

      const processTextService = new AIService();

      const result = await processTextService.processText('Text to summarize', {
        sourceLanguage: 'en',
        targetLanguage: 'fr', // French not supported
        summarize: true
      });

      expect(result).toBe('Resumen traducido.');
      expect(mockModelManagerInstance.summarizeText).toHaveBeenCalledWith('Text to summarize',
        expect.objectContaining({
          expectedInputLanguages: ['en'],
          outputLanguage: 'en'
        })
      );
      expect(mockModelManagerInstance.translate).toHaveBeenCalledWith('English summary.', 'en', 'fr');
    });

    it('should translate input to English, summarize, and translate summary back when neither language is supported', async () => {
      mockModelManagerInstance.translate
        .mockResolvedValueOnce('Translated to English.') // Input translation
        .mockResolvedValueOnce('Resumen traducido.'); // Summary translation

      mockModelManagerInstance.summarizeText.mockResolvedValue('English summary.');

      const processTextService = new AIService();

      const result = await processTextService.processText('Texto en francés', {
        sourceLanguage: 'fr', // French not supported
        targetLanguage: 'de', // German not supported
        summarize: true
      });

      expect(result).toBe('Resumen traducido.');
      expect(mockModelManagerInstance.translate).toHaveBeenCalledTimes(2);
      expect(mockModelManagerInstance.translate).toHaveBeenNthCalledWith(1, 'Texto en francés', 'fr', 'en');
      expect(mockModelManagerInstance.translate).toHaveBeenNthCalledWith(2, 'English summary.', 'en', 'de');
      expect(mockModelManagerInstance.summarizeText).toHaveBeenCalledWith('Translated to English.',
        expect.objectContaining({
          expectedInputLanguages: ['en'],
          outputLanguage: 'en'
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

      const processTextService = new AIService();

      const result = await processTextService.processText('Text to translate', {
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

      const processTextService = new AIService();

      await processTextService.processText('Text to translate', {
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

      const processTextService = new AIService();

      await expect(processTextService.processText('Text to translate', {
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

      const processTextService = new AIService();

      const result = await processTextService.processText('Text to translate', {
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
