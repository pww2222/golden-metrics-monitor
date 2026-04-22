import { createApp } from 'vue';
import Antd from 'ant-design-vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import 'ant-design-vue/dist/reset.css';
import './styles/index.less';

async function bootstrap() {
  // Enable MSW in development mode
  if (import.meta.env.DEV) {
    try {
      const { setupWorker } = await import('msw/browser');
      const { handlers } = await import('./mock/handlers');
      const worker = setupWorker(...handlers);
      await worker.start({ onUnhandledRequest: 'bypass' });
      console.log('[MSW] Mock Service Worker started');
    } catch (e) {
      console.error('[MSW] Failed to start:', e);
    }
  }

  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.use(Antd);
  app.mount('#app');
}

bootstrap();
