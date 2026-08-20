import { range } from 'lodash-es';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useMeasure } from 'react-use';
import { useRef, useState } from 'react';
import { TaskCard } from './task-card';
import { useStore } from '@/store';
import { addFiles } from '@/platform';
import { HEADER_HEIGHT, ITEM_MIN_WIDTH, ITEM_OUTER_HEIGHT, LIST_PADDING } from '@/constants/layout';
import { i18n } from '@/lib/i18n';

interface TaskListProps {
  embedded?: boolean;
}

function getDragHint() {
  return i18n.text(RUNTIME === 'web' ? 'drag_images_here' : 'drag_here');
}

function TaskListEmpty({ embedded = false }: TaskListProps) {
  return (
    <div
      className="flex items-center justify-center text-2xl text-foreground/20 select-none task-empty"
      css={{
        height: embedded ? 'min(60vh, 640px)' : `calc(100vh - ${HEADER_HEIGHT * 2}px)`,
      }}
    >
      {getDragHint()}
    </div>
  );
}

export function TaskList({ embedded = false }: TaskListProps) {
  const { tasks } = useStore();
  const [containerRef, containerSize] = useMeasure<HTMLDivElement>();
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragDepth = useRef(0);

  const containerWidth = containerSize.width - LIST_PADDING * 2;
  const columns = Math.floor(containerWidth / ITEM_MIN_WIDTH) || 1;
  const itemWidth = containerWidth / columns;
  const rows = Math.ceil(tasks.length / columns);
  const isFileDrag = (event: React.DragEvent) => event.dataTransfer.types.includes('Files');

  const rowVirtualizer = useWindowVirtualizer({
    count: rows,
    estimateSize: () => ITEM_OUTER_HEIGHT,
    overscan: 5,
  });

  return (
    <div
      className="relative"
      onDragEnter={
        RUNTIME === 'web'
          ? (event) => {
              if (!isFileDrag(event)) return;
              dragDepth.current += 1;
              setIsDraggingFiles(true);
            }
          : undefined
      }
      onDragOver={
        RUNTIME === 'web'
          ? (event) => {
              if (!isFileDrag(event)) return;
              event.preventDefault();
            }
          : undefined
      }
      onDragLeave={
        RUNTIME === 'web'
          ? (event) => {
              if (!isFileDrag(event)) return;
              dragDepth.current -= 1;
              if (dragDepth.current === 0) {
                setIsDraggingFiles(false);
              }
            }
          : undefined
      }
      onDrop={
        RUNTIME === 'web'
          ? (event) => {
              if (!isFileDrag(event)) return;
              event.preventDefault();
              dragDepth.current = 0;
              setIsDraggingFiles(false);
              void addFiles({ files: Array.from(event.dataTransfer.files) });
            }
          : undefined
      }
      css={{
        marginTop: embedded ? 0 : HEADER_HEIGHT,
      }}
    >
      {isDraggingFiles ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-amber-300 bg-amber-50 text-2xl text-amber-800">
          {getDragHint()}
        </div>
      ) : null}
      {!tasks.length ? <TaskListEmpty embedded={embedded} /> : null}
      <div
        ref={containerRef}
        style={{
          height: `${rowVirtualizer.getTotalSize() + LIST_PADDING * 4}px`,
        }}
        className="relative"
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) =>
          range(0, columns).map((col) => {
            const realIndex = virtualRow.index * columns + col;
            const task = tasks[realIndex];

            return (
              <div
                key={realIndex}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: itemWidth,
                  height: `${virtualRow.size}px`,
                  transform: `translate(${col * itemWidth + LIST_PADDING}px, ${virtualRow.start + LIST_PADDING}px)`,
                }}
                className="p-2"
              >
                {task ? <TaskCard key={task.id} task={task} /> : null}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
