import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AppOptions } from '@/types';
import { DEFAULT_NEW_FILE_NAME_SUFFIX, DEFAULT_SKIP_SAVE_MIN_RATIO } from '@/constants/app';
import type { StoreState } from './types';

export const viewBoxTasks = new Set<string>();

export const idRelations = new Map<string, string[]>();

const initialState: StoreState = {
  addLoading: {
    ids: [],
    latestFileName: '',
  },
  tasks: [],
  appOptions: {
    skipSaveType: 'NONE',
    skipSaveMinRatio: DEFAULT_SKIP_SAVE_MIN_RATIO,
    newFileNameSuffix: DEFAULT_NEW_FILE_NAME_SUFFIX,
    globalDefaultOptions: [
      {
        // Empty means "all input formats".
        inputFormats: [],
        outputFormat: 'WEBP',
        options: {
          indexed: false,
          quality: 70,
        },
      },
    ],
    appTheme: 'light',
    confirmOnClose: true,
  },
  appOptionsVisible: false,
  activeTaskId: null,
};

/**
 * Merge (possibly partial/legacy) persisted options on top of the defaults.
 * `persist` was removed, options are now hydrated from the platform storage
 * adapter (Rust config file on desktop, localStorage on web).
 */
export function withDefaultAppOptions(options?: Partial<AppOptions> | null): AppOptions {
  return {
    ...initialState.appOptions,
    ...options,
  };
}

export const useStore = create(subscribeWithSelector<StoreState>(() => initialState));
