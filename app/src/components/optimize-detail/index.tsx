import { useRef, useState, useMemo, useEffect, type SetStateAction } from 'react';
import { useMeasure } from 'react-use';
import { mergeRefs } from 'react-merge-refs';
import { LiaSortSolid } from 'react-icons/lia';
import { keyframes, type CSSObject } from '@emotion/react';
import { selectActiveTask, mutations, useStore } from '@/store';
import { clamp, cn, resizeContain, isTaskResultComplete } from '@/lib/utils';
import { createWheelEventNormalizer, eventOffset, useMouseDrag } from '@/lib/mouse-event';
import { sizeFormatter } from '@/lib/size-formatter';
import { OptimizeOptionsCard } from '../options/optimize-options';
import { usePreviewImageUrl } from '@/hooks/use-preview-image-url';
import { FullScreenModal } from '../ui/full-screen-modal';
import type { Task } from '@/types';

interface ImageTransform {
  zoom: number;
  x: number;
  y: number;
  transition: boolean;
}

const fullCss: CSSObject = {
  position: 'absolute',
  display: 'block',
  width: '100%',
  height: '100%',
};

const highlightAnimation = keyframes`
  from {
    transform: translate3d(-150%, 0, 0) skewX(-15deg);
  }

  to {
    transform: translate3d(250%, 0, 0) skewX(-15deg);
  }
`;

interface OptimizeDetailProps {
  task: Task | null;
}

export function OptimizeDetail({ task }: OptimizeDetailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const normalizeWheelEvent = useMemo(() => createWheelEventNormalizer(), []);
  const [containerMeasureRef, containerSize] = useMeasure<HTMLDivElement>();
  const mergedContainerRef = useMemo(
    () => mergeRefs([containerRef, containerMeasureRef]),
    [containerRef, containerMeasureRef],
  );

  const [imageNaturalSize, setImageNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [splitLeft, setSplitLeft] = useState<null | number>(null);
  const [splitDragging, setSplitDragging] = useState(false);

  const prevContainerWidth = useRef(0);

  const inputPreviewUrl = usePreviewImageUrl(task?.input);
  const outputPreviewUrl = usePreviewImageUrl(
    isTaskResultComplete(task?.result) ? task.result.result : null,
  );
  const isConverting = task?.result?.status !== 'completed' && task?.result?.status !== 'error';
  const comparisonPreviewUrl = outputPreviewUrl ?? (isConverting ? inputPreviewUrl : null);
  const containerWidth = containerSize.width;

  useEffect(() => {
    const previousContainerWidth = prevContainerWidth.current;

    setSplitLeft((splitLeft) => {
      if (splitLeft == null && containerWidth) {
        return containerWidth / 2;
      }

      if (splitLeft != null && previousContainerWidth) {
        return (splitLeft * containerWidth) / previousContainerWidth;
      }

      return splitLeft;
    });
    prevContainerWidth.current = containerWidth;
  }, [containerWidth]);

  const imageInitialRect = useMemo(() => {
    if (!imageNaturalSize) return null;

    const renderSize = resizeContain(
      imageNaturalSize.width,
      imageNaturalSize.height,
      containerSize.width,
      containerSize.height,
    );

    const w = Math.round(renderSize.width);
    const h = Math.round(renderSize.height);

    return {
      width: w,
      height: h,
      x: (containerSize.width - w) / 2,
      y: (containerSize.height - h) / 2,
    };
  }, [imageNaturalSize, containerSize]);

  const [transform, setTransform] = useState<ImageTransform>({
    zoom: 1,
    x: 0,
    y: 0,
    transition: true,
  });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageNaturalSize({ width: naturalWidth, height: naturalHeight });
  };

  const setFixedTransform = (transform: SetStateAction<ImageTransform>) => {
    setTransform((currentTransform) => {
      const fixedTransform = {
        ...(typeof transform === 'function' ? transform(currentTransform) : transform),
      };

      if (fixedTransform.zoom <= 1) {
        fixedTransform.zoom = 1;
        fixedTransform.x = 0;
        fixedTransform.y = 0;
      }

      const containerSize = containerRef.current!.getBoundingClientRect();
      const { clientWidth, clientHeight } = imageRef.current!;

      const xMax = Math.max(0, (clientWidth / 2) * fixedTransform.zoom - containerSize.width / 2);
      const yMax = Math.max(0, (clientHeight / 2) * fixedTransform.zoom - containerSize.height / 2);

      fixedTransform.x = clamp(fixedTransform.x, -xMax, xMax);
      fixedTransform.y = clamp(fixedTransform.y, -yMax, yMax);

      return fixedTransform;
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const wheelData = normalizeWheelEvent(e);
    console.log(
      `[OptimizeDetail] wheel: deltaMode=${e.deltaMode} deltaX=${e.deltaX} deltaY=${e.deltaY} ctrlKey=${e.ctrlKey} -> type=${wheelData.type} zoom=${wheelData.zoom} x=${wheelData.x} y=${wheelData.y}`,
    );

    if (wheelData.type === 'zoom') {
      const target = e.currentTarget;
      const mousePosition = eventOffset(e.nativeEvent, target);

      const mouseX = mousePosition.x - target.clientWidth / 2;
      const mouseY = mousePosition.y - target.clientHeight / 2;

      setFixedTransform((transform) => {
        const zoom = Math.min(transform.zoom * wheelData.zoom, 4);
        const x = mouseX - ((mouseX - transform.x) / transform.zoom) * zoom;
        const y = mouseY - ((mouseY - transform.y) / transform.zoom) * zoom;

        return {
          x,
          y,
          zoom,
          transition: true,
        };
      });
    } else {
      setFixedTransform((transform) => ({
        ...transform,
        x: transform.x - wheelData.x,
        y: transform.y - wheelData.y,
        transition: false,
      }));
    }
  };

  const { onMouseDown: onCanvasMouseDown } = useMouseDrag({
    data: transform,
    onMove(startPos, pos, transform) {
      setFixedTransform({
        ...transform,
        x: transform.x + pos.clientX - startPos.clientX,
        y: transform.y + pos.clientY - startPos.clientY,
        transition: false,
      });
    },
    onEnd() {
      setFixedTransform((transform) => ({
        ...transform,
        transition: true,
      }));
    },
  });

  const { onMouseDown: onSplitMouseDown } = useMouseDrag({
    data: splitLeft,
    onMove(startPos, pos, splitLeft) {
      if (splitLeft != null) {
        setSplitLeft(clamp(splitLeft + pos.clientX - startPos.clientX, 5, containerSize.width - 5));
        setSplitDragging(true);
      }
    },
    onEnd() {
      setSplitDragging(false);
    },
  });

  const imageSplitLeft =
    splitLeft == null || imageInitialRect == null
      ? null
      : Math.round(
          (splitLeft -
            (imageInitialRect.x -
              (transform.zoom - 1) * (imageInitialRect.width / 2) +
              transform.x)) /
            transform.zoom,
        );

  return task ? (
    <>
      <div
        ref={mergedContainerRef}
        className={cn(
          'w-full h-full flex items-center justify-center select-none',
          splitDragging && 'cursor-col-resize',
        )}
        onWheel={handleWheel}
      >
        <div
          className="absolute"
          onMouseDown={onCanvasMouseDown}
          style={
            imageInitialRect
              ? {
                  width: imageInitialRect.width,
                  height: imageInitialRect.height,
                  left: imageInitialRect.x,
                  top: imageInitialRect.y,
                }
              : {
                  visibility: 'hidden',
                }
          }
        >
          <div
            css={[fullCss, transform.transition ? { transition: 'transform 0.2s' } : null]}
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
            }}
          >
            {inputPreviewUrl ? (
              <img
                ref={imageRef}
                onLoad={handleImageLoad}
                src={inputPreviewUrl}
                css={fullCss}
                style={
                  imageInitialRect && imageSplitLeft != null
                    ? {
                        clipPath: `inset(0px ${imageInitialRect.width - imageSplitLeft}px 0px 0px)`,
                      }
                    : {}
                }
              />
            ) : null}

            {comparisonPreviewUrl && imageSplitLeft != null ? (
              <>
                <img
                  src={comparisonPreviewUrl}
                  css={fullCss}
                  style={{
                    clipPath: `inset(0px 0 0px ${imageSplitLeft}px)`,
                    opacity: isConverting ? 0.5 : 1,
                  }}
                />
                {isConverting ? (
                  <div
                    css={[
                      fullCss,
                      {
                        pointerEvents: 'none',
                        overflow: 'hidden',
                      },
                    ]}
                    style={{
                      clipPath: `inset(0px 0 0px ${imageSplitLeft}px)`,
                    }}
                  >
                    <div
                      css={{
                        position: 'absolute',
                        top: '-10%',
                        bottom: '-10%',
                        left: 0,
                        width: '60%',
                        pointerEvents: 'none',
                        willChange: 'transform',
                        transformOrigin: 'center',
                        background:
                          'linear-gradient(90deg, transparent 10%, rgba(255, 255, 255, 0.45) 50%, transparent 90%)',
                        maskImage:
                          'linear-gradient(90deg, transparent, black 20%, black 80%, transparent)',
                        WebkitMaskImage:
                          'linear-gradient(90deg, transparent, black 20%, black 80%, transparent)',
                        animation: `${highlightAnimation} 1.5s ease-in-out infinite`,
                        '@media (prefers-reduced-motion: reduce)': {
                          display: 'none',
                        },
                      }}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
        {splitLeft != null ? (
          <div
            onMouseDown={onSplitMouseDown}
            className={cn(
              'absolute top-0 bottom-0 left-0 right-0 w-[6px] cursor-col-resize hover:bg-foreground/50',
              splitDragging && 'bg-foreground/40',
            )}
            style={{
              transform: `translate(${Math.round(splitLeft - 4)}px, 0)`,
            }}
          >
            <div className="absolute top-0 bottom-0 left-0 right-0 m-auto w-[2px] h-full bg-foreground" />
            <div className="absolute w-8 h-8 rounded-full bg-foreground top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rotate-90">
              <LiaSortSolid className="w-6 h-6 text-background" />
            </div>
          </div>
        ) : null}

        <div className="absolute right-2 bottom-2 z-100">
          {task.result?.status === 'completed' ? sizeFormatter(task.result.result.file.size) : '-'}
          {' / '}
          {sizeFormatter(task.input.file.size)}
        </div>
      </div>

      <OptimizeOptionsCard task={task} />
    </>
  ) : null;
}

export default function OptimizeDetailWithModal({ embedded = false }: { embedded?: boolean }) {
  const activeTask = useStore(selectActiveTask);

  return (
    <FullScreenModal
      show={Boolean(activeTask)}
      onClose={() => mutations.setActiveTaskId(null)}
      contained={embedded}
    >
      <OptimizeDetail task={activeTask} />
    </FullScreenModal>
  );
}
