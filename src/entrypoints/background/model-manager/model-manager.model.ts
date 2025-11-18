import type { SummarizerLanguageCode } from '@/entrypoints/background/language/language.service';

export type Availability = 'available' | 'downloading' | 'downloadable' | 'unavailable';

export interface SummarizerCreateOptions {
  type?: 'tldr';
  length?: 'short' | 'medium' | 'long';
  format?: 'plain-text' | 'markdown';
  expectedInputLanguages?: string[];
  outputLanguage?: string;
  signal?: AbortSignal;
  monitor?: CreateMonitorCallback;
}

export interface WriterCreateOptions {
  signal?: AbortSignal;
  monitor?: CreateMonitorCallback;
  [key: string]: any;
}

export interface RewriterCreateOptions {
  signal?: AbortSignal;
  monitor?: CreateMonitorCallback;
  [key: string]: any;
}

export interface ProofreaderCreateOptions {
  signal?: AbortSignal;
  monitor?: CreateMonitorCallback;
  [key: string]: any;
}

export interface PromptCreateOptions {
  signal?: AbortSignal;
  monitor?: CreateMonitorCallback;
  [key: string]: any;
}

export interface SummarizerOptions extends Omit<SummarizerCreateOptions, 'expectedInputLanguages' | 'outputLanguage'> {
  expectedInputLanguages: SummarizerLanguageCode[];
  outputLanguage: SummarizerLanguageCode;
}

export interface AIModelStatus {
  state: Availability;
  errorMessage?: string;
  downloadProgress?: number;
}

export interface WriterOptions extends WriterCreateOptions {
  [key: string]: any;
}

export interface RewriterOptions extends RewriterCreateOptions {
  [key: string]: any;
}

export interface ProofreaderOptions extends ProofreaderCreateOptions {
  [key: string]: any;
}

export interface PromptOptions extends PromptCreateOptions {
  [key: string]: any;
}
