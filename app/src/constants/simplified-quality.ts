import { SimplifiedQuality } from '@/types';
import { i18n } from '@/lib/i18n';

/**
 * 简化质量对应的百分比质量
 */
export const SIMPLIFIED_QUALITY_MAP = {
  // VERY LOW: 15 - 35
  [SimplifiedQuality.VERY_LOW]: 25,
  // LOW: 35 - 55
  [SimplifiedQuality.LOW]: 45,
  // MEDIUM: 55 - 75
  [SimplifiedQuality.MEDIUM]: 65,
  // HIGH: 75 - 95
  [SimplifiedQuality.HIGH]: 85,
  // HIGHEST: 95 - 100
  [SimplifiedQuality.HIGHEST]: 110,
};

export const LOSSLESS_QUALITY = 'LOSSLESS';

export function getSimplifiedQualityOptions(losslessSupported: boolean) {
  return [
    {
      value: LOSSLESS_QUALITY,
      label: i18n.text('lossless'),
      disabled: !losslessSupported,
    },
    { value: SimplifiedQuality.HIGHEST, label: i18n.text('highest_quality') },
    { value: SimplifiedQuality.HIGH, label: i18n.text('high_quality') },
    { value: SimplifiedQuality.MEDIUM, label: i18n.text('medium_quality') },
    { value: SimplifiedQuality.LOW, label: i18n.text('low_quality') },
    { value: SimplifiedQuality.VERY_LOW, label: i18n.text('very_low_quality') },
  ];
}
