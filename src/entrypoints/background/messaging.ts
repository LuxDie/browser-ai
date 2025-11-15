import { defineExtensionMessaging } from '@webext-core/messaging';
import type { AvailableLanguages, SupportedLanguageCode } from '@/entrypoints/background';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
export interface ProtocolMap {
  getModelStatus(data: { source: string; target: string }): AIModelStatus;
  detectLanguage(text: string): string;
  translateText(data: {
    text: string;
    targetLanguage: SupportedLanguageCode;
    sourceLanguage: SupportedLanguageCode }):
    string;
  checkAPIAvailability(): boolean;
  cancelPendingTranslations(): void;
  getAvailableLanguages(): AvailableLanguages;
  getBrowserLanguage(): string;
  sidepanelReady(): void;
  selectedText(data: { text: string; summarize?: boolean }): void;
  modelStatusUpdate(data: AIModelStatus): void;
}


const messaging = defineExtensionMessaging<ProtocolMap>();
export const sendMessage = messaging.sendMessage.bind(messaging);
export const onMessage = messaging.onMessage.bind(messaging);
export const removeMessageListeners = messaging.removeAllListeners.bind(messaging);
