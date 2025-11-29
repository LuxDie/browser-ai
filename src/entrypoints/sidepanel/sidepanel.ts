import '@/entrypoints/sidepanel/sidepanel.css';
import SidepanelApp from '@/entrypoints/sidepanel/SidepanelApp.vue';
import { createApp } from 'vue';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';

document.addEventListener('DOMContentLoaded', () => {
  createApp(SidepanelApp as Component).mount('#root');

  // Eventos intermediarios entre la app Vue y sidepanel
  onMessage('modelStatusUpdate', (message) => {
    window.dispatchEvent(new CustomEvent('modelStatusUpdate', { detail: message.data }));
  });

  onMessage('selectedText', (message) => {
    window.dispatchEvent(new CustomEvent('selectedText', { detail: message.data }));
  });

  window.addEventListener('sidepanelReady', () => {
    void sendMessage('sidepanelReady');
  });
});
