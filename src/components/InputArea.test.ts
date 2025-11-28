import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { VTextarea } from 'vuetify/components';
import InputArea from '@/components/InputArea.vue';
import type DetectedLanguage from '@/components/DetectedLanguage.vue';

describe('InputArea', () => {
  it('should send correct label and model to v-textarea', () => {
    const wrapper = mount(InputArea, {
      props: {
        modelValue: '',
        language: null
      }
    });

    expect(wrapper.getComponent<typeof VTextarea>('[data-testid="input-area"]')
      .props()).toMatchObject({
        label: 'inputLabel',
        modelValue: ''
      });
  });

  it('should update modelValue when typing', async () => {
    const text = 'Hello';
    const wrapper = mount(InputArea, {
      props: {
        modelValue: '',
        language: null
      }
    });

    const vTextArea = wrapper.getComponent('[data-testid="input-area"]');
    await vTextArea.setValue(text);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([text]);
  });

  it.for([{
    language: 'en',
    expected: true
  }, {
    language: null,
    expected: false
  }] as const)('should set detected language visibility to $expected when source language is $language',
    ({ language, expected }) => {
      const wrapper = mount(InputArea, {
        props: {
          modelValue: 'This is a long text',
          language
        },
      });

      expect(wrapper.findComponent<typeof DetectedLanguage>('[data-testid="detected-language-code"]')
        .exists()).toBe(expected);
    },
  );
});
