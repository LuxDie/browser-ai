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
      const apiError = 'API Error';
      vi.mocked(Summarizer.availability).mockRejectedValueOnce(new Error(apiError));

      await expect(modelManager.checkModelStatus({ type: 'summarization' })).rejects.toThrow(apiError);
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
      expect(Summarizer.create).toHaveBeenCalledWith({});
    });

    it('should handle download errors gracefully', async () => {
      const downloadError = 'Descarga fallida';
      vi.mocked(Summarizer.create).mockRejectedValueOnce(new Error(downloadError));

      await expect(modelManager.downloadModel({ type: 'summarization' })).rejects.toThrow(downloadError);
    });

    it('should throw error when Summarizer API is not available', async () => {
      vi.stubGlobal('Summarizer', undefined);

      const modelManager = new ModelManager();

      await expect(modelManager.downloadModel({ type: 'summarization' })).rejects.toThrow('summarizerAPINotSupported');
    });

    it('should pass progress callback to summarizer create when provided', async () => {
      vi.mocked(Summarizer.availability).mockResolvedValueOnce('downloadable');
      const mockProgressCallback = vi.fn();

      await modelManager.downloadModel({ type: 'summarization' }, mockProgressCallback);

      expect(Summarizer.create).toHaveBeenCalledWith(
        expect.objectContaining({ monitor: mockProgressCallback })
      );
    });

    it('should not pass monitor to summarizer create when no progress callback provided', async () => {
      vi.mocked(Summarizer.availability).mockResolvedValueOnce('downloadable');

      await modelManager.downloadModel({ type: 'summarization' });

      expect(Summarizer.create).toHaveBeenCalledWith({});
    });
  });

  describe('summarize', () => {
    it('should summarize text successfully', async () => {
      const mockSummarizer: Pick<Summarizer, 'summarize'> = {
        summarize: vi.fn(() => Promise.resolve('Este es un resumen.'))
      };
      vi.mocked(Summarizer.create).mockResolvedValueOnce(mockSummarizer as Summarizer);

      const result = await modelManager.summarize('Este es un texto largo que necesita ser resumido.');

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

      await modelManager.summarize('Texto largo aquí', options);

      expect(Summarizer.create).toHaveBeenCalledWith(
        expect.objectContaining(options)
      );
    });

    it('should handle summarization errors gracefully', async () => {
      const summarizationError = 'Resumen fallido';
      const mockSummarizer: Pick<Summarizer, 'summarize'> = {
        summarize: vi.fn(() => Promise.reject(new Error(summarizationError))),
      };
      vi.mocked(Summarizer.create).mockResolvedValueOnce(mockSummarizer as Summarizer);

      await expect(modelManager.summarize('Texto a resumir')).rejects.toThrow(summarizationError);
    });

    it('should return error when Summarizer API is not available', async () => {
      vi.stubGlobal('Summarizer', undefined);

      const modelManager = new ModelManager();

      await expect(modelManager.summarize('Texto a resumir'))
      .rejects.toThrow('summarizerAPINotSupported');
    });
  });
});
