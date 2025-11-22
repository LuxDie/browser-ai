import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SummarizeOption from '@/components/SummarizeOption.vue';

describe('SummarizeOption', () => {
  it('should render checkbox with correct label', () => {
    const wrapper = mount(SummarizeOption, {
      props: {
        modelValue: false
      }
    });

    expect(wrapper.find('input#summarize-checkbox').exists()).toBe(true);
    expect(wrapper.text()).toContain('summarizeLabel');
  });

  it('should update modelValue when checkbox is toggled', async () => {
    const wrapper = mount(SummarizeOption, {
      props: {
        modelValue: false
      }
    });

    const checkbox = wrapper.find('input#summarize-checkbox');
    await checkbox.setValue(true);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
  });

  it('should reflect checked state from modelValue prop', () => {
    const wrapper = mount(SummarizeOption, {
      props: {
        modelValue: true
      }
    });

    const checkbox = wrapper.find('input#summarize-checkbox');
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
  });
});
