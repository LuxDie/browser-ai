import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';
import {
  onMessage,
  removeMessageListeners
} from '@/entrypoints/background/messaging';
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
  let modelStatusUpdateSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset ModelManager singleton for each test
    modelManager = new ModelManager();
    vi.spyOn(ModelManager, 'getInstance').mockReturnValue(modelManager);

    // Clean up previous message listeners and register new spy
    removeMessageListeners();
    modelStatusUpdateSpy = vi.fn();
    onMessage('modelStatusUpdate', modelStatusUpdateSpy);
  });

  describe('checkModelStatus', () => {
    it('should return available status when summarizer model is available', async () => {
      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('available');
      expect(mockAI.Summarizer.availability).toHaveBeenCalledWith({
        type: 'tldr',
        length: 'medium',
        format: 'plain-text'
      });
    });

    it('should return downloadable status when summarizer model is downloadable', async () => {
      mockAI.Summarizer.availability.mockResolvedValueOnce('downloadable');

      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('downloadable');
    });

    it('should return downloading status when summarizer model is downloading', async () => {
      mockAI.Summarizer.availability.mockResolvedValueOnce('downloading');

      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('downloading');
      expect(result.downloadProgress).toBe(0);
    });

    it('should return error when summarizer model is not available', async () => {
      mockAI.Summarizer.availability.mockResolvedValueOnce('unavailable');

      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('unavailable');
      expect(result.errorMessage).toContain('no disponible');
    });

    it('should handle custom summarizer options', async () => {
      const customOptions = { type: 'key-points' as const, length: 'short' as const };

      await modelManager.checkModelStatus({ type: 'summarization', options: customOptions });

      expect(mockAI.Summarizer.availability).toHaveBeenCalledWith({
        type: 'key-points',
        length: 'short',
        format: 'plain-text'
      });
    });

    it('should handle API errors gracefully', async () => {
      mockAI.Summarizer.availability.mockRejectedValueOnce(new Error('API Error'));

      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('unavailable');
      expect(result.errorMessage).toContain('Error al verificar la disponibilidad del summarizer');
    });

    it('should return error when Summarizer API is not available', async () => {
      const mockAIWithoutSummarizer = createAIMock();
      delete (mockAIWithoutSummarizer as any).Summarizer;
      vi.stubGlobal('self', mockAIWithoutSummarizer);

      modelManager = new ModelManager();
      const result = await modelManager.checkModelStatus({ type: 'summarization' });

      expect(result.state).toBe('unavailable');
      expect(result.errorMessage).toContain('Summarizer API no disponible');

      // Restore the global mock
      vi.stubGlobal('self', mockAI);
    });
  });

  describe('downloadModel', () => {
    it('should download summarizer model successfully', async () => {
      const result = await modelManager.downloadModel({ type: 'summarization' });

      expect(result.state).toBe('available');
      expect(mockAI.Summarizer.create).toHaveBeenCalledWith({
        type: 'tldr',
        length: 'medium',
        format: 'plain-text'
      });
    });

    it('should handle download errors gracefully', async () => {
      mockAI.Summarizer.create.mockRejectedValueOnce(new Error('Download failed'));

      const result = await modelManager.downloadModel({ type: 'summarization' });

      expect(result.state).toBe('unavailable');
      expect(result.errorMessage).toContain('Error al descargar el modelo de resumen: Download failed');
    });

    it('should return error when Summarizer API is not available', async () => {
      const mockAIWithoutSummarizer = createAIMock();
      delete (mockAIWithoutSummarizer as any).Summarizer;
      vi.stubGlobal('self', mockAIWithoutSummarizer);

      const modelManager = new ModelManager();
      const result = await modelManager.downloadModel({ type: 'summarization' });

      expect(result.state).toBe('unavailable');
      expect(result.errorMessage).toContain('Summarizer API no soportada');

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

      const modelManager = new ModelManager();

      await expect(modelManager.summarizeText('Text to summarize'))
      .rejects.toThrow('Summarizer API no soportada');

      // Restore the global mock
      vi.stubGlobal('self', mockAI);
    });
  });
});
