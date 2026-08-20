import { clone } from 'lodash-es';
import { resize } from '@imgo/shared-js';
import type { ImageObject } from '@/gen-types/ImageObject';
import { optimize } from '@/platform';
import type { ApiCalls } from '@/platform/shared/types';
import type { ImageOptimizeResult } from '@/types';
import { idRelations } from '@/store';
import { sha256 } from '../utils';

const cachedOptimizeMap = new Map<string, Promise<ImageOptimizeResult>>();

type CachedOptimizeParams = Omit<ApiCalls['optimize'][0], 'file'> & {
  input: ImageObject;
};

function getOptimizeParamsCacheKey(params: CachedOptimizeParams) {
  const clonedParams = clone(params);

  const resizeOption = clonedParams.options.resize;
  const inputResolution = clonedParams.input.resolution;

  if (resizeOption && inputResolution) {
    const targetSize = resize(
      {
        width: inputResolution.width,
        height: inputResolution.height,
      },
      {
        width: resizeOption.width,
        height: resizeOption.height,
      },
      resizeOption.type,
    );

    clonedParams.options.resize = {
      width: targetSize.width,
      height: targetSize.height,
      type: 'EXACT',
    };
  }

  return sha256(
    JSON.stringify({
      file: clonedParams.input.file.id,
      outputFormat: clonedParams.outputFormat,
      options: clonedParams.options,
      idPrefix: clonedParams.idPrefix,
    }),
  );
}

export async function cachedOptimize(params: CachedOptimizeParams) {
  const cacheKey = await getOptimizeParamsCacheKey(params);

  if (cachedOptimizeMap.has(cacheKey)) {
    return cachedOptimizeMap.get(cacheKey)!;
  }

  const promise = optimize({
    file: params.input.file,
    outputFormat: params.outputFormat,
    options: params.options,
    idPrefix: params.idPrefix,
  });

  cachedOptimizeMap.set(cacheKey, promise);
  return promise.then((result) => {
    const sourceId = params.input.file.id;
    const list = idRelations.get(sourceId) || [];
    list.push(result.image.file.id);
    idRelations.set(sourceId, list);

    return result;
  });
}
