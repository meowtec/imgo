import { describe, expect, it } from 'vitest';
import { createWheelEventNormalizer } from './mouse-event';

function wheelEvent({
  deltaX = 0,
  deltaY,
  deltaMode = 0,
  ctrlKey = false,
  timeStamp = 0,
}: {
  deltaX?: number;
  deltaY: number;
  deltaMode?: number;
  ctrlKey?: boolean;
  timeStamp?: number;
}) {
  return { deltaX, deltaY, deltaMode, ctrlKey, timeStamp } as React.WheelEvent;
}

describe('createWheelEventNormalizer', () => {
  it('treats coarse pixel deltas as mouse wheel zoom', () => {
    const normalizeWheelEvent = createWheelEventNormalizer();

    expect(normalizeWheelEvent(wheelEvent({ deltaY: -120 }))).toMatchObject({
      type: 'zoom',
      zoom: 2,
    });
    expect(normalizeWheelEvent(wheelEvent({ deltaY: 120 }))).toMatchObject({
      type: 'zoom',
      zoom: 0.5,
    });
  });

  it('treats line-based deltas as mouse wheel zoom', () => {
    const normalizeWheelEvent = createWheelEventNormalizer();

    expect(normalizeWheelEvent(wheelEvent({ deltaY: -3, deltaMode: 1 }))).toMatchObject({
      type: 'zoom',
      zoom: 2,
    });
  });

  it('treats macOS wheel steps as mouse wheel zoom', () => {
    const normalizeWheelEvent = createWheelEventNormalizer();

    expect(normalizeWheelEvent(wheelEvent({ deltaY: 4.000244140625 }))).toMatchObject({
      type: 'zoom',
      zoom: 0.5,
    });
  });

  it('keeps trackpad scrolling as image movement', () => {
    const normalizeWheelEvent = createWheelEventNormalizer();

    expect(normalizeWheelEvent(wheelEvent({ deltaX: 2, deltaY: 8 }))).toEqual({
      type: 'move',
      zoom: 1,
      x: 2,
      y: 8,
    });
  });

  it('keeps the input type stable throughout a trackpad gesture', () => {
    const normalizeWheelEvent = createWheelEventNormalizer();

    expect(normalizeWheelEvent(wheelEvent({ deltaY: 2, timeStamp: 0 })).type).toBe('move');
    expect(normalizeWheelEvent(wheelEvent({ deltaY: 46, timeStamp: 16 })).type).toBe('move');
    expect(normalizeWheelEvent(wheelEvent({ deltaY: 93, timeStamp: 32 })).type).toBe('move');
    expect(normalizeWheelEvent(wheelEvent({ deltaY: 120, timeStamp: 200 })).type).toBe('zoom');
  });

  it('keeps ctrl-wheel gestures as trackpad zoom', () => {
    const normalizeWheelEvent = createWheelEventNormalizer();

    expect(normalizeWheelEvent(wheelEvent({ deltaY: -2, ctrlKey: true }))).toMatchObject({
      type: 'zoom',
      zoom: 1.02 ** 2,
    });
  });
});
