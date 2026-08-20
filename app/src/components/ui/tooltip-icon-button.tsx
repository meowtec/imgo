import * as React from 'react';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

type TooltipIconButtonProps = React.ComponentProps<typeof Button> & {
  tooltip: React.ReactNode;
  tooltipProps?: React.ComponentProps<typeof TooltipContent>;
};

export function TooltipIconButton({
  tooltip,
  tooltipProps,
  disabled,
  children,
  'aria-label': ariaLabel,
  ...props
}: TooltipIconButtonProps) {
  const accessibleLabel = ariaLabel ?? (typeof tooltip === 'string' ? tooltip : undefined);
  const button = (
    <Button disabled={disabled} aria-label={accessibleLabel} {...props}>
      {children}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled ? <span className="inline-flex">{button}</span> : button}
      </TooltipTrigger>
      <TooltipContent sideOffset={6} {...tooltipProps}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
