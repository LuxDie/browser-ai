import '@/entrypoints/sidepanel/sidepanel.css';
import SidepanelApp from '@/entrypoints/sidepanel/SidepanelApp.vue';

// When the DOM is ready, mount the Vue component into a #root container.
document.addEventListener('DOMContentLoaded', () => {
  createApp(SidepanelApp as Component).mount('#root');
});
