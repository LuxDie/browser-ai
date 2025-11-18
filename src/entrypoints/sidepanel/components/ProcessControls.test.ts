import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import ProcessControls from './ProcessControls.vue';
import type { SupportedLanguageCode } from '@/entrypoints/background';

// Mock browser.i18n
vi.stubGlobal('browser', {
  i18n: {
    getMessage: vi.fn((key: string) => key),
  },
});

describe('ProcessControls.vue', () => {
  const defaultProps = {
    targetLanguage: 'es' as SupportedLanguageCode,
    summarize: false,
    availableLanguages: ['en', 'es', 'fr'] as SupportedLanguageCode[],
    isLoading: false,
    canProcess: true,
  };

  it('should render the component with correct structure', () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
    });

    expect(wrapper.find('#summarize-checkbox').exists()).toBe(true);
    expect(wrapper.find('#target-language').exists()).toBe(true);
    expect(wrapper.find('#process-button').exists()).toBe(true);
  });

  it('should display correct labels using i18n', () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
    });

    expect(wrapper.text()).toContain('optionsLabel');
    expect(wrapper.text()).toContain('summarizeLabel');
    expect(wrapper.text()).toContain('targetLanguageLabel');
  });

  it('should render available languages in select options', () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
    });

    const options = wrapper.findAll('#target-language option');
    expect(options).toHaveLength(3);
    expect(options.at(0)?.attributes('value')).toBe('en');
    expect(options.at(1)?.attributes('value')).toBe('es');
    expect(options.at(2)?.attributes('value')).toBe('fr');
  });

  it('should have checkbox checked when summarize is true', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        summarize: true,
      },
    });

    const checkbox = wrapper.find('#summarize-checkbox');
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
  });

  it('should have checkbox unchecked when summarize is false', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        summarize: false,
      },
    });

    const checkbox = wrapper.find('#summarize-checkbox');
    expect((checkbox.element as HTMLInputElement).checked).toBe(false);
  });

  it('should have select value set to targetLanguage', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        targetLanguage: 'fr' as SupportedLanguageCode,
      },
    });

    const select = wrapper.find('#target-language');
    expect((select.element as HTMLSelectElement).value).toBe('fr');
  });

  it('should emit update:summarize when checkbox changes', async () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
    });

    const checkbox = wrapper.find('#summarize-checkbox');
    await checkbox.setValue(true);

    const emitted = wrapper.emitted('update:summarize');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual([true]);
  });

  it('should emit update:targetLanguage when select changes', async () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
    });

    const select = wrapper.find('#target-language');
    await select.setValue('fr');

    const emittedTargetLanguage = wrapper.emitted('update:targetLanguage');
    expect(emittedTargetLanguage).toBeTruthy();
    expect(emittedTargetLanguage![0]).toEqual(['fr']);
  });

  it('should emit process when button is clicked', async () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
    });

    const button = wrapper.find('#process-button');
    await button.trigger('click');

    const emittedProcess = wrapper.emitted('process');
    expect(emittedProcess).toBeTruthy();
    expect(emittedProcess).toHaveLength(1);
  });

  it('should disable button when canProcess is false', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        canProcess: false,
      },
    });

    const button = wrapper.find('#process-button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should disable button when isLoading is true', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        isLoading: true,
      },
    });

    const button = wrapper.find('#process-button');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('should show loading text when isLoading is true', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        isLoading: true,
      },
    });

    const button = wrapper.find('#process-button');
    expect(button.text()).toContain('Procesando...');
  });

  it('should show process text when not loading', () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
    });

    const button = wrapper.find('#process-button');
    expect(button.text()).toContain('Procesar');
  });

  it('should show loading spinner when isLoading is true', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        isLoading: true,
      },
    });

    const spinner = wrapper.find('.loading-spinner');
    expect(spinner.exists()).toBe(true);
  });

  it('should not show loading spinner when not loading', () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
    });

    const spinner = wrapper.find('.loading-spinner');
    expect(spinner.exists()).toBe(false);
  });
});