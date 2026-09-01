import type { AppOptions, Task } from '@/types';
import { bigintToNumber } from './size-formatter';
import { isTaskResultComplete } from './utils';

type SkipSaveOptions = Pick<AppOptions, 'skipSaveType' | 'skipSaveMinRatio'>;

export function shouldSkipBatchSave(task: Task, options: SkipSaveOptions) {
  if (!isTaskResultComplete(task.result) || options.skipSaveType === 'NONE') {
    return false;
  }

  if (options.skipSaveType === 'SAME_FORMAT' && task.input.format !== task.outputFormat) {
    return false;
  }

  return (
    bigintToNumber(task.result.result.file.size) / bigintToNumber(task.input.file.size) >
    options.skipSaveMinRatio
  );
}
