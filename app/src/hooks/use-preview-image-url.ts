import { useEffect, useState } from 'react';
import type { ImageFormat } from '@imgo/shared-js';
import { useFileUrl } from '@/platform';
import { isImageFormatSupported } from '@/lib/image-utils';
import type { ImageObjectExt } from '@/types';
import type { ImageObject } from '@/gen-types/ImageObject';
import { cachedOptimize } from '@/lib/services/optimize';

function getPreviewId(image: ImageObject) {
  const previewSupportedFormat =
    (['WEBP'] satisfies ImageFormat[]).find(isImageFormatSupported) ?? 'PNG';

  return cachedOptimize({
    input: image,
    outputFormat: previewSupportedFormat,
    options: {
      quality: 100,
      fastest: true,
    },
  }).then((result) => result.image.file.id);
}

export function usePreviewImageId(image: ImageObjectExt | null | undefined) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  const supported = image ? isImageFormatSupported(image.format) : null;

  useEffect(() => {
    if (supported || !image) return;

    let aborted = false;

    void getPreviewId(image).then((id) => {
      if (aborted) return;
      setPreviewId(id);
    });

    return () => {
      aborted = true;
    };
  }, [image, supported]);

  if (image && supported) {
    return image.file.id;
  }

  return previewId;
}

export function usePreviewImageUrl(image: ImageObjectExt | null | undefined) {
  const previewId = usePreviewImageId(image);
  return useFileUrl(previewId);
}
