import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ModelDownloadCard from '@/components/ModelDownloadCard.vue';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import vuetify from '@/plugins/vuetify';

describe('ModelDownloadCard.vue', () => {
  const mockStatus: AIModelStatus = {
    state: 'downloading',
    downloadProgress: 50,
  };

  const mountComponent = (props: any) => {
    return mount(ModelDownloadCard, {
      props,
      global: {
        plugins: [vuetify],
      },
    });
  };

  it('should render progress and title', () => {
    const wrapper = mountComponent({ status: mockStatus });
    expect(wrapper.find('.v-card-title').text()).toContain('downloadingSummarizer');
    expect(wrapper.text()).toContain('50%');
  });

  it('should render cancel button', async () => {
    const wrapper = mountComponent({ status: mockStatus, canCancel: true });
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('should emit cancel event on click', async () => {
    const wrapper = mountComponent({ status: mockStatus, canCancel: true });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});
