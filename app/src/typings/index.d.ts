interface Window {
  cacheImageRootPath: string;
}

declare const RUNTIME: 'tauri' | 'web';

// web worker
declare module '*?worker' {
  const workerConstructor: {
    new (options?: { name?: string }): Worker;
  };
  export default workerConstructor;
}

declare module '*.css';
