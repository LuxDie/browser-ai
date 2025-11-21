import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ModelDownloadCard from '@/components/ModelDownloadCard.vue';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';

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

    expect(wrapper.find('h5').text()).toBe('downloadingSummarizer');
    expect(wrapper.text()).toContain('50%');
  });

  it('should update the progress bar width based on downloadProgress', () => {
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: mockStatus,
      },
    });

    const progressBar = wrapper.find('.bg-blue-600');
    expect(progressBar.attributes('style')).toContain('width: 50%');
  });

  it('should render with 0% progress correctly', () => {
    const zeroProgressStatus: AIModelStatus = { ...mockStatus, downloadProgress: 0 };
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: zeroProgressStatus,
      },
    });

    expect(wrapper.text()).toContain('0%');
    const progressBar = wrapper.find('.bg-blue-600');
    expect(progressBar.attributes('style')).toContain('width: 0%');
  });

  it('should render with 100% progress correctly', () => {
    const fullProgressStatus: AIModelStatus = { ...mockStatus, downloadProgress: 100 };
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: fullProgressStatus,
      },
    });

    expect(wrapper.text()).toContain('100%');
    const progressBar = wrapper.find('.bg-blue-600');
    expect(progressBar.attributes('style')).toContain('width: 100%');
  });
});
