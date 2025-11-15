
import type { SummarizerLanguageCode } from '@/entrypoints/background/languages';

export interface SummarizerOptions extends Omit<SummarizerCreateOptions, 'expectedInputLanguages' | 'outputLanguage'> {
  expectedInputLanguages: SummarizerLanguageCode[];
  outputLanguage: SummarizerLanguageCode;
}

export interface AIModelStatus {
  state: Availability;
  errorMessage?: string;
  downloadProgress?: number;
}
