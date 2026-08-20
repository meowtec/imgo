import { createCalls, type WorkerInvoke } from '@/lib/worker/host';
import type { WorkerApis } from './types';
// oxlint-disable-next-line import/default -- Vite's ?worker virtual module default-exports a Worker constructor.
import Worker from './worker?worker';
import { MAX_PROCESSING_COUNT } from '@/constants/app';

interface WorkerInstance {
  worker: Worker;
  invoke: WorkerInvoke<WorkerApis>;
  load: number;
  freeTimer: number;
}

function createWorkersInvoke() {
  const workers: WorkerInstance[] = [];

  const createWorker = () => {
    const worker = new Worker();
    const invoke = createCalls<WorkerApis>(worker);

    const instance = {
      worker,
      invoke,
      load: 0,
      freeTimer: 0,
    };

    workers.push(instance);

    return instance;
  };

  const freeWorker = (worker: WorkerInstance) => {
    worker.worker.terminate();
    workers.splice(workers.indexOf(worker), 1);
  };

  const pickWorker = () => {
    const idleWorker = workers.find((w) => w.load === 0);

    if (idleWorker) {
      return idleWorker;
    }

    if (workers.length < MAX_PROCESSING_COUNT) {
      return createWorker();
    }

    return workers.reduce(
      (prev, curr) => (curr.load < prev.load ? curr : prev),
      workers[Math.floor(Math.random() * workers.length)],
    );
  };

  const invoke: WorkerInvoke<WorkerApis> = async (name, ...args) => {
    const worker = pickWorker();

    worker.load += 1;
    window.clearTimeout(worker.freeTimer);

    try {
      return await worker.invoke(name, ...args);
    } catch (err) {
      console.error(`[worker] ${name} error`, err);
      throw err;
    } finally {
      worker.load -= 1;
      if (worker.load === 0) {
        worker.freeTimer = window.setTimeout(() => {
          freeWorker(worker);
        }, 5000);
      }
    }
  };

  return invoke;
}

export const invoke = createWorkersInvoke();
