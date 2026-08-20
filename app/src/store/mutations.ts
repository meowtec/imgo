import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import type { ImageFormat, OptimizeOptions } from '@imgo/shared-js';
import type { SaveFilesTriggerType } from '@/gen-types/SaveFilesTriggerType';
import type { ImageObject } from '@/gen-types/ImageObject';
import { clearFiles, saveFiles } from '@/platform';
import {
  ALL_FORMAT,
  SAME_FORMAT,
  type AppOptions,
  type ImageObjectExt,
  type ImageOptimizeOptions,
  type Task,
} from '@/types';
import { taskCluster } from '@/lib/cluster';
import { isTaskResultComplete } from '@/lib/utils';
import { removeNulls, updateArrayItem } from '@/lib/array';
import { cachedOptimize } from '@/lib/services/optimize';
import { ITEM_INNER_HEIGHT } from '@/constants/layout';
import { i18n } from '@/lib/i18n';
import { idRelations, useStore } from './store';
import { selectPendingTask } from './selectors';

function getAllRelatedIds(id: string) {
  const list = idRelations.get(id) || [];
  return [...list, id];
}

function clearRelatedIds(sourceIds: string[]) {
  const relatedIds = sourceIds.flatMap(getAllRelatedIds);
  void clearFiles({
    ids: relatedIds,
  });
}

function getDefaultOptions(
  inputFormat: ImageFormat,
  appOptions: AppOptions,
): { outputFormat: ImageFormat; options: OptimizeOptions } {
  const defaultOptions = appOptions.globalDefaultOptions.find((item) => {
    if (item.inputFormats.length === 0 || item.inputFormats.includes(ALL_FORMAT)) {
      return true;
    }

    return item.inputFormats.includes(inputFormat);
  });

  if (defaultOptions) {
    return {
      outputFormat:
        defaultOptions.outputFormat === SAME_FORMAT ? inputFormat : defaultOptions.outputFormat,
      options: defaultOptions.options,
    };
  }

  return {
    outputFormat: inputFormat,
    options: {
      indexed: false,
      quality: 75,
    },
  };
}

function updateTaskItem(
  filter: (task: Task) => boolean,
  partial: Partial<Task> | ((prev: Task) => Partial<Task>),
) {
  useStore.setState((state) => ({
    tasks: updateArrayItem(state.tasks, filter, partial),
  }));
}

function updateTaskItemById(id: string, partial: Partial<Task> | ((prev: Task) => Partial<Task>)) {
  updateTaskItem((item) => item.id === id, partial);
}

export const mutations = {
  startLoading(id: string) {
    useStore.setState((state) => ({
      addLoading: {
        ids: [...state.addLoading.ids, id],
        latestFileName: '',
      },
    }));
  },

  endLoading(id: string) {
    useStore.setState((state) => ({
      addLoading: {
        ids: state.addLoading.ids.filter((item) => item !== id),
        latestFileName: '',
      },
    }));
  },

  updateLoading(id: string, fileName: string) {
    useStore.setState((state) => ({
      addLoading: {
        ids: state.addLoading.ids,
        latestFileName: fileName,
      },
    }));
  },

  addTasks(images: ImageObjectExt[]) {
    useStore.setState((state) => {
      const existedIdSet = new Set(state.tasks.map((item) => item.id));

      return {
        tasks: [
          ...state.tasks,
          ...images
            .map<Task>((item) => ({
              id: item.file.id,
              input: item,
              ...getDefaultOptions(item.format, state.appOptions),
            }))
            .filter((item) => !existedIdSet.has(item.id)),
        ],
      };
    });

    mutations.batchPickRunTask();
  },

  removeTasks(ids: string[]) {
    const idSet = new Set(ids);

    useStore.setState((state) => ({
      tasks: state.tasks.filter((item) => !idSet.has(item.id)),
    }));

    clearRelatedIds(ids);
  },

  removeAllTasks() {
    const { tasks } = useStore.getState();
    useStore.setState({
      tasks: [],
    });

    clearRelatedIds(tasks.map((task) => task.id));
  },

  rerunAllUseGlobalDefaultOptions() {
    useStore.setState((state) => ({
      tasks: state.tasks.map((item) => ({
        ...item,
        ...getDefaultOptions(item.input.format, state.appOptions),
        result: undefined,
      })),
    }));

    mutations.batchPickRunTask();
  },

  setActiveTaskId(id: string | null) {
    useStore.setState({ activeTaskId: id });
  },

  setAppOptionsVisible(visible: boolean) {
    useStore.setState({ appOptionsVisible: visible });
  },

  pickRunTask() {
    if (!taskCluster.available) {
      return;
    }

    const pendingTaskResult = selectPendingTask(useStore.getState());
    if (!pendingTaskResult) {
      return;
    }

    const { task: pendingTask } = pendingTaskResult;

    const updatePendingTask = (partial: Partial<Task> | ((prev: Task) => Partial<Task>)) =>
      updateTaskItemById(pendingTask.id, partial);

    if (pendingTaskResult.type === 'thumb') {
      taskCluster.addTask(
        cachedOptimize({
          input: pendingTask.input,
          outputFormat: 'WEBP',
          idPrefix: 'thumb/',
          options: {
            quality: 85,
            fastest: true,
            resize: {
              width: ITEM_INNER_HEIGHT * 2,
              height: ITEM_INNER_HEIGHT * 2,
              type: 'DOWNSIZE_COVER',
            },
          },
        })
          .then((result) => {
            updatePendingTask((task) => ({
              input: {
                ...task.input,
                resolution: result.inputResolution,
                thumb: result.image,
              },
            }));
          })
          .catch(() => {
            updatePendingTask({ input: { ...pendingTask.input, thumb: 'ERR' } });
          }),
      );

      updatePendingTask({ input: { ...pendingTask.input, thumb: 'ING' } });
    } else {
      const processId = nanoid();
      const updateProcessingTask = (partial: Partial<Task> | ((prev: Task) => Partial<Task>)) => {
        updateTaskItem(
          (task) =>
            task.id === pendingTask.id &&
            task.result?.status === 'processing' &&
            task.result.processId === processId,
          partial,
        );
      };

      taskCluster.addTask(
        cachedOptimize({
          input: pendingTask.input,
          outputFormat: pendingTask.outputFormat,
          options: pendingTask.options,
        })
          .then((result) => {
            updateProcessingTask((task) => ({
              input: {
                ...task.input,
                resolution: result.inputResolution,
              },
              result: { status: 'completed', result: result.image, saved: false },
            }));
          })
          .catch((err) => {
            updateProcessingTask({ result: { status: 'error', error: String(err) } });
          }),
      );

      updatePendingTask({ result: { status: 'processing', processId } });
    }

    mutations.batchPickRunTask(0);
  },

  batchPickRunTask: (() => {
    let batching = false;
    return (delay = 500) => {
      if (batching) return;

      batching = true;
      setTimeout(() => {
        batching = false;
        mutations.pickRunTask();
      }, delay);
    };
  })(),

  updateAppOptions(appOptions: Partial<AppOptions>, rerunAll: boolean) {
    useStore.setState((state) => {
      const newOptions = {
        ...state.appOptions,
        ...appOptions,
      };

      return {
        appOptions: newOptions,
        tasks: rerunAll
          ? state.tasks.map<Task>((task) => ({
              ...task,
              ...getDefaultOptions(task.input.format, newOptions),
              result: undefined,
            }))
          : state.tasks,
      };
    });

    mutations.batchPickRunTask(0);
  },

  updateTaskOptions(id: string, options: ImageOptimizeOptions) {
    updateTaskItemById(id, {
      ...options,
      result: undefined,
    });

    mutations.batchPickRunTask(0);
  },

  async saveImages(type: SaveFilesTriggerType, images: ImageObject[]) {
    if (images.length === 0) {
      return;
    }

    const savedIds = await saveFiles({
      images,
      saveType: type,
    });

    const savedIdSet = new Set(savedIds);

    updateTaskItem(
      (item) => isTaskResultComplete(item.result) && savedIdSet.has(item.result.result.file.id),
      (item) => {
        if (isTaskResultComplete(item.result)) {
          return {
            result: {
              ...item.result,
              saved: true,
            },
          };
        }

        return item;
      },
    );

    console.log('savedIds', savedIds);

    if (savedIds.length === 0) {
      toast(i18n.text('save_failed'), {
        description: i18n.text('save_failed_description'),
      });
    } else {
      toast(i18n.text('save_success'), {
        description: i18n.textTpl('images_saved', [String(savedIds.length)]),
      });
    }
  },

  saveCompleted(type: SaveFilesTriggerType) {
    const completeImages = removeNulls(
      useStore.getState().tasks.map((item) => {
        if (isTaskResultComplete(item.result)) {
          return item.result.result;
        }

        return null;
      }),
    );

    void mutations.saveImages(type, completeImages);
  },
};

taskCluster.onIdle = () => mutations.batchPickRunTask();
