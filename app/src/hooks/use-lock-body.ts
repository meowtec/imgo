import { useEffect, useId } from 'react';

export function useLockBody(locked: boolean) {
  const id = useId();

  useEffect(() => {
    const className = `lock-scroll-${id}`;
    if (locked) {
      document.body.classList.add(className);
    }

    return () => {
      document.body.classList.remove(className);
    };
  }, [id, locked]);
}
