import { sizeFormatter } from '@/lib/size-formatter';
import { cn } from '@/lib/utils';
import { HiMiniArrowLongRight } from 'react-icons/hi2';
import { MdError } from 'react-icons/md';
import type { PropsWithChildren } from 'react';
import { i18n } from '@/lib/i18n';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface TaskCardSizeIndicatorProps {
  inputSize: number;
  outputSize: number | null;
  skipBatchSave: boolean;
}

export function TaskCardSizeIndicator({
  inputSize,
  outputSize,
  skipBatchSave,
  children,
}: PropsWithChildren<TaskCardSizeIndicatorProps>) {
  const compressRate = (outputSize ?? 0) / inputSize;
  const rateTone =
    outputSize == null
      ? 'var(--color-muted-foreground)'
      : compressRate <= 1
        ? 'color-mix(in oklab, var(--color-chart-2) 72%, var(--color-foreground))'
        : 'color-mix(in oklab, var(--color-destructive) 72%, var(--color-foreground))';

  return (
    <div
      className="flex items-center gap-2"
      css={{
        fontSize: 10,
        textAlign: 'right',
      }}
    >
      <span
        className={cn('min-w-8 shrink-0 px-1 whitespace-pre font-medium tabular-nums')}
        css={{
          color: rateTone,
        }}
      >
        {compressRate <= 1 ? '-' : '+'}
        {outputSize == null ? '  ' : Math.round(Math.abs(1 - compressRate) * 100)}%
      </span>

      <div className="relative min-w-0 flex-1 text-right">
        <span className="relative z-10 flex items-center justify-end gap-1 truncate px-1 text-muted-foreground">
          {sizeFormatter(inputSize)}
          <HiMiniArrowLongRight className="shrink-0" />
          {outputSize == null ? '-' : sizeFormatter(outputSize)}
        </span>
      </div>

      {skipBatchSave ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0 text-amber-500" aria-label={i18n.text('skip_save_warning')}>
              <MdError className="size-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent sideOffset={6}>{i18n.text('skip_save_warning')}</TooltipContent>
        </Tooltip>
      ) : null}

      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}
