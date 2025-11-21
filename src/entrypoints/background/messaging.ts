import { defineExtensionMessaging } from '@webext-core/messaging';
import type { SupportedLanguageCode } from '@/entrypoints/background/language/language.service';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
export interface ProtocolMap {
  getModelStatus(data: {
    source: SupportedLanguageCode;
    target: SupportedLanguageCode
  }): AIModelStatus;
  translateText(data: {
    text: string;
    targetLanguage: SupportedLanguageCode;
    sourceLanguage: SupportedLanguageCode
  }): string;

  sidepanelReady(): void;
  selectedText(data: { text: string; summarize?: boolean }): void;
  modelStatusUpdate(data: AIModelStatus): void;
}

// eslint-disable-next-line @typescript-eslint/unbound-method
export const { sendMessage, onMessage, removeAllListeners: removeMessageListeners } =
  defineExtensionMessaging<ProtocolMap>();
