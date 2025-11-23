import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ModelDownloadCard from '@/components/ModelDownloadCard.vue';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import { VCardTitle, VProgressLinear, VBtn } from 'vuetify/components';

describe('ModelDownloadCard.vue', () => {
  const mockStatus: AIModelStatus = {
    state: 'downloading',
    downloadProgress: 50,
  };

  it('should render the download progress and title', () => {
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: mockStatus,
      },
    });

    expect(wrapper.findComponent(VCardTitle).text()).toBe('downloadingSummarizer');
    expect(wrapper.text()).toContain('50%');
  });

  it('should update the progress bar width based on downloadProgress', () => {
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: mockStatus,
      },
    });

    const progressBar = wrapper.findComponent(VProgressLinear);
    expect(progressBar.props('modelValue')).toBe(50);
  });

  it('should render with 0% progress correctly', () => {
    const zeroProgressStatus: AIModelStatus = { ...mockStatus, downloadProgress: 0 };
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: zeroProgressStatus,
      },
    });

    expect(wrapper.text()).toContain('0%');
    const progressBar = wrapper.findComponent(VProgressLinear);
    expect(progressBar.props('modelValue')).toBe(0);
  });

  it('should render with 100% progress correctly', () => {
    const fullProgressStatus: AIModelStatus = { ...mockStatus, downloadProgress: 100 };
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: fullProgressStatus,
      },
    });

    expect(wrapper.text()).toContain('100%');
    const progressBar = wrapper.findComponent(VProgressLinear);
    expect(progressBar.props('modelValue')).toBe(100);
  });

  it('should render cancel button when canCancel is true and state is downloading', () => {
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: mockStatus,
        canCancel: true,
      },
    });

    const button = wrapper.findComponent(VBtn);
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe('cancelDownload');
  });

  it('should emit cancel event when button is clicked', async () => {
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: mockStatus,
        canCancel: true,
      },
    });

    await wrapper.findComponent(VBtn).trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('should not render cancel button when canCancel is false', () => {
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: mockStatus,
        canCancel: false,
      },
    });

    expect(wrapper.findComponent(VBtn).exists()).toBe(false);
  });
});
