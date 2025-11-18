import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanguageService } from '@/entrypoints/background/language/language.service';

describe('LanguageService', () => {
  let languageService: LanguageService;

  beforeEach(() => {
    languageService = LanguageService.getInstance();
  });

  describe('getSupportedLanguages', () => {
    it('debe retornar la lista completa de idiomas soportados', () => {
      const result = languageService.getSupportedLanguages();

      expect(result).toContain('es');
      expect(result).toContain('en');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getBrowserLanguage', () => {
    it('debe retornar el idioma principal del navegador', () => {
      const browserLangMock = 'es';
      vi.stubGlobal('navigator', { language: browserLangMock });

      const result = languageService.getBrowserLanguage();

      expect(result).toBe(browserLangMock);
    });

    it('debe retornar el idioma principal del navegador sin región', () => {
      const browserLangMock = 'es-ES';
      vi.stubGlobal('navigator', { language: browserLangMock });

      const result = languageService.getBrowserLanguage();

      expect(result).toBe(browserLangMock.split('-')[0]);
    });
  });
});
