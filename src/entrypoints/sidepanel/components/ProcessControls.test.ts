import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import ProcessControls from './ProcessControls.vue';
import type { SupportedLanguageCode } from '@/entrypoints/background';
import vuetify from '@/plugins/vuetify';

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
      global: {
        plugins: [vuetify],
      },
    });

    expect(wrapper.find('.v-checkbox').exists()).toBe(true);
    expect(wrapper.find('.v-select').exists()).toBe(true);
    expect(wrapper.find('.v-btn').exists()).toBe(true);
  });

  it('should display correct labels using i18n', () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
      global: {
        plugins: [vuetify],
      },
    });

    expect(wrapper.find('.v-checkbox').text()).toContain('summarizeLabel');
    expect(wrapper.find('.v-select').text()).toContain('targetLanguageLabel');
  });

  it('should render available languages in select options', () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
      global: {
        plugins: [vuetify],
      },
    });

    const select = wrapper.findComponent({ name: 'VSelect' });
    expect(select.props('items')).toEqual(defaultProps.availableLanguages);
  });

  it('should have checkbox checked when summarize is true', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        summarize: true,
      },
      global: {
        plugins: [vuetify],
      },
    });

    const checkbox = wrapper.findComponent({ name: 'VCheckbox' });
    expect(checkbox.props('modelValue')).toBe(true);
  });

  it('should have checkbox unchecked when summarize is false', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        summarize: false,
      },
      global: {
        plugins: [vuetify],
      },
    });

    const checkbox = wrapper.findComponent({ name: 'VCheckbox' });
    expect(checkbox.props('modelValue')).toBe(false);
  });

  it('should have select value set to targetLanguage', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        targetLanguage: 'fr' as SupportedLanguageCode,
      },
      global: {
        plugins: [vuetify],
      },
    });

    const select = wrapper.findComponent({ name: 'VSelect' });
    expect(select.props('modelValue')).toBe('fr');
  });

  it('should emit update:summarize when checkbox changes', () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
      global: {
        plugins: [vuetify],
      },
    });

    const checkbox = wrapper.findComponent({ name: 'VCheckbox' });
    checkbox.vm.$emit('update:modelValue', true);

    const emitted = wrapper.emitted('update:summarize');
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual([true]);
  });

  it('should emit update:targetLanguage when select changes', () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
      global: {
        plugins: [vuetify],
      },
    });

    const select = wrapper.findComponent({ name: 'VSelect' });
    select.vm.$emit('update:modelValue', 'fr');

    const emittedTargetLanguage = wrapper.emitted('update:targetLanguage');
    expect(emittedTargetLanguage).toBeTruthy();
    expect(emittedTargetLanguage![0]).toEqual(['fr']);
  });

  it('should emit process when button is clicked', async () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
      global: {
        plugins: [vuetify],
      },
    });

    const button = wrapper.findComponent({ name: 'VBtn' });
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
      global: {
        plugins: [vuetify],
      },
    });

    const button = wrapper.findComponent({ name: 'VBtn' });
    expect(button.props('disabled')).toBe(true);
  });

  it('should disable button when isLoading is true', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        isLoading: true,
      },
      global: {
        plugins: [vuetify],
      },
    });

    const button = wrapper.findComponent({ name: 'VBtn' });
    expect(button.props('disabled')).toBe(true);
  });

  it('should show loading text when isLoading is true', () => {
    const wrapper = mount(ProcessControls, {
      props: {
        ...defaultProps,
        isLoading: true,
      },
      global: {
        plugins: [vuetify],
      },
    });

    const button = wrapper.findComponent({ name: 'VBtn' });
    expect(button.props('loading')).toBe(true);
  });

  it('should show process text when not loading', () => {
    const wrapper = mount(ProcessControls, {
      props: defaultProps,
      global: {
        plugins: [vuetify],
      },
    });

    const button = wrapper.findComponent({ name: 'VBtn' });
    expect(button.text()).toContain('Procesar');
  });
});