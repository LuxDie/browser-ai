import { defineExtensionMessaging } from '@webext-core/messaging';

export interface ProtocolMap {
  getModelStatus(data: { source: string; target: string }): ModelStatus;
  downloadModel(data: { source: string; target: string }): ModelStatus;
  translateText(data: { text: string; source: string; target: string }): string;
  modelDownloadProgress(data: { key: string; progress: number }): void;
  detectLanguage(data: { text: string }): { language: string };
  translateTextRequest(data: { text: string; targetLanguage: string; sourceLanguage: string }): {
    translatedText: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    usingCloud: boolean;
  };
  checkAPIAvailability(): { 
    translator: boolean; 
    languageDetector: boolean;
    languageDetectorState?: string;
    translatorState?: string;
  };
  cancelPendingTranslations(): { cancelled: boolean };
  getAvailableLanguages(): { languages: { code: string; name: string }[] };
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
