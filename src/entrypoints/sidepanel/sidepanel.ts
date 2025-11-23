
import '@mdi/font/css/materialdesignicons.css';
import '@/entrypoints/sidepanel/sidepanel.css';
import SidepanelApp from '@/entrypoints/sidepanel/SidepanelApp.vue';
import { createApp, type Component } from 'vue';
import vuetify from '@/plugins/vuetify';

// When the DOM is ready, mount the Vue component into a #root container.
document.addEventListener('DOMContentLoaded', () => {
  createApp(SidepanelApp as Component).use(vuetify).mount('#root');
});
