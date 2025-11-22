import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DetectedLanguage from '@/components/DetectedLanguage.vue';

vi.mock('@/entrypoints/background/language/language.service', () => ({
  LanguageService: {
    getInstance: vi.fn(() => ({
      getLanguageKey: vi.fn((code: string) => `lang_${code}`)
    }))
  }
}));

describe('DetectedLanguage', () => {
  it('should display detected language message', () => {
    const correctString = 'detectedLanguage lang_es';
    vi.mocked(browser.i18n.getMessage).mockImplementation((msg, subs) => {
      if (msg === 'detectedLanguage' && subs === 'lang_es') {
        return correctString;
      }
      return msg;
    });
    const wrapper = mount(DetectedLanguage, {
      props: {
        sourceLanguage: 'es'
      }
    });

    expect(wrapper.text()).toContain(correctString);
  });
});
