import type { Task } from '@/types';
import { viewBoxTasks } from './store';
import type { StoreState } from './types';
import { isTaskResultComplete } from '@/lib/utils';
import { bigintToNumber } from '@/lib/size-formatter';

export const selectPendingTask = (
  state: StoreState,
): { type: 'thumb' | 'normal'; task: Task } | null => {
  const thumbTask = state.tasks.find((item) => !item.input.thumb && viewBoxTasks.has(item.id));

  if (thumbTask) {
    return { type: 'thumb', task: thumbTask };
  }

  const task = state.tasks.find((item) => !item.result);

  if (task) {
    return { type: 'normal', task };
  }

  return null;
};

export const selectActiveTask = (state: StoreState) => {
  return state.tasks.find((item) => item.id === state.activeTaskId) ?? null;
};

export const selectCompleteCount = (state: StoreState) => {
  let count = 0;
  state.tasks.forEach((task) => {
    if (isTaskResultComplete(task.result)) {
      count += 1;
    }
  });
  return count;
};

export const selectFileSizes = (state: StoreState) => {
  let totalSizeSum = 0;
  let optimizedSizeSum = 0;

  state.tasks.forEach((task) => {
    totalSizeSum += bigintToNumber(task.input.file.size);
    optimizedSizeSum += bigintToNumber(
      isTaskResultComplete(task.result) ? task.result.result.file.size : task.input.file.size,
    );
  });

  return {
    totalSizeSum,
    optimizedSizeSum,
  };
};
