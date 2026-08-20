import type { ImageFormat, ImageResolution, OptimizeOptions } from '@imgo/shared-js';
import type { FileObject } from '@/gen-types/FileObject';
import type { ImageObject } from '@/gen-types/ImageObject';
import type { ImageOptimizeResult } from '@/gen-types/ImageOptimizeResult';

interface ImageObjectExt extends ImageObject {
  thumb?: ImageObject | 'ING' | 'ERR';
}

export type { FileObject, ImageResolution, ImageObjectExt, OptimizeOptions, ImageOptimizeResult };

export type AppTheme = 'light' | 'dark' | 'system';

export interface ImageOptimizeOptions {
  outputFormat: ImageFormat;
  options: OptimizeOptions;
}

export type SkipSaveType = 'NONE' | 'SAME_FORMAT' | 'ALL';

export const SAME_FORMAT = '__SAME__';

export const ALL_FORMAT = '*';

export type OptionInputFormat = ImageFormat | typeof ALL_FORMAT;

export type OptionOutputFormat = ImageFormat | typeof SAME_FORMAT;

export enum SimplifiedQuality {
  VERY_LOW = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  HIGHEST = 4,
}

export interface TaskErrorResult {
  status: 'error';
  error: string;
}

export interface TaskProcessingResult {
  status: 'processing';
  processId: string;
}

export interface TaskCompletedResult {
  status: 'completed';
  saved: boolean;
  result: ImageObjectExt;
}

export type TaskResult = TaskErrorResult | TaskProcessingResult | TaskCompletedResult;

export interface Task {
  id: string;
  input: ImageObjectExt;
  outputFormat: ImageFormat;
  options: OptimizeOptions;
  result?: TaskResult;
}

export interface GlobalDefaultOptions {
  inputFormats: OptionInputFormat[];
  outputFormat: OptionOutputFormat;
  options: OptimizeOptions;
}

export interface AppOptions {
  skipSaveType: SkipSaveType;
  skipSaveMinRatio: number;
  globalDefaultOptions: GlobalDefaultOptions[];
  appTheme: AppTheme;
}
