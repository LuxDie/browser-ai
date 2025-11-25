import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from './ai.service';
import {
  onMessage,
  removeMessageListeners
} from '@/entrypoints/background/messaging';
import { flushPromises } from '@vue/test-utils';
import { ModelManager } from '../model-manager/model-manager.service';

// Mock dependencies
const mockModelManager = {
  checkModelStatus: vi.fn(),
  downloadModel: vi.fn<ModelManager['downloadModel']>(() => Promise.resolve({ state: 'available' })),
  translate: vi.fn(),
  summarize: vi.fn(),
  detectLanguage: vi.fn(),
};

vi.mock('@/entrypoints/background/model-manager/model-manager.service', () => ({
  ModelManager: {
    getInstance: () => mockModelManager
  }
}));

vi.mock('../language/language.service', () => ({
  LanguageService: {
    getInstance: () => ({
      getSummarizerLanguageCodes: () => ['en'],
      isSummarizerLanguage: (lang: string) => lang === 'en'
    })
  }
}));

const modelStatusUpdateSpy = vi.fn();

describe('AIService Cancellation', () => {
  let aiService: AIService;

  beforeEach(() => {
    fakeBrowser.reset();
    removeMessageListeners();
    onMessage('modelStatusUpdate', modelStatusUpdateSpy);

    aiService = new AIService();
    mockModelManager.checkModelStatus.mockResolvedValue({ state: 'available' });
  });

  describe('Translation cancellation', () => {
    it('should pass abort signal to translate operation', async () => {
      mockModelManager.translate.mockResolvedValue('translated');

      await aiService.processText('test', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      });

      expect(mockModelManager.translate).toHaveBeenCalledWith(
        'test',
        'en',
        'es',
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });
  });

  describe('Summarization cancellation', () => {
    it('should pass abort signal to summarize operation', async () => {
      mockModelManager.summarize.mockResolvedValue('summarized');

      await aiService.processText('test', {
        sourceLanguage: 'en',
        targetLanguage: 'en',
        summarize: true
      });

      expect(mockModelManager.summarize).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          expectedInputLanguages: ['en'],
          outputLanguage: 'en'
        }),
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });

    it('should pass abort signal to intermediate translation before summarization', async () => {
      mockModelManager.translate.mockResolvedValue('translated to en');
      mockModelManager.summarize.mockResolvedValue('summarized');

      await aiService.processText('test', {
        sourceLanguage: 'es',
        targetLanguage: 'en',
        summarize: true
      });

      // Debe traducir primero a inglés (idioma soportado por summarizer)
      expect(mockModelManager.translate).toHaveBeenCalledWith(
        'test',
        'es',
        'en',
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });

    it('should pass abort signal to translation after summarization', async () => {
      mockModelManager.summarize.mockResolvedValue('summarized');
      mockModelManager.translate.mockResolvedValue('translated to es');

      await aiService.processText('test', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: true
      });

      // Debe traducir el resumen a español
      expect(mockModelManager.translate).toHaveBeenCalledWith(
        'summarized',
        'en',
        'es',
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });
  });

  describe('Language detection cancellation', () => {
    it('should pass abort signal to detectLanguage operation', async () => {
      mockModelManager.detectLanguage.mockResolvedValue('en');

      await aiService.detectLanguage('test');

      expect(mockModelManager.detectLanguage).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });
  });

  describe('Model download cancellation', () => {
    it('should pass abort signal to downloadModel operation', async () => {
      mockModelManager.checkModelStatus.mockResolvedValue({ state: 'downloadable' });
      mockModelManager.downloadModel.mockResolvedValue({ state: 'available' });
      mockModelManager.translate.mockResolvedValue('translated');

      await aiService.processText('test', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      });

      expect(mockModelManager.downloadModel).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function),
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });

    it('should cancel ongoing operations when cancelProcessing is called', async () => {
      mockModelManager.checkModelStatus.mockResolvedValue({ state: 'downloadable' });
      let signal: AbortSignal | undefined;
      mockModelManager.downloadModel.mockImplementation((_config, _monitor, options) => {
        signal = options!.signal;
        return Promise.resolve({ state: 'available' });
      });

      // Iniciar el procesamiento
      void aiService.processText('test', {
        sourceLanguage: 'en',
        targetLanguage: 'es',
        summarize: false
      });
      await flushPromises();

      expect(mockModelManager.downloadModel).toHaveBeenCalled();
      expect(signal!.aborted).toBe(false);
      aiService.cancelProcessing();
      expect(signal!.aborted).toBe(true);
    });
  });
});
