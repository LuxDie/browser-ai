import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InputArea from '@/components/InputArea.vue';

describe('InputArea', () => {
  it('should render textarea with correct label', () => {
    const wrapper = mount(InputArea, {
      props: {
        modelValue: '',
        sourceLanguage: null
      }
    });

    expect(wrapper.find('label').text()).toBe('inputLabel');
    expect(wrapper.find('textarea').text()).toBe('');
  });

  it('should update modelValue when typing', async () => {
    const wrapper = mount(InputArea, {
      props: {
        modelValue: '',
        sourceLanguage: null
      }
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('Hello');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Hello']);
  });

  it('should show DetectedLanguage component when sourceLanguage is provided', () => {
    const wrapper = mount(InputArea, {
      props: {
        modelValue: '',
        sourceLanguage: 'en'
      }
    });

    expect(wrapper.findComponent({ name: 'DetectedLanguage' }).exists()).toBe(true);
  });

  it('should not show DetectedLanguage component when sourceLanguage is null', () => {
    const wrapper = mount(InputArea, {
      props: {
        modelValue: '',
        sourceLanguage: null
      }
    });

    expect(wrapper.findComponent({ name: 'DetectedLanguage' }).exists()).toBe(false);
  });
});
