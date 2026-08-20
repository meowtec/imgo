import { displayFormat } from '@/lib/utils';
import { POPULAR_FORMATS } from './format';

export const POPULAR_FORMAT_OPTIONS = POPULAR_FORMATS.map((format) => ({
  value: format,
  label: displayFormat(format),
}));
