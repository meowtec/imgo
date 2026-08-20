import { FUNCTION_PLACEHOLDER, type CallbackData, type WorkerMessage } from './types';

const registers: Record<string, (...args: unknown[]) => unknown> = {};

function post(message: WorkerMessage) {
  globalThis.postMessage(message);
}

function returnCallback(id: string, data: CallbackData) {
  post({
    type: 'return',
    id,
    data,
  });
}

function callback(id: string, argIndex: number, data: unknown[]) {
  post({
    type: 'callback',
    id,
    index: argIndex,
    data,
  });
}

globalThis.onmessage = async ({ data }: MessageEvent<WorkerMessage>) => {
  if (typeof data === 'object' && data.type === 'call') {
    const fn = registers[data.name];

    if (!fn) {
      returnCallback(data.id, {
        type: 'fail',
        error: `Method ${data.name} not found`,
      });

      return;
    }

    try {
      const activeCallbackIndexs = new Set<number>();
      const registry = new FinalizationRegistry((heldValue: number) => {
        activeCallbackIndexs.delete(heldValue);
        if (activeCallbackIndexs.size === 0) {
          post({
            type: 'finish',
            id: data.id,
          });
        }
      });

      const params = data.params.map((item, index) => {
        if (item === FUNCTION_PLACEHOLDER) {
          const cb = (...cbArgs: unknown[]) => {
            callback(data.id, index, cbArgs);
          };

          registry.register(cb, index);
          activeCallbackIndexs.add(index);

          return cb;
        }

        return item;
      });
      const result = await fn(...params);
      returnCallback(data.id, {
        type: 'success',
        data: result,
      });
    } catch (error) {
      returnCallback(data.id, {
        type: 'fail',
        error,
      });
    }
  }
};

export function provideMethod(name: string, fn: (...args: unknown[]) => unknown) {
  registers[name] = fn;
}

export function provideMethods<T extends object>(methods: T) {
  for (const [key, value] of Object.entries(methods)) {
    if (typeof value === 'function') {
      provideMethod(key, value as (...args: unknown[]) => unknown);
    }
  }
}

post('INIT');
