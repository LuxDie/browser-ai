import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, type MockedObject } from 'vitest';
import { flushPromises, resetDOM } from '@/tests/utils';
import { onMessage, sendMessage, removeMessageListeners } from '@/entrypoints/background/messaging';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import type { AIService } from '../background/ai/ai.service';

vi.mock('@/entrypoints/background/ai/ai.service', () => ({
  getAIService: () => mockAIService,
}));
vi.mock('@/entrypoints/background/language/language.service', () => ({
  LanguageService: {
    getInstance: () => mockLanguageService,
  },
}));

// TODO: centralizar simulacro
const mockAIService: MockedObject<Pick<
  AIService,
  'processText' |
  'detectLanguage' |
  'checkAPIAvailability' |
  'cancelProcessing'>
> = {
  processText: vi.fn(() => Promise.resolve(PROCESSED_TEXT)),
  detectLanguage: vi.fn(() => Promise.resolve(mockSupportedLanguages[0])),
  checkAPIAvailability: vi.fn(() => true),
  cancelProcessing: vi.fn(),
};

const mockLanguageService = {
  getSupportedLanguages: vi.fn(() => ['en', 'es']),
  getBrowserLanguage: vi.fn(() => 'en'),
  isLanguageSupported: vi.fn(() => true),
  getLanguageKey: vi.fn((code: string) => `lang_${code}`),
};

const sidepanelReadySpy = vi.fn();

const PROCESSED_TEXT = 'Texto procesado';
const mockSupportedLanguages = ['en', 'es'] as const;

describe('sidepanel.ts', () => {
  beforeAll(() => {
    resetDOM();
  });
  beforeEach(async () => {
    await import('@/entrypoints/sidepanel/sidepanel');
    onMessage('sidepanelReady', sidepanelReadySpy);
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();
  });

  afterEach(() => {
    resetDOM();
    removeMessageListeners();
  });

  it('should mount the Vue app', () => {
    const appContainer = document.querySelector('#root');
    expect(appContainer).not.toBeNull();
    expect(appContainer!.querySelector('[data-testid="sidepanel-app-container"]')).not.toBeNull();
  });

  it('should forward modelStatusUpdate from runtime message to CustomEvent', async () => {
    const eventListener = vi.fn();
    globalThis.addEventListener('modelStatusUpdate', eventListener);

    const messagePayload: AIModelStatus = { state: 'downloading', downloadProgress: 50 };
    await sendMessage('modelStatusUpdate', messagePayload);
    await flushPromises();

    expect(eventListener).toHaveBeenCalled();
    const event = eventListener.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail).toEqual(messagePayload);
    globalThis.removeEventListener('modelStatusUpdate', eventListener);
  });

  it('should forward selectedText from runtime message to CustomEvent', async () => {
    const eventListener = vi.fn();
    globalThis.addEventListener('selectedText', eventListener);

    const messagePayload = { text: 'Hello world', summarize: false };
    await sendMessage('selectedText', messagePayload);
    await flushPromises();

    expect(eventListener).toHaveBeenCalled();
    const event = eventListener.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail).toEqual(messagePayload);
    globalThis.removeEventListener('selectedText', eventListener);
  });

  it('should send sidepanelReady message when receiving the CustomEvent', async () => {
    // Simula el evento que envía SidepanelApp
    globalThis.dispatchEvent(new CustomEvent('sidepanelReady'));
    await flushPromises();

    expect(sidepanelReadySpy).toHaveBeenCalled();
  });
});
