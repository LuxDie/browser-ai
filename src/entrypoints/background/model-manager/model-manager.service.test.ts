import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';
import {
  createAIMock,
  setupAIMock,
  createSummarizerMock,
  createSummarizerErrorMock,
} from '@/tests/mocks';

// Mock de las APIs de IA antes de importar los módulos
const mockAI = createAIMock();
setupAIMock(mockAI);

describe('ModelManager - Summarization Features', () => {
  let modelManager: ModelManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset ModelManager singleton for each test
    modelManager = new ModelManager();
    vi.spyOn(ModelManager, 'getInstance').mockReturnValue(modelManager);
  });

  describe('checkModelAvailability', () => {
    it('should return available status when summarizer API is available', async () => {
      const result = await modelManager.checkModelAvailability({ type: 'summarization' });

      expect(result.available).toBe(true);
      expect(result.downloading).toBe(false);
      expect(mockAI.Summarizer.availability).toHaveBeenCalledWith({
        type: 'tldr',
        length: 'medium',
        format: 'plain-text'
      });
    });

    it('should return downloadable status when summarizer API is downloadable', async () => {
      mockAI.Summarizer.availability.mockResolvedValueOnce('downloadable');

      const result = await modelManager.checkModelAvailability({ type: 'summarization' });

      expect(result.available).toBe(false);
      expect(result.downloading).toBe(false);
      expect(result.error).toContain('descargable pero no disponible localmente');
    });

    it('should return downloading status when summarizer API is downloading', async () => {
      mockAI.Summarizer.availability.mockResolvedValueOnce('downloading');

      const result = await modelManager.checkModelAvailability({ type: 'summarization' });

      expect(result.available).toBe(false);
      expect(result.downloading).toBe(true);
      expect(result.progress).toBe(0);
    });

    it('should return error when summarizer API is not available', async () => {
      mockAI.Summarizer.availability.mockResolvedValueOnce('unavailable');

      const result = await modelManager.checkModelAvailability({ type: 'summarization' });

      expect(result.available).toBe(false);
      expect(result.downloading).toBe(false);
      expect(result.error).toContain('no soportado');
    });

    it('should handle custom summarizer options', async () => {
      const customOptions = { type: 'key-points' as const, length: 'short' as const };

      await modelManager.checkModelAvailability({ type: 'summarization', options: customOptions });

      expect(mockAI.Summarizer.availability).toHaveBeenCalledWith({
        type: 'key-points',
        length: 'short',
        format: 'plain-text'
      });
    });

    it('should handle API errors gracefully', async () => {
      mockAI.Summarizer.availability.mockRejectedValueOnce(new Error('API Error'));

      const result = await modelManager.checkModelAvailability({ type: 'summarization' });

      expect(result.available).toBe(false);
      expect(result.downloading).toBe(false);
      expect(result.error).toContain('Error al verificar la disponibilidad del summarizer');
    });

    it('should return error when Summarizer API is not available', async () => {
      const mockAIWithoutSummarizer = createAIMock();
      delete (mockAIWithoutSummarizer as any).Summarizer;
      vi.stubGlobal('self', mockAIWithoutSummarizer);

      const result = await modelManager.checkModelAvailability({ type: 'summarization' });

      expect(result.available).toBe(false);
      expect(result.error).toContain('Chrome AI Summarizer APIs no disponibles');

      // Restore the global mock
      vi.stubGlobal('self', mockAI);
    });
  });

  describe('downloadModel', () => {
    it('should download summarizer model successfully', async () => {
      const result = await modelManager.downloadModel({ type: 'summarization' });

      expect(result.available).toBe(true);
      expect(result.downloading).toBe(false);
      expect(mockAI.Summarizer.create).toHaveBeenCalledWith({
        type: 'tldr',
        length: 'medium',
        format: 'plain-text'
      });
    });

    it('should handle download errors gracefully', async () => {
      mockAI.Summarizer.create.mockRejectedValueOnce(new Error('Download failed'));

      const result = await modelManager.downloadModel({ type: 'summarization' });

      expect(result.available).toBe(false);
      expect(result.downloading).toBe(false);
      expect(result.error).toContain('Error al descargar el modelo de resumen');
    });

    it('should return error when Summarizer API is not available', async () => {
      const mockAIWithoutSummarizer = createAIMock();
      delete (mockAIWithoutSummarizer as any).Summarizer;
      vi.stubGlobal('self', mockAIWithoutSummarizer);

      const result = await modelManager.downloadModel({ type: 'summarization' });

      expect(result.available).toBe(false);
      expect(result.error).toContain('Chrome AI Summarizer APIs no disponibles para descarga');

      // Restore the global mock
      vi.stubGlobal('self', mockAI);
    });
  });

  describe('summarizeText', () => {
    it('should summarize text successfully', async () => {
      const mockSummarizer = createSummarizerMock('This is a summary.');
      mockAI.Summarizer.create.mockResolvedValue(mockSummarizer);

      const result = await modelManager.summarizeText('This is a long text that needs to be summarized.');

      expect(result).toBe('This is a summary.');
      expect(mockSummarizer.summarize).toHaveBeenCalledWith('This is a long text that needs to be summarized.');
    });

    it('should handle custom summarizer options', async () => {
      const mockSummarizer = createSummarizerMock('Key points summary.');
      mockAI.Summarizer.create.mockResolvedValue(mockSummarizer);

      const options = { type: 'key-points' as const, length: 'short' as const };

      await modelManager.summarizeText('Long text here', options);

      expect(mockAI.Summarizer.create).toHaveBeenCalledWith({
        type: 'key-points',
        length: 'short',
        format: 'plain-text'
      });
    });

    it('should handle summarization errors gracefully', async () => {
      const mockSummarizer = createSummarizerErrorMock('Summarization failed');
      mockAI.Summarizer.create.mockResolvedValue(mockSummarizer);

      const result = await modelManager.summarizeText('Text to summarize');

      expect(result).toContain('Error al generar resumen');
    });

    it('should return error when Summarizer API is not available', async () => {
      const mockAIWithoutSummarizer = createAIMock();
      delete (mockAIWithoutSummarizer as any).Summarizer;
      vi.stubGlobal('self', mockAIWithoutSummarizer);

      const result = await modelManager.summarizeText('Text to summarize');

      expect(result).toContain('Chrome AI Summarizer APIs no disponibles para resumen');
    });
  });
});
