import type { ReactNode } from 'react';
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export interface Option<T extends string> {
  value: T;
  label: ReactNode;
}

export interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  placeholder?: string;
  triggerClassName?: string;
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  triggerClassName,
}: SelectProps<T>) {
  return (
    <SelectRoot value={value} onValueChange={onChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
