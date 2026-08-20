import {
  type WheelEvent,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useEffectEvent,
  useState,
} from 'react';

interface WheelData {
  type: 'zoom' | 'move';
  zoom: number;
  x: number;
  y: number;
}

type WheelInputType = 'mouse' | 'trackpad';

const MACOS_WHEEL_DELTA = 4.000244140625;
const WHEEL_GESTURE_GAP = 100;

function getWheelInputType(wheelEvent: WheelEvent): WheelInputType {
  const { deltaMode, deltaX, deltaY } = wheelEvent;
  const macosWheelSteps = deltaY / MACOS_WHEEL_DELTA;
  const isMacosMouseWheel =
    !deltaX &&
    deltaY !== 0 &&
    Math.abs(macosWheelSteps - Math.round(macosWheelSteps)) < Number.EPSILON;

  return deltaMode !== 0 || isMacosMouseWheel || (!deltaX && Math.abs(deltaY) >= 40)
    ? 'mouse'
    : 'trackpad';
}

function getWheelFromEvent(wheelEvent: WheelEvent, inputType: WheelInputType): WheelData {
  const wheelData: WheelData = {
    type: 'zoom',
    zoom: 1,
    x: 0,
    y: 0,
  };

  const { deltaX, deltaY, ctrlKey } = wheelEvent;

  if (inputType === 'mouse') {
    wheelData.type = 'zoom';
    wheelData.zoom = deltaY > 0 ? 1 / 2 : 2;
  } else if (ctrlKey) {
    wheelData.type = 'zoom';
    wheelData.zoom = 1.02 ** -deltaY;
  } else {
    wheelData.type = 'move';
    wheelData.x = deltaX;
    wheelData.y = deltaY;
  }

  return wheelData;
}

/**
 * WheelEvent does not expose whether the source is a mouse or trackpad.
 * Classify the first event of a gesture heuristically, then keep that
 * classification stable so trackpad momentum cannot switch from pan to zoom.
 * Mouse-wheel input always maps to zoom; trackpad scrolling maps to pan.
 */
export function createWheelEventNormalizer() {
  let inputType: WheelInputType | null = null;
  let lastEventTime = -Infinity;

  return (wheelEvent: WheelEvent): WheelData => {
    // Browsers use ctrlKey for trackpad pinch-to-zoom.
    if (wheelEvent.ctrlKey) {
      inputType = 'trackpad';
      lastEventTime = wheelEvent.timeStamp;
      return getWheelFromEvent(wheelEvent, 'trackpad');
    }

    if (inputType == null || wheelEvent.timeStamp - lastEventTime > WHEEL_GESTURE_GAP) {
      inputType = getWheelInputType(wheelEvent);
    }
    lastEventTime = wheelEvent.timeStamp;

    return getWheelFromEvent(wheelEvent, inputType);
  };
}

export function eventOffset(e: MouseEvent, el: HTMLElement) {
  const bounds = el.getBoundingClientRect();
  return {
    x: e.clientX - bounds.left,
    y: e.clientY - bounds.top,
  };
}

interface MouseDragEventData<T> {
  startClientX: number;
  startClientY: number;
  data: T;
}

interface EventPosition {
  clientX: number;
  clientY: number;
}

export function useMouseDrag<T>(config: {
  onMove: (startPosition: EventPosition, position: EventPosition, data: T) => void;
  onEnd: (data: T) => void;
  data: T;
}) {
  const [eventData, setEventData] = useState<MouseDragEventData<T> | null>(null);
  const onMove = useEffectEvent(config.onMove);
  const onEnd = useEffectEvent(config.onEnd);

  useEffect(() => {
    if (eventData == null) return;

    const handleMouseMove = (e: MouseEvent) => {
      onMove(
        {
          clientX: eventData.startClientX,
          clientY: eventData.startClientY,
        },
        {
          clientX: e.clientX,
          clientY: e.clientY,
        },
        eventData.data,
      );
    };

    const handleMouseUp = () => {
      onEnd(eventData.data);
      setEventData(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [eventData]);

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    setEventData({
      startClientX: e.clientX,
      startClientY: e.clientY,
      data: config.data,
    });
  };

  return {
    onMouseDown: handleMouseDown,
  };
}
