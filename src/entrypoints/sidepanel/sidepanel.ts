import { createApp } from 'vue';
import SidepanelApp from './SidepanelApp.vue';
import vuetify from '@/plugins/vuetify';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const app = createApp(SidepanelApp);
app.use(vuetify);
app.mount('#root');