import { describe, it, expect, beforeEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import OutputArea from '@/components/OutputArea.vue';
import type { VTextarea } from 'vuetify/components';

const translatedText = 'This is a translated text';

describe('OutputArea', () => {
  let wrapper!: VueWrapper<any>;

  beforeEach(() => {
    wrapper = mount(OutputArea, {
      props: {
        modelValue: translatedText,
      },
    });
  });

  it('should send correct props to text output component', () => {
    const outputArea = wrapper.getComponent<typeof VTextarea>('[data-testid="output-area"]');
    expect(outputArea.props('modelValue')).toBe(translatedText);
  });

  it('should render "local processing" badge', () => {
    expect(wrapper.find('[data-testid="local-processing-badge"]').exists()).toBe(true);
  });

  it('should copy output content to clipboard when copy button is clicked', async () => {
    const copyButton = wrapper.get('[data-testid="copy-button"]');
    await copyButton.trigger('click');

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(translatedText);
  });
});
