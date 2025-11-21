import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OutputArea from '@/components/OutputArea.vue';

describe('OutputArea', () => {
  it('should render nothing when translatedText is empty', () => {
    const wrapper = mount(OutputArea, {
      props: {
        translatedText: ''
      }
    });

    expect(wrapper.find('textarea').exists()).toBe(false);
  });

  it('should render textarea with translated text when provided', () => {
    const translatedText = 'Translated text';
    const wrapper = mount(OutputArea, {
      props: {
        translatedText
      }
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);
    expect((textarea.element as HTMLTextAreaElement).value).toBe(translatedText);
  });
});
