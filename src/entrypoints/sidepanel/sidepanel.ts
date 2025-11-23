import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import '@/entrypoints/sidepanel/sidepanel.css';
import SidepanelApp from '@/entrypoints/sidepanel/SidepanelApp.vue';
import { vuetify } from '@/plugins/vuetify';
import { createApp, type Component } from 'vue';

// When the DOM is ready, mount the Vue component into a #root container.
document.addEventListener('DOMContentLoaded', () => {
  const app = createApp(SidepanelApp as Component);
  app.use(vuetify);
  app.mount('#root');
});
