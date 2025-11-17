import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushPromises, resetDOM } from '@/tests/utils';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import { createApp, ref, onMounted } from 'vue';
import ModelDownloadCard from './components/ModelDownloadCard.vue';

// Mock the messaging system
vi.mock('@/entrypoints/background/messaging');

const mockedOnMessage = vi.mocked(onMessage);
const mockedSendMessage = vi.mocked(sendMessage);

// Recreate the app setup logic for a controlled test environment
const TestApp = {
  components: {
    ModelDownloadCard,
  },
  setup() {
    const modelStatus = ref<AIModelStatus | null>(null);

    onMounted(() => {
      onMessage('modelStatusUpdate', (message) => {
        if (message.data.state === 'downloading') {
          modelStatus.value = message.data;
        } else {
          modelStatus.value = null;
        }
      });
      void mockedSendMessage('sidepanelReady');
    });

    return {
      modelStatus,
    };
  },
  template: `
    <div class="p-4">
      <ModelDownloadCard v-if="modelStatus" :status="modelStatus" />
    </div>
  `,
};

describe('Sidepanel Vue App', () => {
  let messageListeners: Record<string, (data: any) => void> = {};

  beforeEach(() => {
    resetDOM();
    vi.clearAllMocks();
    messageListeners = {};

    mockedOnMessage.mockImplementation((name, callback) => {
      messageListeners[name] = callback as (data: any) => void;
      return () => {
        messageListeners[name] = undefined!;
      };
    });

    // Mount the app in a controlled way
    createApp(TestApp).mount('#root');
  });

  const simulateMessage = async (name: string, data: any) => {
    if (messageListeners[name]) {
      messageListeners[name]({ name, data });
    }
    await flushPromises();
  };

  it('should call sendMessage("sidepanelReady") when mounted', async () => {
    await flushPromises();
    expect(mockedSendMessage).toHaveBeenCalledWith('sidepanelReady');
  });

  it('should not display ModelDownloadCard initially', () => {
    const card = document.querySelector('.w-full.max-w-sm');
    expect(card).toBeNull();
  });

  it('should display ModelDownloadCard when a "modelStatusUpdate" with "downloading" is received', async () => {
    const mockStatus: AIModelStatus = {
      state: 'downloading',
      downloadProgress: 30,
    };

    await simulateMessage('modelStatusUpdate', mockStatus);

    const card = document.querySelector('.w-full.max-w-sm');
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain('Descargando modelo de IA');
    expect(card?.textContent).toContain('30.00%');
  });

  it('should hide ModelDownloadCard when a "modelStatusUpdate" with a status other than "downloading" is received', async () => {
    // First, show the card
    const downloadingStatus: AIModelStatus = {
      state: 'downloading',
      downloadProgress: 50,
    };
    await simulateMessage('modelStatusUpdate', downloadingStatus);
    expect(document.querySelector('.w-full.max-w-sm')).not.toBeNull();

    // Then, send a message that should hide it
    const downloadedStatus: AIModelStatus = {
      state: 'available',
      downloadProgress: 100,
    };
    await simulateMessage('modelStatusUpdate', downloadedStatus);

    const card = document.querySelector('.w-full.max-w-sm');
    expect(card).toBeNull();
  });
});
