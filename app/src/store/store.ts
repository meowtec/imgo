import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { ALL_FORMAT } from '@/types';
import { DEFAULT_SKIP_SAVE_MIN_RATIO } from '@/constants/app';
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
    skipSaveType: 'SAME_FORMAT',
    skipSaveMinRatio: DEFAULT_SKIP_SAVE_MIN_RATIO,
    globalDefaultOptions: [
      {
        inputFormats: [ALL_FORMAT],
        outputFormat: 'AVIF', // 'self',
        options: {
          indexed: false,
          quality: 70,
        },
      },
    ],
    appTheme: 'light',
  },
  appOptionsVisible: false,
  activeTaskId: null,
};

export const useStore = create(
  subscribeWithSelector(
    persist<StoreState, [], [], Pick<StoreState, 'appOptions'>>(() => initialState, {
      name: 'minifier',
      partialize: (state) => ({
        appOptions: state.appOptions,
      }),
    }),
  ),
);
