import { StrictMode, useEffect, useState } from 'react';
import { listenEvents } from '@/platform';
import App from './app';
import { mutations } from './store';
import { preCheckAllCompat } from './lib/image-utils';
import { subscribeAppTheme } from './lib/theme';
import { i18n } from './lib/i18n';
import './index.css';

export interface AppEmbedProps {
  embedded?: boolean;
  locale?: string;
}

let bootstrapPromise: Promise<void> | null = null;

function ensureBootstrap(embedded: boolean) {
  if (!bootstrapPromise) {
    if (!embedded) {
      subscribeAppTheme();
    }

    bootstrapPromise = preCheckAllCompat().then(() => {
      mutations.batchPickRunTask();
      listenEvents();
    });
  }

  return bootstrapPromise;
}

export default function AppEmbed({ embedded = false, locale = navigator.language }: AppEmbedProps) {
  i18n.setLocale(locale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (embedded) {
      subscribeAppTheme('light');
    }

    void ensureBootstrap(embedded).then(() => setReady(true));
  }, [embedded]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        {i18n.text('loading')}
      </div>
    );
  }

  return (
    <StrictMode>
      <App embedded={embedded} />
    </StrictMode>
  );
}
