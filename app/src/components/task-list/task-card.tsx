import { memo, useEffect, useRef, type ReactNode } from 'react';
import { useIntersection } from 'react-use';
import { GrFormClose } from 'react-icons/gr';
import { CgSpinnerAlt } from 'react-icons/cg';
import { GoDotFill } from 'react-icons/go';
import { HiMiniArrowLongRight } from 'react-icons/hi2';
import { MdCheck, MdOutlineFileDownload } from 'react-icons/md';
import {
  isImageObject,
  getFileNameFromPath,
  isTaskResultComplete,
  cn,
  displayFormat,
} from '@/lib/utils';
import { mutations, useStore, viewBoxTasks } from '@/store';
import { TaskCardSizeIndicator } from './task-card-size-indicator';
import { bigintToNumber } from '@/lib/size-formatter';
import { useFileUrl } from '@/platform';
import { NativeSelect } from '../ui/native-select';
import { POPULAR_FORMAT_OPTIONS } from '@/constants/format-options';
import type { ImageOptimizeOptions, Task, TaskResult } from '@/types';
import type { ImageFormat } from '@imgo/shared-js';
import { getSimplifiedQualityOptions, LOSSLESS_QUALITY } from '@/constants/simplified-quality';
import { simplifyQuality, unsimplifyQuality } from '@/lib/simplified-quality';
import { supportsLossless } from '@/constants/format';
import { i18n } from '@/lib/i18n';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { TooltipIconButton } from '../ui/tooltip-icon-button';

interface TaskCardProps {
  task: Task;
}

const FRIENDLY_ERROR_MESSAGES = ['Encoding of color planes failed'];

const TaskStatusDisplayMap: Record<
  TaskResult['status'] | 'saved' | '',
  {
    icon: ReactNode;
    titleKey: string;
    className: string;
  }
> = {
  '': {
    icon: <GoDotFill className="text-gray-400" />,
    titleKey: 'waiting',
    className: 'bg-muted text-muted-foreground',
  },
  processing: {
    icon: <CgSpinnerAlt className="animate-spin" />,
    titleKey: 'processing',
    className: 'bg-sky-500/12 text-sky-600 dark:text-sky-300',
  },
  error: {
    icon: <GoDotFill className="text-red-400" />,
    titleKey: 'error',
    className: 'bg-destructive/12 text-destructive',
  },
  completed: {
    icon: <MdOutlineFileDownload />,
    titleKey: 'save',
    className: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
  },
  saved: {
    icon: <MdCheck />,
    titleKey: 'saved',
    className: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
  },
};

export const TaskCard = memo(function TaskCard({ task }: TaskCardProps) {
  const { thumb } = task.input;
  const { result } = task;
  const activeTaskId = useStore((state) => state.activeTaskId);
  const intersectionRef = useRef<HTMLDivElement | null>(null);
  const intersection = useIntersection(intersectionRef as React.RefObject<HTMLElement>, {
    root: null,
    threshold: 0.1,
  });

  const inViewBox = Boolean(intersection?.isIntersecting);

  useEffect(() => {
    if (inViewBox) {
      viewBoxTasks.add(task.id);
      mutations.batchPickRunTask();

      return () => {
        viewBoxTasks.delete(task.id);
      };
    }
  }, [task.id, inViewBox]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();

    mutations.removeTasks([task.id]);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isTaskResultComplete(result)) {
      void mutations.saveImages('SAVE_AS', [result.result]);
    }
  };

  const updateTaskOptions = (options: ImageOptimizeOptions) => {
    mutations.updateTaskOptions(task.id, options);
  };

  const updateTaskOutputFormat = (outputFormat: ImageFormat) => {
    updateTaskOptions({
      outputFormat,
      options: {
        ...task.options,
        lossless: supportsLossless(outputFormat) && task.options.lossless,
      },
    });
  };

  const renderLoading = () => (
    <div
      className="skeleton-0"
      css={{
        width: '100%',
        height: '100%',
      }}
    />
  );

  const status: keyof typeof TaskStatusDisplayMap =
    isTaskResultComplete(result) && result.saved ? 'saved' : (result?.status ?? '');
  const statusDisplay = TaskStatusDisplayMap[status];
  const isActive = activeTaskId === task.id;
  const showProcessingSkeleton = status === 'processing';
  const errorMessage = result?.status === 'error' ? result.error : null;
  const errorTooltip =
    errorMessage != null &&
    FRIENDLY_ERROR_MESSAGES.some((message) => errorMessage.includes(message))
      ? i18n.text('image_encoding_failed')
      : errorMessage;
  const statusBadge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] whitespace-nowrap',
        statusDisplay.className,
      )}
    >
      {statusDisplay.icon}
      {i18n.text(statusDisplay.titleKey)}
    </span>
  );

  const thumbUrl = useFileUrl(isImageObject(thumb) ? thumb.file.id : null);

  return (
    <div
      ref={intersectionRef}
      className="relative h-full group"
      onClick={() => mutations.setActiveTaskId(task.id)}
    >
      <div
        className={cn(
          'relative flex h-full cursor-default overflow-hidden rounded-xl border bg-card text-xs transition-all duration-200',
          'border-border/70 dark:border-border dark:bg-secondary/40 dark:ring-1 dark:ring-white/6',
          'hover:-translate-y-0.5 hover:border-border dark:hover:bg-secondary/55 dark:hover:ring-white/10',
          isActive && 'border-primary/50 ring-2 ring-primary/15 dark:border-primary/40',
        )}
      >
        {showProcessingSkeleton ? (
          <div className="pointer-events-none absolute inset-0 z-10 skeleton opacity-60" />
        ) : null}

        <div className="relative z-20 h-full aspect-square shrink-0 border-r border-border/60 dark:border-white/8">
          {!thumb || thumb === 'ING' ? renderLoading() : null}
          {isImageObject(thumb) ? (
            <img
              css={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                background: 'transparent',
              }}
              src={thumbUrl ?? undefined}
            />
          ) : null}
        </div>

        <aside className="relative z-20 flex min-w-0 flex-1 flex-col p-3">
          <div className="flex items-start gap-2 pr-8">
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden text-ellipsis text-nowrap pb-1 text-sm font-medium text-foreground/90">
                {getFileNameFromPath(task.input.file.name)}
              </div>
            </div>

            <TooltipIconButton
              type="button"
              variant="ghost"
              size="icon-xs"
              tooltip={i18n.text('delete_task')}
              aria-label={i18n.text('delete_task')}
              className="absolute top-1 right-1 z-10"
              onClick={handleRemove}
            >
              <GrFormClose />
            </TooltipIconButton>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <div className="flex gap-2 items-center justify-between" css={{ fontSize: 10 }}>
              <div className="flex gap-1 items-center">
                {displayFormat(task.input.format)}
                <HiMiniArrowLongRight />
                <NativeSelect
                  onClick={(e) => e.stopPropagation()}
                  value={task.outputFormat}
                  options={POPULAR_FORMAT_OPTIONS}
                  onChange={(outputFormat) => {
                    updateTaskOutputFormat(outputFormat as ImageFormat);
                  }}
                />
              </div>

              <NativeSelect
                onClick={(e) => e.stopPropagation()}
                value={
                  task.options.lossless
                    ? LOSSLESS_QUALITY
                    : simplifyQuality(task.options.quality ?? 85)
                }
                options={getSimplifiedQualityOptions(supportsLossless(task.outputFormat))}
                onChange={(quality) => {
                  const lossless = quality === LOSSLESS_QUALITY;
                  updateTaskOptions({
                    outputFormat: task.outputFormat,
                    options: {
                      ...task.options,
                      quality: lossless ? task.options.quality : unsimplifyQuality(Number(quality)),
                      lossless,
                    },
                  });
                }}
              />
            </div>

            <TaskCardSizeIndicator
              inputSize={bigintToNumber(task.input.file.size)}
              outputSize={
                isTaskResultComplete(result) ? bigintToNumber(result.result.file.size) : null
              }
              inputFormat={task.input.format}
              outputFormat={task.outputFormat}
            >
              {status === 'completed' || status === 'saved' ? (
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-auto py-0.5 text-[10px]"
                  onClick={handleDownload}
                >
                  {statusDisplay.icon}
                  {i18n.text(statusDisplay.titleKey)}
                </Button>
              ) : errorTooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>{statusBadge}</TooltipTrigger>
                  <TooltipContent
                    sideOffset={6}
                    className="max-w-sm whitespace-pre-wrap break-words text-left text-wrap"
                  >
                    {errorTooltip}
                  </TooltipContent>
                </Tooltip>
              ) : (
                statusBadge
              )}
            </TaskCardSizeIndicator>
          </div>
        </aside>
      </div>
    </div>
  );
});
