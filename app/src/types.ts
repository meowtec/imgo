import type { ImageFormat, ImageResolution, OptimizeOptions } from '@imgo/shared-js';
import type { FileObject } from '@/gen-types/FileObject';
import type { ImageObject } from '@/gen-types/ImageObject';
import type { ImageOptimizeResult } from '@/gen-types/ImageOptimizeResult';
import type { AppOptions } from '@/gen-types/AppOptions';
import type { AppTheme } from '@/gen-types/AppTheme';
import type { GlobalDefaultOptions } from '@/gen-types/GlobalDefaultOptions';
import type { SkipSaveType } from '@/gen-types/SkipSaveType';

interface ImageObjectExt extends ImageObject {
  thumb?: ImageObject | 'ING' | 'ERR';
}

export type { FileObject, ImageResolution, ImageObjectExt, OptimizeOptions, ImageOptimizeResult };

// App options schema is defined in Rust and generated with ts-rs.
// See `app/src-tauri/src/app_options.rs`.
export type { AppOptions, AppTheme, GlobalDefaultOptions, SkipSaveType };

export interface ImageOptimizeOptions {
  outputFormat: ImageFormat;
  options: OptimizeOptions;
}

// UI-only sentinels for the format selectors. They are never persisted: the
// stored schema uses an empty `inputFormats` list for "all formats" and a
// `null` output format for "same as input".
export const SAME_FORMAT = '__SAME__';

export const ALL_FORMAT = '*';

export type FormatSelectValue = ImageFormat | typeof SAME_FORMAT | typeof ALL_FORMAT;

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
