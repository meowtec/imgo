import type { ImageFormat } from '@imgo/shared-js';
import { define } from './utils';

function checkFormatCompat(type: ImageFormat, dataUrl: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    image.src = dataUrl;
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
  });
}

const FORMAT_SAMPLES: Array<[ImageFormat, string]> = [
  [
    'AVIF',
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUEAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABUAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgSAAAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB1tZGF0EgAKBzgABhAgIGkyCB/wAABAAK9w',
  ],
  ['JXL', 'data:image/jxl;base64,/woAELASCAgQADAASxiLFcJJQR6A/vQH'],
  ['WEBP', 'data:image/webp;base64,UklGRhYAAABXRUJQVlA4TAoAAAAvAAAAAEX/I/of'],
  [
    'HEIC',
    'data:image/heif;base64,AAAAGGZ0eXBoZWljAAAAAG1pZjFoZWljAAABKm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAHBpY3QAXABjADEANQB4ADIAAAAADnBpdG0AAAAAAAEAAAAiaWxvYwAAAABEQAABAAEAAAAAAUoAAQAAAAAAAAA4AAAAI2lpbmYAAAAAAAEAAAAVaW5mZQIAAAAAAQAAaHZjMQAAAACqaXBycAAAAI1pcGNvAAAAcWh2Y0MBBAgAAAAAAAAAAAD/8AD8/fj4AAAPAyAAAQAXQAEMAf//BAgAAAMAn6gAAAMAAP+6AkAhAAEAJkIBAQQIAAADAJ+oAAADAAD/oCCBBZbqSSiuAQAAAwABAAADAAEIIgABAAZEAcFxiRIAAAAUaXNwZQAAAAAAAABAAAAAQAAAABVpcG1hAAAAAAAAAAEAAQKBAgAAAEBtZGF0AAAANCgBrwW4FIPqI0Af91/uf7X9b878787878989898989898989/4UETMJZQNe2nK06cUg1sA=',
  ],
];

const formatsSupported: Map<ImageFormat, boolean | null> = new Map(
  FORMAT_SAMPLES.map(([format]) => [format, null]),
);

export function preCheckAllCompat() {
  return Promise.all(
    FORMAT_SAMPLES.map(([type, url]) =>
      checkFormatCompat(type, url).then((supported) => {
        formatsSupported.set(type, supported);
      }),
    ),
  );
}

/**
 * Check is image type supported by browser
 * WARNING: DO NOT CALL `isImageFormatSupported` in top level scope
 * @param type
 * @returns
 */
export function isImageFormatSupported(type: ImageFormat) {
  // WELL-KNOWN formats
  if (define<ImageFormat[]>(['JPEG', 'PNG', 'GIF', 'ICO', 'BMP']).includes(type)) {
    return true;
  }

  if (formatsSupported.has(type)) {
    return formatsSupported.get(type);
  }

  return false;
}
