import { type ReactNode, useMemo } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { cn } from '@/lib/utils';
import { HiCheck } from 'react-icons/hi2';

export interface MultipleSelectProps<T> {
  value: T[] | undefined | null;
  options: Array<{
    value: T;
    label: ReactNode;
  }>;
  onChange: (value: T[]) => void;
}

export default function MultipleSelect<T extends string | number>({
  value,
  options,
  onChange,
}: MultipleSelectProps<T>) {
  const normalizedValue = value ?? undefined;
  const valueLabelMap = useMemo(
    () => new Map(options.map((option) => [option.value, option.label])),
    [],
  );
  const getLabel = (value: T): ReactNode => valueLabelMap.get(value) ?? String(value);

  return (
    <Listbox as="div" multiple value={normalizedValue} onChange={onChange}>
      <ListboxButton className="w-[360px] flex gap-1 border px-3 py-2 flex-wrap rounded-md min-h-9">
        {normalizedValue?.map((val, index) => (
          <span className="text-sm h-4" key={val}>
            {index === 0 ? '' : ' | '}
            {getLabel(val)}
          </span>
        ))}
      </ListboxButton>
      <ListboxOptions
        anchor={{
          to: 'bottom start',
          gap: 4,
        }}
        className={cn(
          'flex flex-wrap p-1 w-[360px] bg-card shadow-md rounded-md overflow-hidden border z-100',
          'listbox-panel',
        )}
      >
        {options.map((option) => (
          <ListboxOption
            key={option.value}
            value={option.value}
            className="w-[33.3%] group px-2 py-1 rounded flex items-center gap-2 bg-card data-[focus]:bg-accent cursor-default"
          >
            <HiCheck className="invisible size-4 group-data-[selected]:visible" />
            {getLabel(option.value)}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
