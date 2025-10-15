import { describe, it, expect } from 'vitest';
import { isValidTextForTranslation } from '@/utils';

describe('Text Validation', () => {

  it('should accept valid text for translation', () => {
    const validTexts = [
      'Hello world',
      'Este es un texto de prueba',
      'Bonjour le monde',
      'Hola, ¿cómo estás?'
    ];

    validTexts.forEach(text => {
      expect(isValidTextForTranslation(text)).toBe(true);
    });
  });

  it('should reject text that is too short', () => {
    const shortTexts = ['Hi', 'OK', 'a', ''];

    shortTexts.forEach(text => {
      expect(isValidTextForTranslation(text)).toBe(false);
    });
  });

  it('should reject URLs', () => {
    const urls = [
      'https://example.com',
      'http://google.com',
      'https://www.github.com/user/repo'
    ];

    urls.forEach(url => {
      expect(isValidTextForTranslation(url)).toBe(false);
    });
  });

  it('should reject email addresses', () => {
    const emails = [
      'user@example.com',
      'test.email@domain.org',
      'admin@company.co.uk'
    ];

    emails.forEach(email => {
      expect(isValidTextForTranslation(email)).toBe(false);
    });
  });

  it('should reject numbers only', () => {
    const numbers = ['123', '456789', '0', '999'];

    numbers.forEach(number => {
      expect(isValidTextForTranslation(number)).toBe(false);
    });
  });
});
