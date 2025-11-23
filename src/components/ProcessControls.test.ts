import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ProcessControls from './ProcessControls.vue';
import type { SupportedLanguageCode } from '@/entrypoints/background';
import vuetify from '@/plugins/vuetify';

describe('ProcessControls.vue', () => {
  const defaultProps = {
    targetLanguage: 'es' as SupportedLanguageCode,
    summarize: false,
    availableLanguages: ['en', 'es', 'fr'] as SupportedLanguageCode[],
    isLoading: false,
    canProcess: true,
  };

  const mountComponent = (props: any) => {
    return mount(ProcessControls, {
      props,
      global: {
        plugins: [vuetify],
      },
    });
  };

  it('should render correctly', () => {
    const wrapper = mountComponent(defaultProps);
    expect(wrapper.find('#summarize-checkbox').exists()).toBe(true);
    expect(wrapper.find('#target-language').exists()).toBe(true);
    expect(wrapper.find('#process-button').exists()).toBe(true);
  });

  it('should emit process event when button is clicked', async () => {
    const wrapper = mountComponent(defaultProps);
    await wrapper.find('#process-button').trigger('click');
    expect(wrapper.emitted('process')).toBeTruthy();
  });

  it('should disable button when canProcess is false', () => {
    const wrapper = mountComponent({ ...defaultProps, canProcess: false });
    expect(wrapper.find('#process-button').attributes('disabled')).toBeDefined();
  });
});
