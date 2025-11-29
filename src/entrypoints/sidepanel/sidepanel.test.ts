import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flushPromises, resetDOM } from '@/tests/utils';
import { onMessage, sendMessage, removeMessageListeners } from '@/entrypoints/background/messaging';

const sidepanelReadySpy = vi.fn();

describe('sidepanel.ts', () => {

  beforeEach(async () => {
    resetDOM();
    // We need to re-import and execute sidepanel.ts for each test
    // to ensure a clean state for listeners.
    await import('@/entrypoints/sidepanel/sidepanel');
    onMessage('sidepanelReady', sidepanelReadySpy);
  });

  afterEach(() => {
    removeMessageListeners();
  });

  it('should mount the Vue app on DOMContentLoaded', async () => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();
    const appContainer = document.querySelector('#root');
    expect(appContainer).not.toBeNull();
    // Check for a known element within the SidepanelApp component
    expect(appContainer?.querySelector('[data-testid="sidepanel-app-container"]')).not.toBeNull();
  });

  it('should forward modelStatusUpdate from runtime message to CustomEvent', async () => {
    const eventListener = vi.fn();
    globalThis.addEventListener('modelStatusUpdate', eventListener);

    const messagePayload = { state: 'downloading', downloadProgress: 50 };
    // Simulate a message from the background script
    await sendMessage('modelStatusUpdate', messagePayload as any);
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
    // Simulate a message from the background script
    await sendMessage('selectedText', messagePayload);
    await flushPromises();

    expect(eventListener).toHaveBeenCalled();
    const event = eventListener.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail).toEqual(messagePayload);
    globalThis.removeEventListener('selectedText', eventListener);
  });

  it('should send sidepanelReady message when receiving the CustomEvent', async () => {
    // Dispatch the event that the Vue app will send
    globalThis.dispatchEvent(new CustomEvent('sidepanelReady'));
    await flushPromises();

    expect(sidepanelReadySpy).toHaveBeenCalled();
  });
});
