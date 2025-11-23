import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LanguageSelector from '@/components/LanguageSelector.vue';
import type { SupportedLanguageCode } from '@/entrypoints/background/language/language.service';

vi.mock('@/entrypoints/background/language/language.service', () => ({
  LanguageService: {
    getInstance: vi.fn(() => ({
      getLanguageKey: vi.fn((code: string) => `lang_${code}`)
    }))
  }
}));

const supportedLanguages: SupportedLanguageCode[] = ['en', 'es', 'fr', 'de'];

describe('LanguageSelector', () => {
  it('should render select with all supported languages', () => {
    const wrapper = mount(LanguageSelector, {
      props: {
        modelValue: 'en',
        supportedLanguages
      }
    });

    const options = wrapper.findAll('option');
    expect(options).toHaveLength(supportedLanguages.length);
  });

  it('should update modelValue when selection changes', async () => {
    const wrapper = mount(LanguageSelector, {
      props: {
        modelValue: 'en',
        supportedLanguages
      }
    });

    const select = wrapper.find('select#target-language');
    await select.setValue('es');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['es']);
  });

  it('should display language labels using LanguageService', () => {
    const wrapper = mount(LanguageSelector, {
      props: {
        modelValue: 'en',
        supportedLanguages
      }
    });

    const options = wrapper.findAll('option');
    options.forEach((option, index) => {
      expect(option.text()).toBe(`lang_${supportedLanguages[index] ?? ''}`);
    });
  });
});
