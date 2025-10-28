import type { LanguageCode } from '@/entrypoints/background';

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

export interface AIModelStatus {
  state: 'available' | 'downloadable' | 'downloading' | 'unavailable'
  errorMessage?: string;
  downloadProgress?: number;
}

// Interfaces y tipos para modelos de resumen
export interface SummarizerOptions {
  sharedContext?: string;
  type?: 'tldr' | 'key-points' | 'teaser' | 'headline';
  length?: 'short' | 'medium' | 'long';
  format?: 'plain-text' | 'markdown';
  expectedInputLanguages?: string[];
  outputLanguage?: string;
}

export interface SummarizerAPI {
  availability(options?: SummarizerOptions): Promise<string>;
  create(options?: SummarizerOptions): Promise<SummarizerInstance>;
}

export interface SummarizerInstance {
  summarize(text: string): Promise<string>;
}
