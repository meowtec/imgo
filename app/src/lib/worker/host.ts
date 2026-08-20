import { nanoid } from 'nanoid';
import { FUNCTION_PLACEHOLDER, type WorkerMessage } from './types';
import { promiseWithResolvers } from '../promise';

export type InvokeBase = (name: string, ...args: unknown[]) => Promise<unknown>;

export type WorkerInvoke<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (name: K, ...args: A) => Promise<Awaited<R>>
    : never;
}[keyof T];

export function createCalls<T>(worker: Worker) {
  const handlerMap = new Map<
    string,
    {
      resolve: (data: unknown) => void;
      reject: (error: unknown) => void;
      callbacks: Record<number, (...data: unknown[]) => void>;
    }
  >();

  const mainPromiseResolvers = promiseWithResolvers<void>();

  const call: InvokeBase = async (name: string, ...args: unknown[]) => {
    const callbacks: Record<number, (...data: unknown[]) => void> = {};

    const serializedArgs = args.map((arg, index) => {
      if (typeof arg === 'function') {
        callbacks[index] = arg as (...data: unknown[]) => void;
        return FUNCTION_PLACEHOLDER;
      }

      return arg;
    });
    const id = nanoid();

    const message: WorkerMessage = {
      type: 'call',
      name,
      id,
      params: serializedArgs,
    };

    await mainPromiseResolvers.promise;

    worker.postMessage(message);

    return new Promise((resolve, reject) => {
      handlerMap.set(id, {
        resolve,
        reject,
        callbacks,
      });
    });
  };

  worker.addEventListener('message', ({ data }: MessageEvent<WorkerMessage | 'INIT'>) => {
    if (data === 'INIT') {
      mainPromiseResolvers.resolve();
      return;
    }

    if (data.type === 'return' || data.type === 'callback') {
      const handler = handlerMap.get(data.id);

      if (!handler) {
        console.error(`Can not find handler for id ${data.id}`);
        return;
      }

      if (data.type === 'return') {
        const returnData = data.data;
        if (returnData.type === 'success') {
          handler.resolve(returnData.data);
        }

        if (returnData.type === 'fail') {
          handler.reject(returnData.error);
        }

        if (Object.keys(handler.callbacks).length === 0) {
          handlerMap.delete(data.id);
        }
      }

      if (data.type === 'callback') {
        handler.callbacks[data.index](data.data);
      }
    }

    if (data.type === 'finish') {
      handlerMap.delete(data.id);
    }
  });

  worker.addEventListener('error', (e) => {
    mainPromiseResolvers.reject(e.error);
  });

  return call as unknown as WorkerInvoke<T>;
}
