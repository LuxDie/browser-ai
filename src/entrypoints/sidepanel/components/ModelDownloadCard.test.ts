import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ModelDownloadCard from './ModelDownloadCard.vue';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import vuetify from '@/plugins/vuetify';

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
      global: {
        plugins: [vuetify],
      },
    });

    expect(wrapper.find('.v-card-title').text()).toBe('Descargando modelo de IA');
    // TODO: Add a specific check for the displayed percentage if needed, as the text content
    // might not directly contain "50%" due to v-progress-linear structure.
    // For now, relying on the progress bar width check in subsequent tests.
  });

  it('should update the progress bar width based on downloadProgress', () => {
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: mockStatus,
      },
      global: {
        plugins: [vuetify],
      },
    });

    const progressBar = wrapper.find('.v-progress-linear__determinate');
    expect(progressBar.attributes('style')).toContain('width: 50%');
  });

  it('should render with 0% progress correctly', () => {
    const zeroProgressStatus: AIModelStatus = { ...mockStatus, downloadProgress: 0 };
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: zeroProgressStatus,
      },
      global: {
        plugins: [vuetify],
      },
    });

    const progressBar = wrapper.find('.v-progress-linear__determinate');
    expect(progressBar.attributes('style')).toContain('width: 0%');
  });

  it('should render with 100% progress correctly', () => {
    const fullProgressStatus: AIModelStatus = { ...mockStatus, downloadProgress: 100 };
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: fullProgressStatus,
      },
      global: {
        plugins: [vuetify],
      },
    });

    const progressBar = wrapper.find('.v-progress-linear__determinate');
    expect(progressBar.attributes('style')).toContain('width: 100%');
  });
});