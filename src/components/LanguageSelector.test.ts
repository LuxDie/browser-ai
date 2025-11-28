import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LanguageSelector from '@/components/LanguageSelector.vue';
import type { SupportedLanguageCode } from '@/entrypoints/background/language/language.service';
import type { VSelect } from 'vuetify/components';

vi.mock('@/entrypoints/background/language/language.service', () => ({
  LanguageService: {
    getInstance: vi.fn(() => ({
      getLanguageKey: vi.fn((code: SupportedLanguageCode) => code)
    }))
  }
}));

const supportedLanguages: SupportedLanguageCode[] = ['en', 'es', 'fr', 'de'];

describe('LanguageSelector', () => {
  it('should pass correct language names and model to select component', () => {
    const lang = 'en';
    const wrapper = mount(LanguageSelector, {
      props: {
        modelValue: lang,
        supportedLanguages
      }
    });

    const vSelect = wrapper.getComponent<typeof VSelect>('[data-testid="language-selector"]');
    const items = vSelect.props('items') as { value: string, title: string }[];
    expect(items.length).toBe(supportedLanguages.length);
    expect(items.map(item => item.value)).toEqual(supportedLanguages);
    expect(vSelect.props('modelValue')).toBe(lang);
  });

  it('should emit update:modelValue when selection changes', async () => {
    const lang = 'fr';
    const wrapper = mount(LanguageSelector, {
      props: { modelValue: 'en', supportedLanguages }
    });

    await wrapper.getComponent<typeof VSelect>('[data-testid="language-selector"]').setValue(lang);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([lang]);
  });
});
