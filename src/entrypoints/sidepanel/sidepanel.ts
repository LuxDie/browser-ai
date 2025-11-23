import { createApp, type Component } from 'vue';
import SidepanelApp from '@/entrypoints/sidepanel/SidepanelApp.vue';

// When the DOM is ready, mount the Vue component into a #root container.
document.addEventListener('DOMContentLoaded', () => {
  let container = document.getElementById('root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);
  }
  // The component itself will handle messaging (sidepanelReady, etc.)
  createApp(SidepanelApp as Component).mount(container);
});
