import { defineExtensionMessaging } from '@webext-core/messaging';
import type { AvailableLanguages, AvailableLanguageCode } from '@/entrypoints/background';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';

export interface AvailableLanguagesResponse {
  languages: { code: string; name: string }[];
}

export interface ModelAvailabilityResponse {
  status: AIModelStatus;
}

export interface ModelDownloadProgress {
  progress: number;
}

export interface ModelDownloadError {
  error: string;
}

export interface ModelNotAvailable {
  error: string;
}

export interface ModelDownloading {
  progress: number;
}

export interface TranslationCompleted {
  translatedText: string;
  usingCloud?: boolean;
}

export interface TranslationError {
  error: string;
}

export interface CloudAPINotConfigured {
  message: string;
}

export interface LanguageDetected {
  language: string;
}

// TODO quitar interfaces sin usar
export interface LanguageDetectionError {
  error: string;
}

export interface SelectedTextData {
  text: string;
  summarize?: boolean;
}

export interface ProtocolMap {
  getModelStatus(data: { source: string; target: string }): AIModelStatus;
  detectLanguage(data: { text: string }): { languageCode: AvailableLanguageCode };
  translateText(data: { text: string; targetLanguage: AvailableLanguageCode; sourceLanguage: AvailableLanguageCode }): string;
  checkAPIAvailability(): boolean;
  cancelPendingTranslations(): { cancelled: boolean };
  getAvailableLanguages(): { languages: AvailableLanguages };
  getBrowserLanguage(): string | null;
  sidepanelReady(): void;
  selectedText(data: SelectedTextData): void;
  translationCompleted(data: TranslationCompleted): void;
  modelStatusUpdate(data: AIModelStatus): void;
}

export interface APIAvailability {
  translator: boolean;
  languageDetector: boolean;
  summarizer: boolean;
  languageDetectorState?: string;
  translatorState?: string;
  summarizerState?: string;
}

const messaging = defineExtensionMessaging<ProtocolMap>();
export const sendMessage = messaging.sendMessage.bind(messaging);
export const onMessage = messaging.onMessage.bind(messaging);
export const removeMessageListeners = messaging.removeAllListeners.bind(messaging);
