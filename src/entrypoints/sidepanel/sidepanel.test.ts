import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

import {
  onMessage,
  sendMessage,
  removeMessageListeners
} from '@/entrypoints/background/messaging';
import { LanguageCode } from '@/entrypoints/background';
import { SidepanelApp } from '@/entrypoints/sidepanel/sidepanel';

function resetDOM() {
  document.body.innerHTML = '<div id="root"></div>';
}

const getDefaultAvailableLanguages = () => ([
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' }
]);

interface MessageHandlerSpies {
  checkAPIAvailability: MockInstance
  getAvailableLanguages: MockInstance
  getBrowserLanguage: MockInstance
  detectLanguage: MockInstance
  translateTextRequest: MockInstance
  cancelPendingTranslations: MockInstance
  sidepanelReady: MockInstance
}

// TODO: mejorar tipo `any`
const registerDefaultMessageHandlers = (overrides: Record<string, any> = {}): MessageHandlerSpies => {
  const checkAPIAvailabilitySpy = vi.fn(overrides.checkAPIAvailability ?? (() => ({
    translator: true,
    languageDetector: true
  })));
  const getAvailableLanguagesSpy = vi.fn(overrides.getAvailableLanguages ?? (() => ({
    languages: getDefaultAvailableLanguages()
  })));
  const getBrowserLanguageSpy = vi.fn(overrides.getBrowserLanguage ?? (() => 'es'));
  const detectLanguageSpy = vi.fn(overrides.detectLanguage ?? (() => ({ language: 'en' })));
  const translateTextRequestSpy = vi.fn(overrides.translateTextRequest ??
    ((data: { text: string; targetLanguage: string; sourceLanguage: string }) => {
    return Promise.resolve(`${data.text} (translated)`);
  }));
  const cancelPendingTranslationsSpy = vi.fn(overrides.cancelPendingTranslations ?? (() => ({ cancelled: true })));
  const sidepanelReadySpy = vi.fn(overrides.sidepanelReady ?? (() => {}));

  onMessage('checkAPIAvailability', checkAPIAvailabilitySpy);
  onMessage('getAvailableLanguages', getAvailableLanguagesSpy);
  onMessage('getBrowserLanguage', getBrowserLanguageSpy);
  onMessage('detectLanguage', detectLanguageSpy);
  onMessage('translateText', translateTextRequestSpy);
  onMessage('cancelPendingTranslations', cancelPendingTranslationsSpy);
  onMessage('sidepanelReady', sidepanelReadySpy);

  return {
    checkAPIAvailability: checkAPIAvailabilitySpy,
    getAvailableLanguages: getAvailableLanguagesSpy,
    getBrowserLanguage: getBrowserLanguageSpy,
    detectLanguage: detectLanguageSpy,
    translateTextRequest: translateTextRequestSpy,
    cancelPendingTranslations: cancelPendingTranslationsSpy,
    sidepanelReady: sidepanelReadySpy
  };
};

async function setTextAndTranslate(): Promise<void> {
      // Set text and translate
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
    textarea.value = 'This is a longer text that should trigger language detection';
    textarea.dispatchEvent(new Event('input'));
    await vi.runAllTimersAsync();
    translateButton.click();
    await vi.runAllTimersAsync();
}

async function initSidepanelApp(overrides: Record<string, any> = {}): Promise<MessageHandlerSpies> {
  resetDOM();
  removeMessageListeners();
  const messageHandlerSpies = registerDefaultMessageHandlers(overrides);
  new SidepanelApp();
  await vi.runAllTimersAsync();
  return messageHandlerSpies;
}

describe('SidepanelApp', () => {
  let messageHandlerSpies: MessageHandlerSpies;

  beforeEach(async () => {
    fakeBrowser.reset();
    vi.useFakeTimers();
    messageHandlerSpies = await initSidepanelApp();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    removeMessageListeners();
  });

  it('should render the initial state correctly', () => {
    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('Browser AI');
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
    const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
    expect(translateButton.disabled).toBe(true);
  });

  it('should check API availability on initialization', () => {
    expect(messageHandlerSpies.checkAPIAvailability).toHaveBeenCalled();
  });

  it('should send sidepanelReady message after initialization', () => {
    expect(messageHandlerSpies.sidepanelReady).toHaveBeenCalled();
  });

  it('should show detected language after text input', async () => {
    const testLanguageCode: LanguageCode = 'en';
    messageHandlerSpies.detectLanguage.mockImplementation(() => ({ languageCode: testLanguageCode }));
    await setTextAndTranslate();

    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('Idioma detectado');
    expect(root?.innerHTML).toContain(testLanguageCode);
  });

  it('should show "Traducido localmente" indicator when using native API', async () => {
    // Set text and translate
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
    textarea.value = 'This is a longer text that should trigger language detection';
    textarea.dispatchEvent(new Event('input'));
    await vi.runAllTimersAsync();
    translateButton.click();
    await vi.runAllTimersAsync();
    
    // Verificar que aparece el indicador de traducción local
    const indicatorElement = document.getElementById('translation-source');
    // TODO: investigar o reportar bug de tseslint
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    expect(indicatorElement?.textContent?.trim()).toBe('🔒 Traducido localmente');
  });

  it('should automatically detect language from text selected from context menu', async () => {
    // Simulate receiving text from context menu
    await sendMessage('selectedText', 'This is a test sentence for automatic translation.');
    // Wait for automatic translation to trigger
    await vi.runAllTimersAsync();

    // Verify that translation was requested with correct data
    expect(messageHandlerSpies.detectLanguage).toHaveBeenCalled();
  });

  it('should automatically translate text when selected from context menu', async () => {
    // Simulate receiving text from context menu
    await sendMessage('selectedText', 'This is a test sentence for automatic translation.');
    // Wait for automatic translation to trigger
    await vi.runAllTimersAsync();

    // Verify that translation was requested with correct data
    expect(messageHandlerSpies.translateTextRequest).toHaveBeenCalled();
  });

  it('should cancel translation when target language changes', async () => {
    // Change target language (this should cancel translation)
    const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
    targetSelect.value = 'fr';
    targetSelect.dispatchEvent(new Event('change'));
    await vi.runAllTimersAsync();

    // Verify that translation was cancelled
    expect(messageHandlerSpies.cancelPendingTranslations).toHaveBeenCalled();
  });
  
  it('should cancel translation when text changes', async () => {
    // Change text
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    textarea.value = 'This is a test sentence for translation.';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.runAllTimersAsync();

    // Verify that cancel message was sent
    expect(messageHandlerSpies.cancelPendingTranslations).toHaveBeenCalled();
  });

  describe('Translate Button Behavior', () => {
    it('should be disabled when no text is entered', () => {
      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.disabled).toBe(true);
    });

    it('should be disabled for too short text for language detection', async () => {
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'Hello';
      textarea.dispatchEvent(new Event('input'));

      await vi.runAllTimersAsync();

      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.disabled).toBe(true);
    });

    it('should be disabled while language detection is in progress', async () => {
      // Override the detectLanguage handler to delay the response
      removeMessageListeners();
      registerDefaultMessageHandlers({
        detectLanguage: () => new Promise((resolve) => {
          setTimeout(() => { resolve({ language: 'en' }); }, 1000); // Delay response
        })
      });

      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));

      // Wait a very short time for the UI to update
      await vi.advanceTimersByTimeAsync(10);

      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton.disabled).toBe(true);
    });

    it('should enable button when source language is detected to be different from target language', async () => {
      const sourceLanguage = 'fr';
      const targetLanguage = 'de';
      
      // Add text to the textarea first
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a test sentence for translation.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      messageHandlerSpies.detectLanguage.mockImplementation(() => ({ language: sourceLanguage }));
      
      // Change target language to Spanish to enable translation
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = targetLanguage;
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      // Button should be enabled because source ('en') and target ('es') languages are different
      expect(translateButton.disabled).toBe(false);
    });

    it('should disable button when source language is detected to be the same as target language', async () => {
      const sameLanguage = 'it';
      
      messageHandlerSpies.detectLanguage.mockImplementation(() => ({ languageCode: sameLanguage }));

      // Add text to the textarea first
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a test sentence for translation.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Set target language to the same as source to test disabled state
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = sameLanguage;
      targetSelect.dispatchEvent(new Event('change'));

      await vi.runAllTimersAsync(); // Wait for target language change to complete

      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      // Button should be disabled because source and target languages are the same
      expect(translateButton.disabled).toBe(true);
    });

    it('should show "Traduciendo..." and be disabled when translation is in progress', async () => {
      // Setup: Enter text and detect language to enable translation
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();
      // Verify button is enabled initially
      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton).toBeTruthy();
      expect(translateButton.disabled).toBe(false);

      // Simulate translation start by clicking the button
      translateButton.click();

      // Verify the button shows loading state
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      expect(translateButton.textContent?.trim()).toBe('Traduciendo...');
      expect(translateButton.disabled).toBe(true);
    });

    it('should not translate when source and target languages are the same, even from context menu', async () => {
      // Set up: configure source language to be the same as target
      const sameLanguage = 'en';
      messageHandlerSpies.detectLanguage.mockImplementation(() => ({ languageCode: sameLanguage }));
      // Set target language to the same as source
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = sameLanguage;
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Simulate receiving text from context menu (should trigger automatic translation)
      await sendMessage('selectedText', 'This is a test sentence for automatic translation.');
      await vi.runAllTimersAsync();

      // Verify that translation was NOT requested because languages are the same
      expect(messageHandlerSpies.translateTextRequest).not.toHaveBeenCalled();
      // Verify that an error is shown
      const warningContainer = document.getElementById('warning-container');
      expect(warningContainer?.innerHTML).toContain('Los idiomas de origen y destino son iguales');
    });

    it('should reset button state after translation completes', async () => {
      // Setup: Enter text and detect language to enable translation
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();
      // Verify button is enabled initially
      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      expect(translateButton).toBeTruthy();
      expect(translateButton.disabled).toBe(false);

      // Simulate translation start by clicking the button
      translateButton.click();

      // Verify button is reset after translation is complete
      await vi.runAllTimersAsync();
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      expect(translateButton.textContent?.trim()).toBe('Traducir');
      expect(translateButton.disabled).toBe(false);
    });

    it('should enable button after switching target language during translation', async () => {
      // Setup: Enter text and detect language
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();
      // Simulate translation start
      messageHandlerSpies.translateTextRequest.mockImplementation(() => new Promise(() => {}));
      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      translateButton.click();
      await vi.runAllTimersAsync();
      // Change target to input-text
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      expect(targetSelect).toBeTruthy();
      targetSelect.value = 'fr';
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Button should be re-enabled after switching target language
      expect(translateButton.disabled).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      expect(translateButton.textContent?.trim()).toBe('Traducir');
    });
  });

  describe('Language Change Behavior', () => {
    it('should send cancel message when target language changes', async () => {
      // Change target language (should always send cancel message)
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'fr';
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Verify that cancel message was sent
      expect(messageHandlerSpies.cancelPendingTranslations).toHaveBeenCalled();
    });
  });

  describe('Model Downloading State', () => {
    it('should show model download message when downloading starts', async () => {
      // Trigger the modelStatusUpdate message to sidepanel
      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      await vi.runAllTimersAsync();

      // Verify that model download message is shown
      const modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer).toBeTruthy();
      expect(modelStatusContainer?.innerHTML).toBeTruthy();
    });

    it('should hide model download message when translation completes', async () => {
      // Set up translating state with model downloading
      const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
      const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
      textarea.value = 'This is a longer text that should trigger language detection';
      textarea.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();
      translateButton.click();
      messageHandlerSpies.translateTextRequest.mockImplementation(() => {
        return new Promise<void>((resolve) => { setTimeout(() => { resolve(); }, 1000);});
      });
      // Simulate model downloading message
      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      const modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer?.innerHTML).toBeTruthy();
      await vi.runAllTimersAsync();

      // Verify that model download message is hidden
      expect(modelStatusContainer?.innerHTML).toBeFalsy();
    });

    it('should hide model download message when source language changes', async () => {
      // Trigger the modelStatusUpdate message to sidepanel
      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      await vi.runAllTimersAsync();
      // Verify that model download message is shown
      const modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer?.innerHTML).toBeTruthy();

      // Change source language (should always send cancel message)
      const inputText = document.getElementById('input-text') as HTMLTextAreaElement;
      inputText.value = 'This is a longer text that should trigger language detection';
      inputText.dispatchEvent(new Event('input'));
      await vi.runAllTimersAsync();

      // Verify that model download message is hidden
      expect(modelStatusContainer?.innerHTML).toBeFalsy();
    });

    it('should hide model download message when target language changes', async () => {
      // Trigger the modelStatusUpdate message to sidepanel
      await sendMessage('modelStatusUpdate', { state: 'downloading', downloadProgress: 0 });
      await vi.runAllTimersAsync();

      // Verify that model download message is shown
      const modelStatusContainer = document.getElementById('model-status-container');
      expect(modelStatusContainer?.innerHTML).toBeTruthy();

      // Change target language (should always send cancel message)
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      targetSelect.value = 'fr';
      targetSelect.dispatchEvent(new Event('change'));
      await vi.runAllTimersAsync();

      // Verify that model download message is hidden
      expect(modelStatusContainer?.innerHTML).toBeFalsy();
    });
  });

  describe('API Availability Warning', () => {
    it('should show warning when native browser APIs are not available', async () => {
      // Initialize app with translator API not available
      await initSidepanelApp({
        checkAPIAvailability: () => (false)
      });

      // Verify that the warning is displayed
      const apiWarningContainer = document.getElementById('api-warning-container');
      expect(apiWarningContainer?.innerHTML).toContain('Las APIs nativas del navegador no están disponibles');
    });

    it('should not show warning when native browser APIs are available', async () => {
      // Initialize app with translator API available (default behavior)
      await initSidepanelApp({
        checkAPIAvailability: () => (true)
      });

      // Verify that no warning is displayed
      const apiWarningContainer = document.getElementById('api-warning-container');
      expect(apiWarningContainer?.innerHTML).toBe('');
    });
  });

  describe('Default Language Loading', () => {
    it('should use browser language as default target when it is supported', async () => {
      const browserLanguage = 'fr';

      // Create instance with override for browser language
      await initSidepanelApp({
        getBrowserLanguage: () => browserLanguage
      });

      // Verify the selected value is the browser language
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      expect(targetSelect.value).toBe(browserLanguage);
    });

    it('should use default language (es) when browser language is not supported', async () => {
      const browserLanguage = 'ja';
      const fallbackLanguage = 'es';
      // Create instance with override for unsupported browser language
      await initSidepanelApp({
        getBrowserLanguage: () => browserLanguage
      });

      // Verify the selected value is the default fallback language 'es'
      const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
      expect(targetSelect.value).toBe(fallbackLanguage);
    });

    it('should populate language selector with available languages', async () => {
      // Create instance for this test
      await initSidepanelApp();

      const select = document.getElementById('target-language') as HTMLSelectElement;
      expect(select).toBeTruthy();

      // Verify that the selector has options
      expect(select.options.length).toBeGreaterThan(0);

      // Verify some expected languages are present
      const optionValues = Array.from(select.options).map(opt => opt.value);
      expect(optionValues).toContain('es');
      expect(optionValues).toContain('en');
      expect(optionValues).toContain('fr');
    });
  });
});
