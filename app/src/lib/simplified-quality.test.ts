import { test, expect } from 'vitest';
import { simplifyQuality } from './simplified-quality';
import { SimplifiedQuality } from '@/types';

test('simplified quality', () => {
  expect(simplifyQuality(0)).toBe(SimplifiedQuality.VERY_LOW);
  expect(simplifyQuality(25)).toBe(SimplifiedQuality.VERY_LOW);
  expect(simplifyQuality(30)).toBe(SimplifiedQuality.VERY_LOW);
  expect(simplifyQuality(40)).toBe(SimplifiedQuality.LOW);
  expect(simplifyQuality(50)).toBe(SimplifiedQuality.LOW);
  expect(simplifyQuality(60)).toBe(SimplifiedQuality.MEDIUM);
  expect(simplifyQuality(70)).toBe(SimplifiedQuality.MEDIUM);
  expect(simplifyQuality(80)).toBe(SimplifiedQuality.HIGH);
  expect(simplifyQuality(90)).toBe(SimplifiedQuality.HIGH);
  expect(simplifyQuality(95)).toBe(SimplifiedQuality.HIGH);
  expect(simplifyQuality(100)).toBe(SimplifiedQuality.HIGHEST);
});
