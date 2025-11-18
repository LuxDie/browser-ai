import { describe, it, expect, beforeEach, vi, type MockedObject } from 'vitest';
import { AIService } from '@/entrypoints/background/ai/ai.service';
import {
  onMessage,
  removeMessageListeners
} from '@/entrypoints/background/messaging';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';
import type { LanguageService } from '@/entrypoints/background/language/language.service';

// Mock ModelManager module
// TODO: usar importación dinámica
vi.mock('@/entrypoints/background/model-manager/model-manager.service', () => {
  return {
    ModelManager: {
      getInstance: () => mockModelManagerService
    }
  };
});

// Mock LanguageService module
vi.mock('@/entrypoints/background/language/language.service', () => {
  return {
    LanguageService: {
      getInstance: () => mockLanguageService
    }
  };
});

const mockLanguageService: MockedObject<Pick<LanguageService, 'getSummarizerLanguageCodes' | 'isSummarizerLanguage'>> = {
  getSummarizerLanguageCodes: vi.fn(() => ['en', 'es', 'ja'] as const),
  isSummarizerLanguage: vi.fn(() => true) as any,
};

const mockModelManagerService: MockedObject<Pick<ModelManager, 'summarize' | 'translate' | 'checkModelStatus' | 'downloadModel'>> = {
  summarize: vi.fn(() => Promise.resolve('Texto resumido.')),
  translate: vi.fn(() => Promise.resolve('Texto traducido.')),
  checkModelStatus: vi.fn(() => Promise.resolve({ state: 'available' as const })),
  downloadModel: vi.fn(),
};

const modelStatusUpdateSpy = vi.fn();

describe('AIService', () => {
  let aIService: AIService;
  beforeEach(() => {
    aIService = new AIService();
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

    expect(mockModelManagerService.checkModelStatus).toHaveBeenCalledWith({ type: 'summarization' });
    expect(mockModelManagerService.downloadModel).not.toHaveBeenCalled();
    expect(mockModelManagerService.summarize).toHaveBeenCalled();
  });

  it('should follow the correct flow when translation model is available', async () => {
    mockModelManagerService.translate.mockResolvedValue('Texto traducido.');

    const result = await aIService.processText('Texto a traducir', {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      summarize: false
    });

    expect(result).toBe('Texto traducido.');
    expect(mockModelManagerService.checkModelStatus).toHaveBeenCalledWith({
      type: 'translation',
      source: 'en',
      target: 'es'
    });
    expect(mockModelManagerService.downloadModel).not.toHaveBeenCalled();
    expect(mockModelManagerService.translate).toHaveBeenCalledWith('Texto a traducir', 'en', 'es', expect.anything());
  });

  it('should download model and send status messages when summarization model is downloadable', async () => {
    // Mock model downloadable
    mockModelManagerService.checkModelStatus.mockResolvedValueOnce({
      state: 'downloadable'
    });
    // Mock successful download
    mockModelManagerService.downloadModel.mockResolvedValueOnce({
      state: 'available'
    });
    mockModelManagerService.summarize.mockResolvedValueOnce('Resumen descargado.');

    const result = await aIService.processText('Texto a resumir', {
      sourceLanguage: 'en',
      targetLanguage: 'es',
      summarize: true
    });

    expect(result).toBe('Resumen descargado.');
    expect(mockModelManagerService.checkModelStatus).toHaveBeenCalledWith({ type: 'summarization' });
    expect(mockModelManagerService.downloadModel).toHaveBeenCalledWith({ type: 'summarization' }, expect.any(Function), expect.any(Object));
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
    expect(mockModelManagerService.summarize).toHaveBeenCalledWith('Texto a resumir',
      expect.objectContaining({
        expectedInputLanguages: ['en'],
        outputLanguage: 'es'
      }),
      expect.any(Object)
    );
  });

  describe('AIService - model status messages', () => {
    it('should send downloading and available messages when summarization model needs to be downloaded', async () => {
      // Mock model not available initially
      mockModelManagerService.checkModelStatus.mockResolvedValueOnce({
        state: 'downloadable'
      });
      // Mock successful download
      mockModelManagerService.downloadModel.mockResolvedValueOnce({
        state: 'available'
      });
      mockModelManagerService.summarize.mockResolvedValueOnce('Resumen descargado.');

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
      mockModelManagerService.summarize.mockResolvedValueOnce('Resumen disponible.');

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
      mockModelManagerService.checkModelStatus.mockResolvedValueOnce({
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
      mockModelManagerService.checkModelStatus.mockResolvedValueOnce({
        state: 'downloadable'
      });
      // Mock failed download - throws error
      mockModelManagerService.downloadModel.mockRejectedValueOnce(new Error(downloadFailedMessage));

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
      mockModelManagerService.checkModelStatus.mockResolvedValueOnce({
        state: 'downloading'
      });
      mockModelManagerService.summarize.mockResolvedValueOnce(downloadingSummary);

      const result = await aIService.processText('Texto a resumir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      });

      expect(result).toBe(downloadingSummary);
      expect(mockModelManagerService.downloadModel).not.toHaveBeenCalled();
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
      mockLanguageService.getSummarizerLanguageCodes.mockReturnValue(mockSummarizerLanguageCodes as any);
    });
    it('should summarize directly when both languages are supported', async () => {
      mockLanguageService.isSummarizerLanguage.mockReturnValueOnce(true);
      mockLanguageService.isSummarizerLanguage.mockReturnValueOnce(true);

      mockModelManagerService.summarize.mockResolvedValueOnce('Resumen directo.');
      const supportedSourceLang = 'fr';
      const supportedTargetLang = 'zh';

      const result = await aIService.processText('Texto a resumir', {
        sourceLanguage: supportedSourceLang,
        targetLanguage: supportedTargetLang,
        summarize: true
      });

      expect(result).toBe('Resumen directo.');
      expect(mockModelManagerService.translate).not.toHaveBeenCalled();
      expect(mockModelManagerService.summarize).toHaveBeenCalledWith('Texto a resumir',
        expect.objectContaining({
          expectedInputLanguages: [supportedSourceLang],
          outputLanguage: supportedTargetLang
        }),
        expect.anything()
      );
    });

    it('should translate input to fallback language and summarize when source language is not supported', async () => {
      mockLanguageService.isSummarizerLanguage.mockReturnValueOnce(false);
      mockLanguageService.isSummarizerLanguage.mockReturnValueOnce(true);

      mockModelManagerService.translate.mockResolvedValue('Traducido a respaldo.');
      mockModelManagerService.summarize.mockResolvedValue('Resumen de texto traducido.');
      const unsupportedSourceLang = 'en';
      const supportedTargetLang = 'de';

      const result = await aIService.processText('Texto a resumir', {
        sourceLanguage: unsupportedSourceLang,
        targetLanguage: supportedTargetLang,
        summarize: true
      });

      expect(result).toBe('Resumen de texto traducido.');
      expect(mockModelManagerService.translate).toHaveBeenCalledWith('Texto a resumir', unsupportedSourceLang, fallbackLang, expect.any(Object));
      expect(mockModelManagerService.summarize).toHaveBeenCalledWith('Traducido a respaldo.',
        expect.objectContaining({
          expectedInputLanguages: [fallbackLang],
          outputLanguage: supportedTargetLang
        }),
        expect.any(Object)
      );
    });

    it('should summarize directly and translate summary when target language is not supported', async () => {
      mockLanguageService.isSummarizerLanguage.mockReturnValueOnce(true);
      mockLanguageService.isSummarizerLanguage.mockReturnValueOnce(false);

      mockModelManagerService.summarize.mockResolvedValue('Resumen en respaldo.');
      mockModelManagerService.translate.mockResolvedValue('Resumen traducido.');
      const supportedSourceLang = 'fr';
      const unsupportedTargetLang = 'en';
      const fallbackLang = 'fr'; // Use the same fallback as in this test context

      const result = await aIService.processText('Texto a resumir', {
        sourceLanguage: supportedSourceLang,
        targetLanguage: unsupportedTargetLang,
        summarize: true
      });

      expect(result).toBe('Resumen traducido.');
      expect(mockModelManagerService.summarize).toHaveBeenCalledWith('Texto a resumir',
        expect.objectContaining({
          expectedInputLanguages: [supportedSourceLang],
          outputLanguage: fallbackLang
        }),
        expect.any(Object)
      );
      expect(mockModelManagerService.translate).toHaveBeenCalledWith('Resumen en respaldo.', fallbackLang, unsupportedTargetLang, {});
    });

    it('should translate to fallback language, summarize, and translate summary back when neither language is supported', async () => {
      mockLanguageService.isSummarizerLanguage.mockReturnValueOnce(false); // source 'es'
      mockLanguageService.isSummarizerLanguage.mockReturnValueOnce(false); // target 'it'

      mockModelManagerService.translate
        .mockResolvedValueOnce('Traducido a respaldo.') // Input translation
        .mockResolvedValueOnce('Resumen traducido.'); // Summary translation

      mockModelManagerService.summarize.mockResolvedValue('Resumen en respaldo.');

      const unsupportedSourceLang = 'es';
      const unsupportedTargetLang = 'it';
      const fallbackLang = 'fr';

      const result = await aIService.processText('Texto en español', {
        sourceLanguage: unsupportedSourceLang,
        targetLanguage: unsupportedTargetLang,
        summarize: true
      });

      expect(result).toBe('Resumen traducido.');
      expect(mockModelManagerService.translate).toHaveBeenCalledTimes(2);
      expect(mockModelManagerService.translate).toHaveBeenNthCalledWith(1, 'Texto en español', unsupportedSourceLang, fallbackLang, expect.any(Object));
      expect(mockModelManagerService.translate).toHaveBeenNthCalledWith(2, 'Resumen en respaldo.', fallbackLang, unsupportedTargetLang, expect.any(Object));
      expect(mockModelManagerService.summarize).toHaveBeenCalledWith('Traducido a respaldo.',
        expect.objectContaining({
          expectedInputLanguages: [fallbackLang],
          outputLanguage: fallbackLang
        }),
        expect.any(Object)
      );
    });
  });

  describe('AIService - translation', () => {
    it('should download translation model and send status messages when model requires download', async () => {
      // Mock model not available initially
      mockModelManagerService.checkModelStatus.mockResolvedValue({
        state: 'downloadable'
      });
      // Mock successful download
      mockModelManagerService.downloadModel.mockResolvedValue({
        state: 'available'
      });
      mockModelManagerService.translate.mockResolvedValue('Texto descargado y traducido.');

      const result = await aIService.processText('Texto a traducir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      });

      expect(result).toBe('Texto descargado y traducido.');
      expect(mockModelManagerService.checkModelStatus).toHaveBeenCalledWith({
        type: 'translation',
        source: 'en',
        target: 'es'
      });
      expect(mockModelManagerService.downloadModel).toHaveBeenCalledWith({
        type: 'translation',
        source: 'en',
        target: 'es'
      }, expect.any(Function), expect.any(Object));
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
      expect(mockModelManagerService.translate).toHaveBeenCalledWith('Texto a traducir', 'en', 'es', expect.any(Object));
    });

    it('should send translation completion notification', async () => {
      // Mock model not available initially
      mockModelManagerService.checkModelStatus.mockResolvedValue({
        state: 'downloadable'
      });
      // Mock successful download
      mockModelManagerService.downloadModel.mockResolvedValue({
        state: 'available'
      });
      mockModelManagerService.translate.mockResolvedValue('Texto traducido.');

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

    it('should NOT send notification when translation model is already available', async () => {
      // Mock model available
      mockModelManagerService.checkModelStatus.mockResolvedValue({
        state: 'available'
      });
      mockModelManagerService.translate.mockResolvedValue('Texto traducido.');

      await aIService.processText('Texto a traducir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      });

      // Verify browser notification was NOT created
      expect(browser.notifications.create).not.toHaveBeenCalled();
    });

    it('should throw error when translation model check fails', async () => {
      // Clear default mock and set specific one for this test
      const translationApiNotSupportedMessage = 'API de traducción no soportada';
      mockModelManagerService.checkModelStatus.mockResolvedValue({
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
      mockModelManagerService.checkModelStatus.mockResolvedValue({
        state: 'downloadable'
      });
      // Mock failed download - throws error
      mockModelManagerService.downloadModel.mockRejectedValue(new Error(translationDownloadFailedMessage));

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

    it('should send progress update messages during model download', async () => {
      // Mock model downloadable
      mockModelManagerService.checkModelStatus.mockResolvedValueOnce({
        state: 'downloadable'
      });

      // Mock downloadModel to call the progress callback
      mockModelManagerService.downloadModel.mockImplementationOnce((_config, progressCallback) => {
        // Simulate calling the progress callback with 50% progress
        if (progressCallback) {
          const mockMonitor: Pick<CreateMonitor, 'addEventListener'> = {
            addEventListener: vi.fn((event, listener) => {
              if (event === 'downloadprogress') {
                // Simulate progress event
                listener({ loaded: 0.5 });
              }
            })
          };
          progressCallback(mockMonitor as CreateMonitor);
        }
        return Promise.resolve({ state: 'available' });
      });

      mockModelManagerService.summarize.mockResolvedValueOnce('Resumen descargado.');

      await aIService.processText('Texto a resumir', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      });

      // Should have called modelStatusUpdate 3 times:
      // 1. downloading started
      // 2. progress update (50%)
      // 3. download completed
      expect(modelStatusUpdateSpy).toHaveBeenCalledTimes(3);

      // First message: downloading started
      expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'downloading'
          })
        })
      );

      // Second message: progress update
      expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'downloading',
            downloadProgress: 50
          })
        })
      );

      // Third message: download completed
      expect(modelStatusUpdateSpy).toHaveBeenNthCalledWith(3,
        expect.objectContaining({
          data: expect.objectContaining({
            state: 'available'
          })
        })
      );
    });
  });
});
