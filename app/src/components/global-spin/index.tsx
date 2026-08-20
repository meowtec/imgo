import { useStore } from '@/store';
import { ImSpinner8 } from 'react-icons/im';
import { cn } from '@/lib/utils';
import { i18n } from '@/lib/i18n';

export default function GlobalSpin({ contained = false }: { contained?: boolean }) {
  const addLoading = useStore((state) => state.addLoading);

  if (!addLoading.ids.length) return null;

  return (
    <div
      className={cn(
        'bg-background/60 text-foreground/60 flex items-center justify-center gap-2 inset-0 z-100 pointer-events-none',
        contained ? 'absolute' : 'fixed',
      )}
    >
      <ImSpinner8 className="w-4 h-4 animate-spin" />
      <span className="text-sm max-w-80 text-ellipsis overflow-hidden whitespace-nowrap">
        {i18n.textTpl('analyzing', [addLoading.latestFileName])}
      </span>
    </div>
  );
}
