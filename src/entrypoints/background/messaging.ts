import { defineExtensionMessaging } from '@webext-core/messaging';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
/**
 * Protocolo tipado para comunicación entre componentes de la extensión.
 * Define mensajes sendMessage/onMessage con payloads y retornos.
 */
export interface ProtocolMap {
  sidepanelReady(): void;
  selectedText(data: { text: string; summarize?: boolean }): void;
  modelStatusUpdate(data: AIModelStatus): void;
}

// eslint-disable-next-line @typescript-eslint/unbound-method
export const { sendMessage, onMessage, removeAllListeners: removeMessageListeners } =
  defineExtensionMessaging<ProtocolMap>();
