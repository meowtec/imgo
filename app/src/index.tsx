import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { listenEvents } from '@/platform';
import App from './app';
import { mutations } from './store';
import { preCheckAllCompat } from './lib/image-utils';
import { subscribeAppTheme } from './lib/theme';
import './index.css';

subscribeAppTheme();

void preCheckAllCompat().then(() => {
  mutations.batchPickRunTask();
  listenEvents();

  createRoot(document.querySelector('#root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
