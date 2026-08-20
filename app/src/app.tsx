import AppOptionsWithModal from './components/options/app-options';
import { AppHeader } from './components/header';
import OptimizeDetailWithModal from './components/optimize-detail';
import { TaskList } from './components/task-list';
import GlobalSpin from './components/global-spin';
import { useStore, idRelations, viewBoxTasks } from './store';
import { taskCluster } from './lib/cluster';
import { Toaster } from './components/ui/sonner';
import { AlertDialogHost } from './components/alert-dialog';

Object.assign(window, {
  DEV: { taskCluster, useStore, idRelations, viewBoxTasks },
});

export interface AppProps {
  embedded?: boolean;
}

export default function App({ embedded = false }: AppProps) {
  return (
    <div className={embedded ? 'imgo-embedded' : undefined}>
      <AppHeader embedded={embedded} />
      <TaskList embedded={embedded} />
      <AppOptionsWithModal embedded={embedded} />
      <OptimizeDetailWithModal embedded={embedded} />
      <GlobalSpin contained={embedded} />
      <Toaster />
      <AlertDialogHost />
    </div>
  );
}
