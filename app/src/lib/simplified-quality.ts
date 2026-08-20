import { SIMPLIFIED_QUALITY_MAP } from '@/constants/simplified-quality';
import { clamp } from '@/lib/utils';
import { SimplifiedQuality } from '@/types';

/**
 * 将一个百分比质量转换成简化的质量等级
 * 计算 quality 跟 SIMPLIFIED_QUALITY_MAP 的差值，然后根据差值判断在哪个区间
 * @param quality
 */
export function simplifyQuality(quality: number): SimplifiedQuality {
  for (let sq = SimplifiedQuality.VERY_LOW; sq <= SimplifiedQuality.HIGHEST; sq++) {
    if (quality < SIMPLIFIED_QUALITY_MAP[sq]) {
      if (sq === SimplifiedQuality.VERY_LOW) {
        return sq;
      }

      const q = SIMPLIFIED_QUALITY_MAP[sq];
      const prevQ = SIMPLIFIED_QUALITY_MAP[(sq - 1) as SimplifiedQuality];

      if (quality < (q + prevQ) / 2) {
        return sq - 1;
      } else {
        return sq;
      }
    }
  }

  return SimplifiedQuality.HIGHEST;
}

/**
 * 将简化的质量等级转换成百分比质量
 * @param simplifiedQuality
 */
export function unsimplifyQuality(simplifiedQuality: SimplifiedQuality): number {
  return clamp(SIMPLIFIED_QUALITY_MAP[simplifiedQuality], 0, 100);
}
