import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LocalProcessingBadge from '@/components/LocalProcessingBadge.vue';

describe('LocalProcessingBadge', () => {
  it('should show the "locally processed" message correctly', () => {
    const wrapper = mount(LocalProcessingBadge);

    const badge = wrapper.find('[data-testid="local-processing-badge"]');
    expect(badge.exists()).toBe(true);

    const tooltip = wrapper.getComponent({ name: 'VTooltip' });
    expect(tooltip.props('text')).toBe('localProcessingBadge');
  });
});
