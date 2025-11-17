import { createApp, ref, onMounted } from 'vue';
import ModelDownloadCard from './components/ModelDownloadCard.vue';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import './sidepanel.css';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
createApp({
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

      // Notify background that the sidepanel is ready
      void sendMessage('sidepanelReady');
    });

    return {
      modelStatus,
    };
  },
  template: `
    <div class="p-4">
      <ModelDownloadCard v-if="modelStatus" :status="modelStatus" />
      <!-- The rest of the sidepanel UI will be added here in the future -->
    </div>
  `,
}).mount('#root');