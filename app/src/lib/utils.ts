import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  ImageObjectExt,
  TaskCompletedResult,
  TaskResult,
  OptionInputFormat,
  OptionOutputFormat,
} from '@/types';
import { FILE_FORMAT_DISPLAY } from '@/constants/format';
import { ALL_FORMAT, SAME_FORMAT } from '@/types';

export function define<T>(obj: T): T {
  return obj;
}

export const clamp = (num: number, min: number, max: number): number =>
  min > max ? clamp(num, max, min) : Math.min(max, Math.max(min, num));

export function resizeContain(
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number,
): { width: number; height: number } {
  if (width <= containerWidth && height <= containerHeight) {
    return { width, height };
  }

  const ratio = Math.min(containerWidth / width, containerHeight / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toNumber(str: string | number, defaultValue: number) {
  if (str === '' || str == null) {
    return defaultValue;
  }

  const num = Number(str);

  return Number.isNaN(num) ? defaultValue : num;
}

export function getFileNameFromPath(path: string) {
  return path.split(/\\|\//).pop();
}

export function isImageObject(obj: unknown): obj is ImageObjectExt {
  return Boolean(
    obj &&
    typeof obj === 'object' &&
    (obj as ImageObjectExt).file &&
    (obj as ImageObjectExt).format,
  );
}

export function isTaskResultComplete(
  taskResult: TaskResult | undefined,
): taskResult is TaskCompletedResult {
  return taskResult?.status === 'completed';
}

export function displayFormat(format: OptionInputFormat | OptionOutputFormat) {
  switch (format) {
    case SAME_FORMAT:
      return 'Same format';
    case ALL_FORMAT:
      return 'All';
    default:
      return FILE_FORMAT_DISPLAY.get(format) ?? format;
  }
}

export async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
