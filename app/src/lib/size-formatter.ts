export type Unit = 'B' | 'KB' | 'MB';

export const toFixed = (number: number, digits: number) => Number(number.toFixed(digits));

export const baseSizeFormatter = (bytes: number): [number, Unit] => {
  let number: number;
  let unit: Unit;

  const k = 1024;

  if (bytes < 1000) {
    number = bytes;
    unit = 'B';
  } else if (bytes < 1000 * k) {
    number = toFixed(bytes / k, 2);
    unit = 'KB';
  } else {
    number = toFixed(bytes / k / k, 2);
    unit = 'MB';
  }

  return [number, unit];
};

export const bigintToNumber = <T>(value: T): Exclude<T, bigint> | number => {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  return value as Exclude<T, bigint>;
};

export const sizeFormatter = (bytes: number | bigint): string => {
  const [number, unit] = baseSizeFormatter(bigintToNumber(bytes));

  return `${number}${unit}`;
};
