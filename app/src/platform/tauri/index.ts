import { event } from '@tauri-apps/api';
import { mutations, useStore } from '@/store';
import type { StoreState } from '@/store/types';
import type { AppOptions, ImageObjectExt } from '@/types';
import type { SaveFilesTriggerType } from '@/gen-types/SaveFilesTriggerType';
import { ask } from '@tauri-apps/plugin-dialog';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import type { ShowConfirmParams } from '@/components/alert-dialog/api';
import type { ApiCalls, Tuple2Api } from '../shared/types';
import { getAppOptions, setAppOptions, setHasTasks } from './invoke';

/**
 * On desktop the Rust side owns the persisted options (the single source of
 * truth). These adapters read/write them through Tauri commands.
 */
export function loadAppOptions(): Promise<Partial<AppOptions> | null> {
  return getAppOptions();
}

export async function saveAppOptions(options: AppOptions): Promise<void> {
  await setAppOptions({ options });
}

function selectHasTasks(state: StoreState) {
  return state.tasks.length > 0 || state.addLoading.ids.length > 0;
}

/**
 * The close-confirmation decision is made in Rust (it owns `confirmOnClose`),
 * but only the frontend knows whether the queue has pending tasks.
 */
function syncHasTasks() {
  const sync = () => {
    void setHasTasks({ hasTasks: selectHasTasks(useStore.getState()) });
  };

  sync();
  useStore.subscribe(selectHasTasks, sync);
}

export function listenEvents() {
  syncHasTasks();

  void Promise.all([
    event.listen('file-add', (e: event.Event<{ id: string; images: ImageObjectExt[] }>) => {
      console.log('[event]file-add', e);
      mutations.endLoading(e.payload.id);
      mutations.addTasks(e.payload.images);
    }),
    event.listen('file-add-start', (e: event.Event<{ id: string }>) => {
      console.log('[event]file-add-start', e);
      mutations.startLoading(e.payload.id);
    }),
    event.listen('file-add-progress', (e: event.Event<{ id: string; file_name: string }>) => {
      console.log('[event]file-add-progress', e);
      const { id, file_name } = e.payload;
      mutations.updateLoading(id, file_name);
    }),
    event.listen('save', (e: event.Event<SaveFilesTriggerType>) => {
      console.log('[event]save', e);
      mutations.saveCompleted(e.payload);
    }),
  ]).then(() => invoke('frontend_ready'));
}

export function showConfirm(params: ShowConfirmParams): Promise<boolean> {
  return ask(params.message, {
    title: params.title,
    okLabel: params.confirmText,
    cancelLabel: params.cancelText,
  });
}

export function useFileUrl(id: string | null) {
  return id ? convertFileSrc(`${window.cacheImageRootPath}/${id}`) : null;
}

export const addFiles: Tuple2Api<ApiCalls['add_files']> = () => {
  throw new Error('unimplemented');
};

export {
  optimize,
  openSelectFilesDialog,
  openSelectFoldersDialog,
  saveFiles,
  clearFiles,
} from './invoke';
