import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ModelStatus,
  setModelStatus,
  getModelStatus,
  addPendingTranslation,
  getPendingTranslations,
  determineTranslationFlow,
  updateDownloadProgress,
  formatNotificationMessage,
  getNotificationType,
  handleDownloadError
} from '@/utils';

describe('Model Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Model Status Management', () => {
    it('should track model availability correctly', () => {
      const modelStatusCache = new Map<string, ModelStatus>();

      // Test setting and getting model status
      setModelStatus('en', 'es', { available: true, downloading: false }, modelStatusCache);
      expect(getModelStatus('en', 'es', modelStatusCache)).toEqual({ available: true, downloading: false });

      setModelStatus('fr', 'de', { available: false, downloading: true, progress: 50 }, modelStatusCache);
      expect(getModelStatus('fr', 'de', modelStatusCache)).toEqual({ available: false, downloading: true, progress: 50 });

      // Test non-existent model
      expect(getModelStatus('zh', 'ja', modelStatusCache)).toBeNull();
    });

    it('should handle model download states correctly', () => {
      const modelStates = [
        { available: false, downloading: false, error: 'Model not found' },
        { available: false, downloading: true, progress: 0 },
        { available: false, downloading: true, progress: 50 },
        { available: false, downloading: true, progress: 100 },
        { available: true, downloading: false }
      ];

      modelStates.forEach((state) => {
        if (state.downloading) {
          expect(state.progress).toBeDefined();
          expect(state.progress).toBeGreaterThanOrEqual(0);
          expect(state.progress).toBeLessThanOrEqual(100);
        }
        
        if (state.available) {
          expect(state.downloading).toBe(false);
        }
      });
    });
  });

  describe('Pending Translations Management', () => {
    it('should manage pending translations correctly', () => {
      const pendingTranslations: {
        text: string
        sourceLanguage: string
        targetLanguage: string
        timestamp: number
      }[] = [];

      // Add pending translations
      addPendingTranslation('Hello world', 'en', 'es', pendingTranslations);
      addPendingTranslation('Bonjour monde', 'fr', 'es', pendingTranslations);
      addPendingTranslation('Hola mundo', 'es', 'en', pendingTranslations);

      expect(pendingTranslations).toHaveLength(3);

      // Test getting pending translations for specific language pair
      const enToEs = getPendingTranslations('en', 'es', pendingTranslations);
      expect(enToEs).toHaveLength(1);
      expect(enToEs[0]!.text).toBe('Hello world');

      // Test duplicate handling - should replace existing
      addPendingTranslation('Hello again', 'en', 'es', pendingTranslations);
      expect(pendingTranslations).toHaveLength(3); // Still 3, not 4
      const updatedEnToEs = getPendingTranslations('en', 'es', pendingTranslations);
      expect(updatedEnToEs).toHaveLength(1);
      expect(updatedEnToEs[0]!.text).toBe('Hello again');
    });

    it('should handle pending translation timestamps correctly', () => {
      const pendingTranslations: {
        text: string
        sourceLanguage: string
        targetLanguage: string
        timestamp: number
      }[] = [];

      const beforeTime = Date.now();
      addPendingTranslation('Test text', 'en', 'es', pendingTranslations);
      const afterTime = Date.now();

      expect(pendingTranslations).toHaveLength(1);
      expect(pendingTranslations[0]!.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(pendingTranslations[0]!.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Translation Flow Logic', () => {
    it('should determine correct translation flow based on model status', () => {

      // Model available - translate directly
      expect(determineTranslationFlow(
        { available: true, downloading: false },
        'Hello world',
        'en',
        'es'
      )).toEqual({
        action: 'translate_directly',
        reason: 'model_available'
      });

      // Model downloading - add to pending
      expect(determineTranslationFlow(
        { available: false, downloading: true, progress: 50 },
        'Hello world',
        'en',
        'es'
      )).toEqual({
        action: 'add_to_pending',
        reason: 'model_downloading'
      });

      // Model not available - show options
      expect(determineTranslationFlow(
        { available: false, downloading: false, error: 'Model not found' },
        'Hello world',
        'en',
        'es'
      )).toEqual({
        action: 'show_options',
        reason: 'model_not_available'
      });

      // No text - do nothing
      expect(determineTranslationFlow(
        { available: true, downloading: false },
        '',
        'en',
        'es'
      )).toEqual({
        action: 'none',
        reason: 'no_text'
      });

      // Missing languages - do nothing
      expect(determineTranslationFlow(
        { available: true, downloading: false },
        'Hello world',
        '',
        'es'
      )).toEqual({
        action: 'none',
        reason: 'missing_languages'
      });

      // Same languages - do nothing
      expect(determineTranslationFlow(
        { available: true, downloading: false },
        'Hello world',
        'en',
        'en'
      )).toEqual({
        action: 'none',
        reason: 'same_languages'
      });

      // Same languages with different cases - do nothing
      expect(determineTranslationFlow(
        { available: true, downloading: false },
        'Hello world',
        'EN',
        'en'
      )).toEqual({
        action: 'none',
        reason: 'same_languages'
      });
    });

    it('should handle download progress updates correctly', () => {

      // Valid progress updates
      expect(updateDownloadProgress(0, 25)).toEqual({
        progress: 25,
        isComplete: false,
        canCancel: true
      });

      expect(updateDownloadProgress(50, 75)).toEqual({
        progress: 75,
        isComplete: false,
        canCancel: true
      });

      expect(updateDownloadProgress(90, 100)).toEqual({
        progress: 100,
        isComplete: true,
        canCancel: false
      });

      // Invalid progress updates
      expect(() => updateDownloadProgress(50, 25)).toThrow('El progreso no puede disminuir');
      expect(() => updateDownloadProgress(50, -10)).toThrow('El progreso debe estar entre 0 y 100');
      expect(() => updateDownloadProgress(50, 150)).toThrow('El progreso debe estar entre 0 y 100');
    });
  });

  describe('Notification Logic', () => {
    it('should format notification messages correctly', () => {

      expect(formatNotificationMessage('en', 'es', 'ready')).toBe('EN→ES listo');
      expect(formatNotificationMessage('fr', 'de', 'downloading')).toBe('Descargando modelo FR→DE...');
      expect(formatNotificationMessage('zh', 'ja', 'error')).toBe('Error descargando modelo ZH→JA');
      expect(formatNotificationMessage('it', 'pt', 'unknown')).toBe('Estado desconocido para IT→PT');
    });

    it('should determine notification type based on model status', () => {

      expect(getNotificationType({ available: true, downloading: false })).toEqual({
        type: 'success',
        priority: 'normal'
      });

      expect(getNotificationType({ available: false, downloading: true, progress: 50 })).toEqual({
        type: 'info',
        priority: 'low'
      });

      expect(getNotificationType({ available: false, downloading: false, error: 'Download failed' })).toEqual({
        type: 'error',
        priority: 'high'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle model download errors gracefully', () => {

      // Network error
      const networkError = new Error('Network failed');
      networkError.name = 'NetworkError';
      expect(handleDownloadError(networkError, 'en', 'es')).toEqual({
        sourceLanguage: 'en',
        targetLanguage: 'es',
        error: 'Sin conexión a internet',
        canRetry: true,
        fallbackAvailable: true
      });

      // Storage error
      const storageError = new Error('No space left');
      storageError.name = 'StorageError';
      expect(handleDownloadError(storageError, 'fr', 'de')).toEqual({
        sourceLanguage: 'fr',
        targetLanguage: 'de',
        error: 'Espacio insuficiente en disco',
        canRetry: false,
        fallbackAvailable: true
      });

      // Unknown error
      const unknownError = new Error('Something went wrong');
      expect(handleDownloadError(unknownError, 'zh', 'ja')).toEqual({
        sourceLanguage: 'zh',
        targetLanguage: 'ja',
        error: 'Something went wrong',
        canRetry: true,
        fallbackAvailable: true
      });
    });
  });

});
