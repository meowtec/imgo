export function removeNulls<T>(arr: (T | null)[]): T[] {
  return arr.filter((x): x is T => x !== null);
}

export function updatePartial<T>(obj: T, partial: Partial<T> | ((obj: T) => Partial<T>)): T {
  if (typeof partial === 'function') {
    return { ...obj, ...partial(obj) };
  }
  return { ...obj, ...partial };
}

export function updateArrayItem<T>(
  arr: T[],
  filter: (item: T) => boolean,
  partial: Partial<T> | ((obj: T) => Partial<T>),
): T[] {
  return arr.map((item) => (filter(item) ? updatePartial(item, partial) : item));
}

export function removeArrayItem<T>(arr: T[], filter: (item: T) => boolean): T[] {
  return arr.filter((item) => !filter(item));
}
