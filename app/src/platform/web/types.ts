import type { ImageResolution } from '@/gen-types/ImageResolution';
import type { ImageFormat, OptimizeOptions } from '@imgo/shared-js';

export type WorkerApis = {
  optimize: (
    blob: Blob,
    outputFormat: ImageFormat,
    options: OptimizeOptions,
  ) => Promise<{
    data: Blob;
    outputFormat: ImageFormat;
    inputResolution: ImageResolution;
    outputResolution: ImageResolution;
  }>;
};
