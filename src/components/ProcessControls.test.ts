import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ProcessControls from '@/components/ProcessControls.vue';

vi.mock('@/entrypoints/background/language/language.service', () => ({
  LanguageService: {
    getInstance: vi.fn(() => ({
      getLanguageKey: vi.fn((code: string) => `lang_${code}`)
    }))
  }
}));

describe('ProcessControls', () => {
  it('should emit process event when button is clicked', async () => {
    const wrapper = mount(ProcessControls, {
      props: {
        targetLanguage: 'en',
        summarize: false,
        supportedLanguages: ['en', 'es'],
        isLoading: false,
        canProcess: true
      }
    });

    await wrapper.find('button#process-button').trigger('click');
    expect(wrapper.emitted('process')).toBeTruthy();
  });

  it('should disable button when canProcess is false', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        targetLanguage: 'en',
        summarize: false,
        supportedLanguages: ['en', 'es'],
        isLoading: false,
        canProcess: false
      }
    });

    expect(wrapper.find('button#process-button').attributes('disabled')).toBeDefined();
  });

  it('should show processing text when isLoading is true', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        targetLanguage: 'en',
        summarize: false,
        supportedLanguages: ['en', 'es'],
        isLoading: true,
        canProcess: false
      }
    });

    expect(wrapper.find('button#process-button').text()).toBe('processingButton');
  });

  it('should update targetLanguage model', async () => {
    const wrapper = mount(ProcessControls, {
      props: {
        targetLanguage: 'en',
        summarize: false,
        supportedLanguages: ['en', 'es'],
        isLoading: false,
        canProcess: true
      }
    });

    const select = wrapper.find('select#target-language');
    await select.setValue('es');

    expect(wrapper.emitted('update:targetLanguage')?.[0]).toEqual(['es']);
  });

  it('should update summarize model', async () => {
    const wrapper = mount(ProcessControls, {
      props: {
        targetLanguage: 'en',
        summarize: false,
        supportedLanguages: ['en', 'es'],
        isLoading: false,
        canProcess: true
      }
    });

    const checkbox = wrapper.find('input#summarize-checkbox');
    await checkbox.setValue(true);

    expect(wrapper.emitted('update:summarize')?.[0]).toEqual([true]);
  });
});
