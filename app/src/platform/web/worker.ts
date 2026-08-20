import { initWasmModule } from '@imgo/minifier-js';
import { provideMethods } from '@/lib/worker/guest';
import type { WorkerApis } from './types';

const wasmModulePromise = initWasmModule();

provideMethods<WorkerApis>({
  optimize: async (file, outputFormat, options) => {
    const wasmModule = await wasmModulePromise;
    const arrayBuffer = await file.arrayBuffer();
    const array = new Uint8Array(arrayBuffer);
    const result = wasmModule.minify(array, outputFormat, options);

    return {
      data: new Blob([result.data], {
        type: `image/${result.outputFormat}`,
      }),
      outputFormat: result.outputFormat,
      inputResolution: result.inputResolution,
      outputResolution: result.outputResolution,
    };
  },
});
