import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DetectedLanguage from '@/components/DetectedLanguage.vue';

vi.mock('@/entrypoints/background/language/language.service', () => ({
  LanguageService: {
    getInstance: vi.fn(() => ({
      getLanguageKey: vi.fn((code: string) => code),
      isLanguageSupported: vi.fn(() => true),
    }))
  }
}));

describe('DetectedLanguage', () => {
  it('should display full "detected language" message when language is supported', () => {
    const language = 'es';
    const fullMsg = 'detectedLanguage es';
    vi.mocked(browser.i18n.getMessage).mockImplementation((msg, subs) => {
      if (msg === 'detectedLanguage' && subs === language) {
        return fullMsg;
      }
      return msg;
    });
    const wrapper = mount(DetectedLanguage, {
      props: {
        language,
      }
    });

    const message = wrapper.getComponent({ name: 'VTooltip' });
    expect(message.props('text')).toBe(fullMsg);
    const code = wrapper.get('[data-testid="detected-language-code"]');
    expect(code.text()).toContain(language);
  });

  it('should display language code when language is provided', () => {
    const language = 'es';
    const wrapper = mount(DetectedLanguage, {
      props: {
        language,
      }
    });

    const code = wrapper.get('[data-testid="detected-language-code"]');
    expect(code.text()).toContain(language);
  });

  it('should not show any message if no language is provided', () => {
    const wrapper = mount(DetectedLanguage, {
      props: {
        language: null,
      }
    });

    const message = wrapper.find('[data-testid="detected-language-message"]');
    expect(message.exists()).toBe(false);
  });
});