import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { listenEvents } from '@/platform';
import App from './app';
import { mutations } from './store';
import { preCheckAllCompat } from './lib/image-utils';
import { initAppOptions } from './lib/app-options';
import { subscribeAppTheme } from './lib/theme';
import './index.css';

subscribeAppTheme();

void Promise.all([preCheckAllCompat(), initAppOptions()]).then(() => {
  mutations.batchPickRunTask();
  listenEvents();

  createRoot(document.querySelector('#root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
