import { MAX_PROCESSING_COUNT } from '@/constants/app';

class Cluster {
  private pendingCount = 0;

  onIdle = () => {};

  constructor(private maxSize = MAX_PROCESSING_COUNT) {}

  get available() {
    return this.pendingCount < this.maxSize;
  }

  addTask(promise: Promise<unknown>) {
    this.pendingCount += 1;
    void promise.finally(() => {
      this.pendingCount -= 1;
      if (this.available) {
        this.onIdle();
      }
    });
  }
}

export const taskCluster = new Cluster();
