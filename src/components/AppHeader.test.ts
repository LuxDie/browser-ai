import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppHeader from '@/components/AppHeader.vue';

describe('AppHeader', () => {
  it('should show warning when native browser APIs are not available', () => {
    const wrapper = mount(AppHeader, {
      props: {
        apiAvailable: false
      }
    });

    expect(wrapper.text()).toContain('apiWarning');
  });

  it('should not show warning when native browser APIs are available', () => {
    const wrapper = mount(AppHeader, {
      props: {
        apiAvailable: true
      }
    });

    expect(wrapper.text()).not.toContain('apiWarning');
  });
});
