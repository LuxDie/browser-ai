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

  it('should render the download progress and title', () => {
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: mockStatus,
      },
      global: {
        plugins: [vuetify],
      },
    });

<<<<<<< HEAD:src/components/ModelDownloadCard.test.ts
    expect(wrapper.find('h5').text()).toBe('downloadingSummarizer');
    expect(wrapper.text()).toContain('50%');
=======
    expect(wrapper.find('.v-card-title').text()).toBe('Descargando modelo de IA');
    // TODO: Add a specific check for the displayed percentage if needed, as the text content
    // might not directly contain "50%" due to v-progress-linear structure.
    // For now, relying on the progress bar width check in subsequent tests.
>>>>>>> af4e7ee (feat: migrate ProcessControls.vue to Vue 3 Composition API):src/entrypoints/sidepanel/components/ModelDownloadCard.test.ts
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
<<<<<<< HEAD:src/components/ModelDownloadCard.test.ts
  it('should render cancel button when canCancel is true and state is downloading', () => {
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: mockStatus,
        canCancel: true,
      },
    });

    const button = wrapper.find('button');
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

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('should not render cancel button when canCancel is false', () => {
    const wrapper = mount(ModelDownloadCard, {
      props: {
        status: mockStatus,
        canCancel: false,
      },
    });

    expect(wrapper.find('button').exists()).toBe(false);
  });
});
=======
});
>>>>>>> af4e7ee (feat: migrate ProcessControls.vue to Vue 3 Composition API):src/entrypoints/sidepanel/components/ModelDownloadCard.test.ts
