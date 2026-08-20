import type { AppOptions, Task } from '@/types';

export interface StoreState {
  addLoading: {
    ids: string[];
    latestFileName: string;
  };
  tasks: Task[];
  appOptions: AppOptions;
  appOptionsVisible: boolean;
  activeTaskId: string | null;
}
