import { event } from '@tauri-apps/api';
import { mutations } from '@/store';
import type { ImageObjectExt } from '@/types';
import type { SaveFilesTriggerType } from '@/gen-types/SaveFilesTriggerType';
import { ask } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { ShowConfirmParams } from '@/components/alert-dialog/api';
import type { ApiCalls, Tuple2Api } from '../shared/types';

export function listenEvents() {
  void event.listen('file-add', (e: event.Event<{ id: string; images: ImageObjectExt[] }>) => {
    console.log('[event]file-add', e);
    mutations.endLoading(e.payload.id);
    mutations.addTasks(e.payload.images);
  });

  void event.listen('file-add-start', (e: event.Event<{ id: string }>) => {
    console.log('[event]file-add-start', e);
    mutations.startLoading(e.payload.id);
  });

  void event.listen('file-add-progress', (e: event.Event<{ id: string; file_name: string }>) => {
    console.log('[event]file-add-progress', e);
    const { id, file_name } = e.payload;
    mutations.updateLoading(id, file_name);
  });

  void event.listen('save', (e: event.Event<SaveFilesTriggerType>) => {
    console.log('[event]save', e);
    mutations.saveCompleted(e.payload);
  });
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
