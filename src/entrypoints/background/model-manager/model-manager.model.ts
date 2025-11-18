import type { SummarizerLanguageCode } from '@/entrypoints/background/languages';

export type Availability = 'available' | 'downloading' | 'downloadable' | 'unavailable';

export interface SummarizerCreateOptions {
  type?: 'tldr';
  length?: 'short' | 'medium' | 'long';
  format?: 'plain-text' | 'markdown';
  expectedInputLanguages?: string[];
  outputLanguage?: string;
}

export interface WriterCreateOptions {
  // Define options for Writer if available in the spec
}

export interface RewriterCreateOptions {
  // Define options for Rewriter if available in the spec
}

export interface ProofreaderCreateOptions {
  // Define options for Proofreader if available in the spec
}

export interface PromptCreateOptions {
  // Define options for Prompt if available in the spec
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

export interface DownloadProgressMonitor {
  addEventListener(event: 'downloadprogress', listener: (event: { loaded: number }) => void): void;
}

export type DownloadProgressCallback = (monitor: DownloadProgressMonitor) => void;

export interface WriterOptions extends WriterCreateOptions {
  // Define options for Writer if available in the spec
}

export interface RewriterOptions extends RewriterCreateOptions {
  // Define options for Rewriter if available in the spec
}

export interface ProofreaderOptions extends ProofreaderCreateOptions {
  // Define options for Proofreader if available in the spec
}

export interface PromptOptions extends PromptCreateOptions {
  // Define options for Prompt if available in the spec
}
