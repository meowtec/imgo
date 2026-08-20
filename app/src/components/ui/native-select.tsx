import { cn } from '@/lib/utils';
import { useMemo, type SelectHTMLAttributes } from 'react';
import { HiChevronDown } from 'react-icons/hi2';

interface NativeSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value: string | number;
  placeholder?: string;
  options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  onChange: (value: string) => void;
}

export function NativeSelect({ value, options, className, onChange, ...props }: NativeSelectProps) {
  const displayText = useMemo(
    () => options.find((option) => option.value === value)?.label,
    [options, value],
  );

  return (
    <div className={cn('relative flex items-center gap-[2px] hover:bg-accent rounded', className)}>
      {displayText}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute top-0 left-0 w-full h-full opacity-0"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <HiChevronDown />
    </div>
  );
}
