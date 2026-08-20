import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';

export function HeaderProgressRow({
  title,
  progress,
  content,
  className,
  progressClassName,
}: {
  title: string;
  progress: number;
  content: ReactNode;
  className?: string;
  progressClassName?: string;
}) {
  return (
    <div className={cn('col-span-3 grid grid-cols-subgrid items-center', className)}>
      <div className="whitespace-nowrap text-xs font-medium text-muted-foreground">{title}</div>

      <Progress
        value={Math.round(progress * 100)}
        className={cn('h-1.5 w-32 bg-foreground/8', progressClassName)}
      />

      <div className="min-w-0 flex-1 whitespace-nowrap">{content}</div>
    </div>
  );
}
