import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import '@/entrypoints/sidepanel/sidepanel.css';
import SidepanelApp from '@/entrypoints/sidepanel/SidepanelApp.vue';
import { vuetify } from '@/plugins/vuetify';
import { createApp, type Component } from 'vue';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';

document.addEventListener('DOMContentLoaded', () => {
  createApp(SidepanelApp as Component).use(vuetify).mount('#root');

  // Eventos intermediarios entre la app Vue y sidepanel
  onMessage('modelStatusUpdate', (message) => {
    window.dispatchEvent(new CustomEvent('modelStatusUpdate', { detail: message.data }));
  });

  onMessage('selectedText', (message) => {
    window.dispatchEvent(new CustomEvent('selectedText', { detail: message.data }));
  });

  window.addEventListener('appMounted', () => {
    void sendMessage('sidepanelReady');
  });
});
