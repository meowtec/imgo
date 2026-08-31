import { HiOutlineQuestionMarkCircle } from 'react-icons/hi2';
import type { ResizeOptions, ResizeType, Size } from '@imgo/shared-js';
import { type Option, Select } from '../std/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import IconImg from '@/assets/icons/img.svg';
import { cn } from '@/lib/utils';
import { i18n } from '@/lib/i18n';

interface ResizeInputProps {
  value: ResizeOptions | null;
  defaultSize?: Size;
  onChange: (value: ResizeOptions | null) => void;
  triggerClassName?: string;
}

type SelectResizeType = ResizeType | 'NONE';

function InputWithPrefix({ prefix, ...props }: { prefix: string } & React.ComponentProps<'input'>) {
  return (
    <div className="relative">
      <span className="absolute top-0 bottom-0 flex items-center justify-center w-6 text-muted-foreground text-sm">
        {prefix}
      </span>
      <Input className="w-[60px] pl-6" {...props} />
    </div>
  );
}

interface ResizeTypeLegendProps {
  title: string;
  description?: string;
  imgProps: React.SVGAttributes<SVGElement>;
}

function ResizeTypeLegend({ title, description, imgProps }: ResizeTypeLegendProps) {
  return (
    <>
      <div className="flex gap-4 items-center justify-between">
        <div className="relative w-16 h-9 scale-75">
          <IconImg {...imgProps} className={cn('absolute abs-center', imgProps.className)} />
          <div className="absolute abs-center w-9 h-9 bg-yellow-300/50 border border-dashed border-foreground" />
        </div>
        <div>
          <div>{title}：</div>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
      </div>
    </>
  );
}

export function ResizeInput({
  value,
  defaultSize = { width: 360, height: 360 },
  onChange,
  triggerClassName = 'w-[120px]',
}: ResizeInputProps) {
  const handleTypeChange = (type: SelectResizeType) => {
    if (type === 'NONE') {
      onChange(null);
      return;
    }

    onChange({
      type,
      width: value?.width ?? defaultSize.width,
      height: value?.height ?? defaultSize.height,
    });
  };

  const handleNumChange = (key: 'width' | 'height') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    if (isNaN(num) || num <= 0) {
      return;
    }

    onChange({
      type: value?.type ?? 'DOWNSIZE_CONTAIN',
      width: value?.width ?? defaultSize.width,
      height: value?.height ?? defaultSize.height,
      [key]: num,
    });
  };

  const type = value?.type ?? 'NONE';

  return (
    <div className="flex items-center gap-2">
      <Select<SelectResizeType>
        triggerClassName={triggerClassName}
        value={type}
        onChange={handleTypeChange}
        options={
          [
            {
              value: 'NONE',
              label: i18n.text('original_size'),
            },
            {
              value: 'DOWNSIZE_CONTAIN',
              label: i18n.text('resize_contain'),
            },
            {
              value: 'DOWNSIZE_COVER',
              label: i18n.text('resize_cover'),
            },
            {
              value: 'EXACT',
              label: i18n.text('resize_stretch'),
            },
          ] satisfies Option<SelectResizeType>[]
        }
      />

      {type !== 'NONE' && (
        <>
          <InputWithPrefix prefix="w" value={value?.width} onChange={handleNumChange('width')} />
          <InputWithPrefix prefix="h" value={value?.height} onChange={handleNumChange('height')} />
        </>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" className="p-1">
              <HiOutlineQuestionMarkCircle />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            arrowPadding={1000}
            className="bg-card text-foreground shadow"
            css={{
              '& span>svg': {
                visibility: 'hidden',
              },
            }}
          >
            <div className="py-2">
              <div className="space-y-2">
                <ResizeTypeLegend
                  title={i18n.text('resize_contain')}
                  description={i18n.text('resize_contain_description')}
                  imgProps={{
                    className: 'w-9 h-9 max-w-none',
                  }}
                />

                <ResizeTypeLegend
                  title={i18n.text('resize_cover')}
                  description={i18n.text('resize_cover_description')}
                  imgProps={{
                    className: 'w-16 h-9 max-w-none',
                  }}
                />

                <ResizeTypeLegend
                  title={i18n.text('resize_stretch')}
                  description={i18n.text('resize_stretch_description')}
                  imgProps={{
                    className: cn('w-9 h-9'),
                    style: {
                      transform: `scale(1, ${16 / 9})`,
                    },
                  }}
                />
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
