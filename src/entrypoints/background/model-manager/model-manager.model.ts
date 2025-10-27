import type { LanguageCode } from '@/entrypoints/background/available-languages';

// Declare Chrome AI API interfaces for type safety
export interface TranslatorAPI {
  availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(options: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorInstance>;
}

export interface TranslatorInstance {
  translate(text: string): Promise<string>;
}

export interface LanguageDetectionResult {
  confidence: number;
  detectedLanguage: LanguageCode;
}

export interface LanguageDetectorInstance {
  detect(text: string): Promise<LanguageDetectionResult[]>;
}

export interface LanguageDetectorAPI {
  availability(): Promise<string>;
  create(): Promise<LanguageDetectorInstance>;
}
