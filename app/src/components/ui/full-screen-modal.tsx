import { type PropsWithChildren, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { HiXMark } from 'react-icons/hi2';
import { useLockBody } from '@/hooks/use-lock-body';
import { cn } from '@/lib/utils';
import { i18n } from '@/lib/i18n';
import { TooltipIconButton } from './tooltip-icon-button';

interface FullScreenModalProps {
  show: boolean;
  onClose: () => void;
  contained?: boolean;
}

export function FullScreenModal({
  show,
  onClose,
  contained = false,
  children,
}: PropsWithChildren<FullScreenModalProps>) {
  const nodeRef = useRef(null);
  useLockBody(show && !contained);

  return (
    <CSSTransition nodeRef={nodeRef} in={show} timeout={400} unmountOnExit classNames="slide-modal">
      <div
        className={cn(
          'z-10 inset-0 bg-background/80 backdrop-blur-xl',
          contained ? 'absolute' : 'fixed',
        )}
        ref={nodeRef}
      >
        <div className="relative z-10">
          <TooltipIconButton
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
            tooltip={i18n.text('close')}
            aria-label={i18n.text('close')}
          >
            <HiXMark />
          </TooltipIconButton>
        </div>
        {children}
      </div>
    </CSSTransition>
  );
}
