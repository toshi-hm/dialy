export type DebouncedFunction<TArgs extends unknown[]> = ((
  ...args: TArgs
) => void) & {
  cancel: () => void;
  flush: () => void;
};

export function debounce<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number,
): DebouncedFunction<TArgs> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: TArgs | undefined;

  const debounced = (...args: TArgs) => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = undefined;

      if (!lastArgs) {
        return;
      }

      callback(...lastArgs);
      lastArgs = undefined;
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = undefined;
    lastArgs = undefined;
  };

  debounced.flush = () => {
    if (!lastArgs) {
      return;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    callback(...lastArgs);
    lastArgs = undefined;
  };

  return debounced;
}
