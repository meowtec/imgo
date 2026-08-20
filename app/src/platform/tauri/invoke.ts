import { core } from '@tauri-apps/api';
import { type InvokeArgs } from '@tauri-apps/api/core';
import type { ApiCalls } from '../shared/types';

function createInvoke<T extends keyof ApiCalls>(method: T) {
  return async (params: ApiCalls[T][0]): Promise<ApiCalls[T][1]> => {
    console.log(`[invoke] ${method} request`, params);
    try {
      const res = await core.invoke(method, params as InvokeArgs);
      console.log(`[invoke] ${method} response`, res);
      return res as ApiCalls[T][1];
    } catch (err) {
      console.error(`[invoke] ${method} error`, err);
      throw err;
    }
  };
}

export const optimize = createInvoke('optimize');
export const openSelectFilesDialog = createInvoke('pick_files');
export const openSelectFoldersDialog = createInvoke('pick_folders');
export const saveFiles = createInvoke('save_files');
export const clearFiles = createInvoke('clear_files');
