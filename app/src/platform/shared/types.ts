import type { ImageObject } from '@/gen-types/ImageObject';
import type { SaveFilesTriggerType } from '@/gen-types/SaveFilesTriggerType';
import type { FileObject, ImageOptimizeResult } from '@/types';
import type { ImageFormat, OptimizeOptions } from '@imgo/shared-js';

export interface ApiCalls {
  optimize: [
    {
      file: FileObject;
      outputFormat: ImageFormat;
      options: OptimizeOptions;
      idPrefix?: string;
    },
    ImageOptimizeResult,
  ];

  pick_files: [void, void];

  pick_folders: [void, void];

  add_files: [
    {
      files: File[];
    },
    void,
  ];

  save_files: [
    {
      images: ImageObject[];
      saveType: SaveFilesTriggerType;
    },
    string[],
  ];

  clear_files: [
    {
      ids: string[];
    },
    void,
  ];
}

export type Tuple2Api<T> = T extends [infer I, infer O] ? (params: I) => Promise<O> : never;
