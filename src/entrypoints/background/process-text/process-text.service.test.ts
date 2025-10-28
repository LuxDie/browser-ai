import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessTextService } from '@/entrypoints/background/process-text/process-text.service';
import {
  onMessage,
  removeMessageListeners
} from '@/entrypoints/background/messaging';
import { fakeBrowser } from '@webext-core/fake-browser';
import { browser } from 'wxt/browser';

// Mock ModelManager module
vi.mock('@/entrypoints/background/model-manager/model-manager.service', () => ({
  ModelManager: {
    getInstance: vi.fn()
  }
}));

// Now import and configure the mock
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';

// Create mock methods
const mockSummarizeText = vi.fn();
const mockTranslate = vi.fn();
const mockCheckModelStatus = vi.fn();
const mockDownloadModel = vi.fn();

// Configure the mock instance
const mockModelManagerInstance = {
  summarizeText: mockSummarizeText,
  translate: mockTranslate,
  checkModelStatus: mockCheckModelStatus,
  downloadModel: mockDownloadModel
};

(ModelManager.getInstance as any) = vi.fn().mockReturnValue(mockModelManagerInstance);

describe('ProcessTextService', () => {
  let modelStatusUpdateSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeBrowser.reset();

    vi.spyOn(browser.notifications, 'create');

    // Clean up previous message listeners and register new spy
    removeMessageListeners();
    modelStatusUpdateSpy = vi.fn();
    onMessage('modelStatusUpdate', modelStatusUpdateSpy);
  });

  beforeEach(() => {
    // Default mock behavior - model is available
    mockCheckModelStatus.mockResolvedValue({
      state: 'available'
    });
    mockTranslate.mockResolvedValue('Texto traducido.');
    mockSummarizeText.mockResolvedValue('Service summary.');
  });

  it('should delegate summarizeText to ModelManager when model is available', async () => {
    const processTextService = new ProcessTextService();

    const result = await processTextService.processText('Text to summarize', {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      summarize: true
    });

    expect(result).toBe('Service summary.');
    expect(mockCheckModelStatus).toHaveBeenCalledWith({ type: 'summarization' });
    expect(mockDownloadModel).not.toHaveBeenCalled();
    expect(mockSummarizeText).toHaveBeenCalledWith('Text to summarize', {
      expectedInputLanguages: ['en'],
      outputLanguage: 'es'
    });
  });

  it('should handle translation when model is available', async () => {
    mockTranslate.mockResolvedValue('Texto traducido.');

    const processTextService = new ProcessTextService();

    const result = await processTextService.processText('Text to translate', {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      summarize: false
    });

    expect(result).toBe('Texto traducido.');
    expect(mockCheckModelStatus).toHaveBeenCalledWith({
      type: 'translation',
      source: 'en',
      target: 'es'
    });
    expect(mockDownloadModel).not.toHaveBeenCalled();
    expect(mockTranslate).toHaveBeenCalledWith('Text to translate', 'en', 'es');
  });

  it('should download model and send status messages when summarization model is downloadable', async () => {
    // Mock model downloadable
    mockCheckModelStatus.mockResolvedValue({
      state: 'downloadable'
    });
    // Mock successful download
    mockDownloadModel.mockResolvedValue({
      state: 'available'
    });
    mockSummarizeText.mockResolvedValue('Downloaded summary.');

    const processTextService = new ProcessTextService();

    const result = await processTextService.processText('Text to summarize', {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      summarize: true
    });

    expect(result).toBe('Downloaded summary.');
    expect(mockCheckModelStatus).toHaveBeenCalledWith({ type: 'summarization' });
    expect(mockDownloadModel).toHaveBeenCalledWith({ type: 'summarization' });
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
    expect(mockSummarizeText).toHaveBeenCalledWith('Text to summarize', {
      expectedInputLanguages: ['en'],
      outputLanguage: 'es'
    });
  });

  describe('ProcessTextService - model status messages', () => {
    it('should send downloading and available messages when summarization model needs to be downloaded', async () => {
      // Mock model not available initially
      mockCheckModelStatus.mockResolvedValueOnce({
        state: 'downloading'
      });
      // Mock successful download
      mockDownloadModel.mockResolvedValueOnce({
        state: 'available'
      });
      mockSummarizeText.mockResolvedValueOnce('Downloaded summary.');

      const processTextService = new ProcessTextService();

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
      mockSummarizeText.mockResolvedValueOnce('Available summary.');

      const processTextService = new ProcessTextService();

      await processTextService.processText('Text to summarize', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      });

      expect(modelStatusUpdateSpy).not.toHaveBeenCalled();
    });

    it('should throw error when Chrome AI Summarizer API is not available', async () => {
      // Mock API not available
      mockCheckModelStatus.mockResolvedValueOnce({
        state: 'unavailable',
        errorMessage: 'Chrome AI Summarizer APIs no disponibles para descarga'
      });

      const processTextService = new ProcessTextService();

      await expect(processTextService.processText('Text to summarize', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      })).rejects.toThrow('Chrome AI Summarizer APIs no disponibles para descarga');

      expect(modelStatusUpdateSpy).not.toHaveBeenCalled();
    });

    it('should send downloading and error messages when summarization model download fails', async () => {
      // Mock model not available initially
      mockCheckModelStatus.mockResolvedValueOnce({
        state: 'downloadable'
      });
      // Mock failed download - model still not available
      mockDownloadModel.mockResolvedValueOnce({
        state: 'unavailable',
        errorMessage: 'Download failed'
      });

      const processTextService = new ProcessTextService();

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

  describe('ProcessTextService - translation', () => {
    it('should download translation model and send status messages when model requires download', async () => {
      // Mock model not available initially
      mockCheckModelStatus.mockResolvedValue({
        state: 'downloadable'
      });
      // Mock successful download
      mockDownloadModel.mockResolvedValue({
        state: 'available'
      });
      mockTranslate.mockResolvedValue('Texto descargado y traducido.');

      const processTextService = new ProcessTextService();

      const result = await processTextService.processText('Text to translate', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      });

      expect(result).toBe('Texto descargado y traducido.');
      expect(mockCheckModelStatus).toHaveBeenCalledWith({
        type: 'translation',
        source: 'en',
        target: 'es'
      });
      expect(mockDownloadModel).toHaveBeenCalledWith({
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
      expect(mockTranslate).toHaveBeenCalledWith('Text to translate', 'en', 'es');
    });

    it('should send translation completion notification', async () => {
      // Mock model not available initially
      mockCheckModelStatus.mockResolvedValue({
        state: 'downloadable'
      });
      // Mock successful download
      mockDownloadModel.mockResolvedValue({
        state: 'available'
      });
      mockTranslate.mockResolvedValue('Texto traducido.');

      const processTextService = new ProcessTextService();

      await processTextService.processText('Text to translate', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      });

      // Verify browser notification was created
      expect(browser.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'La traducción se ha completado'
        })
      );
    });

    it('should throw error when translation model check fails', async () => {
      // Clear default mock and set specific one for this test
      mockCheckModelStatus.mockReset();
      mockCheckModelStatus.mockResolvedValue({
        state: 'unavailable',
        errorMessage: 'Translation API not supported'
      });

      const processTextService = new ProcessTextService();

      await expect(processTextService.processText('Text to translate', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      })).rejects.toThrow('Translation API not supported');

      expect(modelStatusUpdateSpy).not.toHaveBeenCalled();
      expect(mockTranslate).not.toHaveBeenCalled();
    });

    it('should handle failed translation model download', async () => {
      // Mock model not available initially
      mockCheckModelStatus.mockResolvedValue({
        state: 'downloadable'
      });
      // Mock failed download - model still not available
      mockDownloadModel.mockResolvedValue({
        state: 'unavailable',
        errorMessage: 'Translation download failed'
      });

      const processTextService = new ProcessTextService();

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
