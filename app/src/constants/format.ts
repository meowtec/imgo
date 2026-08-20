import type { ImageFormat } from '@imgo/shared-js';

const FORMATS_FOR_WEB: ImageFormat[] = [
  'JPEG',
  'PNG',
  'GIF',
  'WEBP',
  'AVIF',
  'HEIC',
  'BMP',
  'TIFF',
];

export const FILE_FORMAT_DISPLAY = new Map<ImageFormat, string>([
  ['JPEG', 'JPEG'],
  ['PNG', 'PNG'],
  ['GIF', 'GIF'],
  ['WEBP', 'WEBP'],
  ['HEIC', 'HEIC'],
  ['AVIF', 'AVIF'],
  ['BMP', 'BMP'],
  ['TIFF', 'TIFF'],
  ['JXL', 'JXL'],
  ['PNM', 'PBM'],
  ['TGA', 'TGA'],
  ['DDS', 'DDS'],
  ['ICO', 'ICO'],
  ['HDR', 'HDR'],
  ['OPENEXR', 'EXR'],
  ['FARBFELD', 'FF'],
  ['QOI', 'QOI'],
]);

function filterFormats(formats: ImageFormat[]): ImageFormat[] {
  return RUNTIME === 'web' ? formats.filter((format) => FORMATS_FOR_WEB.includes(format)) : formats;
}

export const ALL_FILE_FORMATS = filterFormats(Array.from(FILE_FORMAT_DISPLAY.keys()));

export const POPULAR_FORMATS: ImageFormat[] = filterFormats([
  'JPEG',
  'PNG',
  'GIF',
  'WEBP',
  'AVIF',
  'HEIC',
  'JXL',
]);

const LOSSLESS_FORMATS = new Set<ImageFormat>(['PNG', 'WEBP', 'AVIF', 'HEIC', 'JXL']);

export function supportsLossless(format: ImageFormat): boolean {
  return LOSSLESS_FORMATS.has(format);
}
