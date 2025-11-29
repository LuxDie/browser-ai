import '@/entrypoints/sidepanel/sidepanel.css';
import SidepanelApp from '@/entrypoints/sidepanel/SidepanelApp.vue';
import { createApp } from 'vue';
import { onMessage, sendMessage } from '@/entrypoints/background/messaging';

// When the DOM is ready, mount the Vue component into a #root container.
document.addEventListener('DOMContentLoaded', () => {
  createApp(SidepanelApp).mount('#root');

 // Puente: Mensajes del background -> CustomEvents DOM para Vue app
 onMessage('modelStatusUpdate', (message) => {
   window.dispatchEvent(new CustomEvent('modelStatusUpdate', { detail: message.data }));
 });

 onMessage('selectedText', (message) => {
   window.dispatchEvent(new CustomEvent('selectedText', { detail: message.data }));
 });

 // Puente: CustomEvent Vue -> Mensaje al background
 window.addEventListener('sidepanelReady', () => {
   sendMessage('sidepanelReady');
 });
});
