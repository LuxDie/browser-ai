import { defineExtensionMessaging } from '@webext-core/messaging';
import { AvailableLanguages, LanguageCode } from '.';

export interface AvailableLanguagesResponse {
  languages: { code: string; name: string }[];
}

export interface ModelAvailabilityResponse {
  status: ModelStatus;
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

export interface LanguageDetectionError {
  error: string;
}

export interface ProtocolMap {
  getModelStatus(data: { source: string; target: string }): ModelStatus;
  detectLanguage(data: { text: string }): { languageCode: LanguageCode };
  translateText(data: { text: string; targetLanguage: LanguageCode; sourceLanguage: LanguageCode }): string;
  checkAPIAvailability(): { 
    translator: boolean; 
    languageDetector: boolean;
    languageDetectorState?: string;
    translatorState?: string;
  };
  cancelPendingTranslations(): { cancelled: boolean };
  getAvailableLanguages(): { languages: AvailableLanguages };
  getBrowserLanguage(): LanguageCode | null;
  sidepanelReady(): void;
  selectedText(text: string): void;
  translationCompleted(data: TranslationCompleted): void;
  modelStatusUpdate(data: ModelStatus): void;
}

export interface ModelStatus {
  available: boolean;
  downloading: boolean;
  progress?: number;
  error?: string;
}

const messaging = defineExtensionMessaging<ProtocolMap>();
export const sendMessage = messaging.sendMessage.bind(messaging);
export const onMessage = messaging.onMessage.bind(messaging);
export const removeMessageListeners = messaging.removeAllListeners.bind(messaging);
