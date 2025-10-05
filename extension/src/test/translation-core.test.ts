import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createChromeMock,
  createAIMock,
  setupChromeMock,
  setupAIMock,
  createLanguageDetectorMock,
  createTranslatorMock,
  createLanguageDetectorErrorMock,
  createTranslatorErrorMock,
  setupLanguageDetectorMock,
  setupTranslatorMock,
  setupStorageMock
} from './test-utils'
import {
  simpleLanguageDetection,
  createStorageMock,
  isValidLanguageCode
} from '../core'

// Mock de las APIs de Chrome y IA antes de importar los módulos
const mockChrome = createChromeMock();
const mockAI = createAIMock();

setupChromeMock(mockChrome);
setupAIMock(mockAI);

describe('Translation Core', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Language Detection', () => {
    it('should detect language using Language Detector API', async () => {
      const mockDetector = createLanguageDetectorMock('en', 0.95);
      setupLanguageDetectorMock(mockDetector);

      const result = await mockDetector.detect('Hello world') as { language: string, confidence: number };
      
      expect(mockDetector.detect).toHaveBeenCalledWith('Hello world');
      expect(result.language).toBe('en');
      expect(result.confidence).toBeGreaterThan(0.9);
    })

    it('should handle language detection errors gracefully', async () => {
      const mockDetector = createLanguageDetectorErrorMock('Detection failed');
      setupLanguageDetectorMock(mockDetector);

      await expect(mockDetector.detect('test')).rejects.toThrow('Detection failed');
    })

    it('should detect Spanish text correctly', () => {

      const spanishTexts = [
        'niño',
        'mañana',
        'señor',
        'año',
        'peña'
      ]

      spanishTexts.forEach(text => {
        expect(simpleLanguageDetection(text)).toBe('es')
      })
    })

    it('should default to English for unrecognized text', () => {

      const englishTexts = [
        'Hello world',
        'How are you?',
        'English text',
        'Simple text',
        '123 numbers'
      ]

      englishTexts.forEach(text => {
        expect(simpleLanguageDetection(text)).toBe('en')
      })
    })

    it('should validate language codes correctly', () => {

      // Valid codes
      expect(isValidLanguageCode('en')).toBe(true)
      expect(isValidLanguageCode('ES')).toBe(true)
      expect(isValidLanguageCode('zh')).toBe(true)
      expect(isValidLanguageCode('ja')).toBe(true)

      // Invalid codes
      expect(isValidLanguageCode('xx')).toBe(false)
      expect(isValidLanguageCode('')).toBe(false)
      expect(isValidLanguageCode('invalid')).toBe(false)
      expect(isValidLanguageCode('123')).toBe(false)
    })
  })

  describe('Translation', () => {
    it('should translate text using Translator API', async () => {
      const mockTranslator = createTranslatorMock('Hola mundo', 'en', 'es');
      setupTranslatorMock(mockTranslator);

      const result = await mockTranslator.translate('Hello world', {
        from: 'en',
        to: 'es'
      }) as { translatedText: string };

      expect(mockTranslator.translate).toHaveBeenCalledWith('Hello world', {
        from: 'en',
        to: 'es'
      });
      expect(result.translatedText).toBe('Hola mundo');
    })

    it('should handle translation errors gracefully', async () => {
      const mockTranslator = createTranslatorErrorMock('Translation failed');
      setupTranslatorMock(mockTranslator);

      await expect(mockTranslator.translate('test', { to: 'es' }))
        .rejects.toThrow('Translation failed');
    })

    it('should handle empty or invalid input', async () => {
      const mockTranslator = createTranslatorMock('', '', 'es');
      setupTranslatorMock(mockTranslator);

      const result = await mockTranslator.translate('', { to: 'es' }) as { translatedText: string };
      
      expect(result.translatedText).toBe('');
    })
  })

  describe('Storage Operations', () => {
    it('should save and retrieve settings', async () => {
      const mockStorage = createStorageMock({
        defaultTargetLanguage: 'es',
        privacyMode: false
      });
      setupStorageMock(mockStorage);

      // Test getting settings
      const settings = await mockStorage.get(['defaultTargetLanguage', 'privacyMode']) as { defaultTargetLanguage: string, privacyMode: boolean }
      expect(settings.defaultTargetLanguage).toBe('es')
      expect(settings.privacyMode).toBe(false)

      // Test setting new values
      await mockStorage.set({
        defaultTargetLanguage: 'en',
        privacyMode: true
      })

      expect(mockStorage.set).toHaveBeenCalledWith({
        defaultTargetLanguage: 'en',
        privacyMode: true
      })
    })
  })
})
