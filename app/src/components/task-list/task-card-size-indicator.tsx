import { sizeFormatter } from '@/lib/size-formatter';
import { cn } from '@/lib/utils';
import type { ImageFormat } from '@imgo/shared-js';
import type { PropsWithChildren } from 'react';

interface TaskCardSizeIndicatorProps {
  inputSize: number;
  outputSize: number | null;
  inputFormat: ImageFormat;
  outputFormat: ImageFormat;
}

export function TaskCardSizeIndicator({
  inputSize,
  outputSize,
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

      <div className="relative min-w-0 flex-1 overflow-hidden rounded text-right">
        <span className="relative z-10 block truncate rounded px-1 text-muted-foreground">
          {outputSize == null ? '-' : sizeFormatter(outputSize)}
          {' / '}
          {sizeFormatter(inputSize)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}
