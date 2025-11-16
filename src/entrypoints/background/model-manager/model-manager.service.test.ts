import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';

describe('ModelManager - Summarization Features', () => {
  let modelManager: ModelManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset ModelManager singleton for each test
    modelManager = new ModelManager();
    vi.spyOn(ModelManager, 'getInstance').mockReturnValue(modelManager);

  });

  describe('checkModelStatus', () => {
    it('should return available status when summarizer model is available', async () => {
      vi.mocked(Summarizer.availability).mockResolvedValueOnce('available');
      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('available');
    });

    it('should return downloadable status when summarizer model is downloadable', async () => {
      vi.mocked(Summarizer.availability).mockResolvedValueOnce('downloadable');

      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('downloadable');
    });

    it('should return downloading status when summarizer model is downloading', async () => {
      vi.mocked(Summarizer.availability).mockResolvedValueOnce('downloading');

      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('downloading');
      expect(result.downloadProgress).toBe(0);
    });

    it('should return error when summarizer model is not available', async () => {
      vi.mocked(Summarizer.availability).mockResolvedValueOnce('unavailable');

      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('unavailable');
      expect(result.errorMessage).toBe('summarizerModelNotAvailable');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(Summarizer.availability).mockRejectedValueOnce(new Error('API Error'));

      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('unavailable');
      expect(result.errorMessage).toBe('errorCheckingModelAvailability');
    });

    it('should return error when Summarizer API is not available', async () => {
      vi.stubGlobal('Summarizer', undefined);

      modelManager = new ModelManager();
      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('unavailable');
      expect(result.errorMessage).toBe('summarizerAPINotAvailable');
    });
  });

  describe('downloadModel', () => {
    it('should download summarizer model successfully', async () => {
      vi.mocked(Summarizer.availability).mockResolvedValueOnce('downloadable');
      const result = await modelManager.downloadModel({ type: 'summarization' });

      expect(result.state).toBe('available');
      expect(Summarizer.create).toHaveBeenCalled();
    });

    it('should handle download errors gracefully', async () => {
      // TODO: manejar rechazo con `rejects.toThrow`
      vi.mocked(Summarizer.create).mockRejectedValueOnce(new Error('Descarga fallida'));

      const result = await modelManager.downloadModel({ type: 'summarization' });

      expect(result.state).toBe('unavailable');
      expect(result.errorMessage).toBe('errorDownloadingSummarizerModel');
    });

    it('should return error when Summarizer API is not available', async () => {
      vi.stubGlobal('Summarizer', undefined);

      const modelManager = new ModelManager();
      const result = await modelManager.downloadModel({ type: 'summarization' });

      expect(result.state).toBe('unavailable');
      expect(result.errorMessage).toBe('summarizerAPINotSupported');
    });
  });

  describe('summarizeText', () => {
    it('should summarize text successfully', async () => {
      const mockSummarizer: Pick<Summarizer, 'summarize'> = {
        summarize: vi.fn(() => Promise.resolve('Este es un resumen.'))
      };
      vi.mocked(Summarizer.create).mockResolvedValueOnce(mockSummarizer as Summarizer);

      const result = await modelManager.summarizeText('Este es un texto largo que necesita ser resumido.');

      expect(result).toBe('Este es un resumen.');
      expect(mockSummarizer.summarize).toHaveBeenCalledWith('Este es un texto largo que necesita ser resumido.');
    });

    it('should handle custom summarizer options', async () => {
      const options = {
        type: 'key-points' as const,
        length: 'short' as const,
        expectedInputLanguages: ['en' as const],
        outputLanguage: 'es' as const
      };

      await modelManager.summarizeText('Texto largo aquí', options);

      expect(Summarizer.create).toHaveBeenCalledWith(
        expect.objectContaining(options)
      );
    });

    it('should handle summarization errors gracefully', async () => {
      const mockSummarizer: Pick<Summarizer, 'summarize'> = {
        summarize: vi.fn(() => Promise.reject(new Error('Resumen fallido'))),
      };
      vi.mocked(Summarizer.create).mockResolvedValueOnce(mockSummarizer as Summarizer);

      const result = await modelManager.summarizeText('Texto a resumir');

      expect(result).toBe('errorGeneratingSummary');
    });

    it('should return error when Summarizer API is not available', async () => {
      vi.stubGlobal('Summarizer', undefined);

      const modelManager = new ModelManager();

      await expect(modelManager.summarizeText('Texto a resumir'))
      .rejects.toThrow('summarizerAPINotSupportedError');
    });
  });
});
