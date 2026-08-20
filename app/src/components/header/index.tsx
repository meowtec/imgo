import {
  HiAdjustmentsHorizontal,
  HiOutlineTrash,
  HiCheck,
  HiOutlineFolderPlus,
  HiOutlineDocumentPlus,
} from 'react-icons/hi2';
import { PiDownload } from 'react-icons/pi';
import { useShallow } from 'zustand/shallow';
import { mutations, selectCompleteCount, selectFileSizes, useStore } from '@/store';
import { openSelectFilesDialog, openSelectFoldersDialog, showConfirm } from '@/platform';
import { sizeFormatter } from '@/lib/size-formatter';
import { i18n } from '@/lib/i18n';
import { HEADER_HEIGHT } from '@/constants/layout';
import { cn } from '@/lib/utils';
import { HeaderProgressRow } from './header-progress-row';
import { TooltipIconButton } from '../ui/tooltip-icon-button';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface AppHeaderProps {
  embedded?: boolean;
}

export function AppHeader({ embedded = false }: AppHeaderProps) {
  const { completedCount, totalCount, totalSizeSum, optimizedSizeSum } = useStore(
    useShallow((state) => ({
      completedCount: selectCompleteCount(state),
      totalCount: state.tasks.length,
      ...selectFileSizes(state),
    })),
  );

  const handleRemoveAllTasks = () => {
    void showConfirm({
      title: i18n.text('delete_tasks'),
      message: i18n.text('delete_tasks_confirm'),
      confirmText: i18n.text('delete'),
      cancelText: i18n.text('cancel'),
    }).then((res) => {
      if (!res) return;
      mutations.removeAllTasks();
    });
  };

  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const savedSize = Math.max(totalSizeSum - optimizedSizeSum, 0);
  const savedRatio = totalSizeSum > 0 ? savedSize / totalSizeSum : 0;
  const volumeRatio = totalSizeSum > 0 ? Math.min(optimizedSizeSum / totalSizeSum, 1) : 0;
  const headerStatus =
    totalCount === 0
      ? i18n.text('waiting')
      : completedCount === totalCount
        ? i18n.text('completed')
        : i18n.text('processing');
  const summaryBadgeClass =
    'inline-flex h-5 w-22 shrink-0 items-center justify-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium';

  return (
    <header
      className={cn(
        'z-10 flex items-center justify-between gap-2 bg-white px-4 py-2',
        embedded
          ? 'imgo-embedded-header w-full flex-nowrap border-b'
          : 'fixed left-0 top-0 w-full shadow',
      )}
      css={{
        height: embedded ? 64 : HEADER_HEIGHT,
      }}
    >
      <div className="flex shrink-0 items-center gap-2">
        <TooltipIconButton
          type="button"
          variant="ghost"
          size="icon"
          tooltip={i18n.text('select_files')}
          aria-label={i18n.text('select_files')}
          onClick={() => {
            void openSelectFilesDialog();
          }}
        >
          <HiOutlineDocumentPlus />
        </TooltipIconButton>

        {RUNTIME === 'tauri' && (
          <TooltipIconButton
            type="button"
            variant="ghost"
            size="icon"
            tooltip={i18n.text('select_folder')}
            aria-label={i18n.text('select_folder')}
            onClick={() => {
              void openSelectFoldersDialog();
            }}
          >
            <HiOutlineFolderPlus />
          </TooltipIconButton>
        )}

        {RUNTIME === 'tauri' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={i18n.text('save_completed')}
                disabled={completedCount === 0}
              >
                <PiDownload />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => mutations.saveCompleted('OVERRIDE')}>
                {i18n.text('save')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => mutations.saveCompleted('AUTO_NEW_NAME')}>
                {i18n.text('save_new_file')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => mutations.saveCompleted('SAVE_TO_DIR')}>
                {i18n.text('save_to_dir')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <TooltipIconButton
            type="button"
            variant="ghost"
            size="icon"
            tooltip={i18n.text('download_completed')}
            aria-label={i18n.text('download_completed')}
            disabled={completedCount === 0}
            onClick={() => {
              mutations.saveCompleted('AUTO_NEW_NAME');
            }}
          >
            <PiDownload />
          </TooltipIconButton>
        )}

        <TooltipIconButton
          type="button"
          variant="ghost"
          size="icon"
          tooltip={i18n.text('open_settings')}
          aria-label={i18n.text('open_settings')}
          onClick={() => {
            mutations.setAppOptionsVisible(true);
          }}
        >
          <HiAdjustmentsHorizontal />
        </TooltipIconButton>

        <TooltipIconButton
          type="button"
          variant="ghost"
          size="icon"
          tooltip={i18n.text('delete_all_tasks')}
          aria-label={i18n.text('delete_all_tasks')}
          onClick={handleRemoveAllTasks}
        >
          <HiOutlineTrash />
        </TooltipIconButton>
      </div>
      <div
        className={cn(
          'imgo-header-stats flex min-w-0 flex-1 items-center border-l border-border/60 pl-4 text-xs',
        )}
      >
        <div className="grid min-w-0 w-full max-w-[420px] grid-cols-[max-content_8rem_minmax(0,1fr)] gap-x-3 gap-y-2">
          <HeaderProgressRow
            title={i18n.text('progress')}
            progress={progressRatio}
            content={
              <div className="flex items-center justify-end gap-2 tabular-nums text-foreground/90">
                <span className="font-medium">{completedCount}</span>
                <span className="text-muted-foreground">/</span>
                <span>{totalCount}</span>
                <span
                  className={cn(
                    summaryBadgeClass,
                    totalCount === 0
                      ? 'bg-muted text-muted-foreground'
                      : completedCount === totalCount
                        ? 'bg-primary/12 text-primary'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                  )}
                >
                  {completedCount && completedCount === totalCount ? (
                    <HiCheck className="text-sm" />
                  ) : null}
                  {headerStatus}
                </span>
              </div>
            }
          />
          <HeaderProgressRow
            progressClassName="imgo-progress-track-zebra"
            className="[&_[data-slot=progress-indicator]]:bg-emerald-500"
            title={i18n.text('reduction')}
            progress={volumeRatio}
            content={
              <div className="flex items-center justify-end gap-2 tabular-nums text-foreground/90">
                <span>
                  {sizeFormatter(optimizedSizeSum)} / {sizeFormatter(totalSizeSum)}
                </span>
                {savedSize > 0 ? (
                  <span
                    className={cn(
                      summaryBadgeClass,
                      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                    )}
                  >
                    {i18n.textTpl('reduced_by', [String(Math.round(savedRatio * 100))])}
                  </span>
                ) : (
                  <span className="inline-flex h-5 w-22 shrink-0" aria-hidden="true" />
                )}
              </div>
            }
          />
        </div>
      </div>
    </header>
  );
}
