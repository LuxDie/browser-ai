import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { VProgressLinear } from 'vuetify/components';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import ModelDownloadCard from '@/components/ModelDownloadCard.vue';

const mockStatus: AIModelStatus = {
  state: 'downloading',
  downloadProgress: 50,
};

const mountOptions = { props: { status: mockStatus } };

describe('ModelDownloadCard.vue', () => {
  it('should render download progress and title', () => {
    const wrapper = mount(ModelDownloadCard, mountOptions);

    expect(wrapper.text()).toContain('downloadingSummarizer');
    expect(wrapper.text()).toContain('50%');
  });

  it('should render cancel button with correct label', () => {
    const wrapper = mount(ModelDownloadCard, mountOptions);

    const button = wrapper.get('[data-testid="cancel-download-button"]');
    expect(button.text()).toBe('cancelDownload');
  });

  it.for([
    ['', 'downloading', true],
    [' not', 'unavailable', false],
    [' not', 'downloadable', false],
    [' not', 'available', false],
  ] as const)('should%s render cancel button when state is %s',
    ([_, state, expected]) => {
      const wrapper = mount(ModelDownloadCard, {
        ...mountOptions,
        props: { status: { ...mockStatus, state } },
      });

      const button = wrapper.find('[data-testid="cancel-download-button"]');
      expect(button.exists()).toBe(expected);
    });

  it('should render title with source and target languages when params are provided', () => {
    const params = { source: 'Inglés', target: 'Castellano' };
    const correctMessage = 'Descargando Inglés - Castellano';
    vi.mocked(browser.i18n.getMessage).mockImplementation((key, substitutions) => {
      if (key === 'downloadingTranslator'
        && Array.isArray(substitutions)
        && substitutions.length >= 2) {
        return correctMessage;
      }
      return key;
    });
    const wrapper = mount(ModelDownloadCard, {
      ...mountOptions,
      props: { status: mockStatus, params },
    });

    expect(wrapper.text()).toContain(correctMessage);
  });

  it('should emit cancel event when button is clicked', async () => {
    const wrapper = mount(ModelDownloadCard, mountOptions);

    await wrapper.get('[data-testid="cancel-download-button"]').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('should pass model to progress indicator correctly', () => {
    const wrapper = mount(ModelDownloadCard, mountOptions);

    const progressLinear = wrapper
      .getComponent<typeof VProgressLinear>('[data-testid="progress-indicator"]');
    expect(progressLinear.props('modelValue')).toBe(50);
  });
});
