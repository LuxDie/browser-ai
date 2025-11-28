import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { SupportedLanguageCode } from '@/entrypoints/background/language/language.service';
import ProcessControls from '@/components/ProcessControls.vue';
import type { VBtn } from 'vuetify/components';

vi.mock('@/entrypoints/background/language/language.service', () => ({
  LanguageService: {
    getInstance: vi.fn(() => ({
      getLanguageKey: vi.fn((code: SupportedLanguageCode) => code)
    }))
  }
}));

const defaultProps = {
  targetLanguage: 'en' as const,
  summarize: false,
  supportedLanguages: ['en' as const, 'es' as const],
  isLoading: false,
  canProcess: true
};

describe('ProcessControls', () => {
  it('should emit process event when button is clicked', async () => {
    const wrapper = mount(ProcessControls, { props: defaultProps });

    await wrapper.get('[data-testid="process-button"]').trigger('click');
    expect(wrapper.emitted('process')).toBeTruthy();
  });

  // TODO: refactorizar con `it.for`
  it('should disable button when canProcess is false', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        canProcess: false
      }
    });

    expect(wrapper.get('[data-testid="process-button"]').attributes('disabled')).toBeDefined();
  });

  // TODO: refactorizar con `it.for`
  it('should show animated processing indicator and be disabled while processing is in progress', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        isLoading: true,
        canProcess: false
      }
    });

    const button = wrapper.getComponent<typeof VBtn>('[data-testid="process-button"]');
    expect(button.props('loading')).toBe(true);
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should emit update event when target language changes', async () => {
    const lang = 'es';
    const wrapper = mount(ProcessControls, { props: defaultProps });

    const languageSelector = wrapper.getComponent('[data-testid="language-selector"]');
    await languageSelector.setValue(lang);

    expect(wrapper.emitted('update:targetLanguage')?.[0]).toEqual([lang]);
  });

  it('should emit update event when summarize changes', async () => {
    const wrapper = mount(ProcessControls, { props: defaultProps });

    const checkbox = wrapper.getComponent('[data-testid="summarize-checkbox"]');
    await checkbox.setValue(true);

    expect(wrapper.emitted('update:summarize')?.[0]).toEqual([true]);
  });
});
