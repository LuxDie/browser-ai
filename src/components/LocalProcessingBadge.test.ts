import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LocalProcessingBadge from '@/components/LocalProcessingBadge.vue';

describe('LocalProcessingBadge', () => {
  it('should render the badge with correct text', () => {
    const wrapper = mount(LocalProcessingBadge);

    expect(wrapper.text()).toContain('localProcessingBadge');
    expect(wrapper.find('#processing-source').exists()).toBe(true);
  });
});
