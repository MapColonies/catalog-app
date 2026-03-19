import { useEffect, useMemo, useState } from 'react';
import { wrap, Remote, proxy } from 'comlink';
import type { WorkerAPI } from './worker.types';

export function useWorkerAPI<T>(): {
  calculateArea: {
    method: (data: number[]) => Promise<number[]>;
    progress: number;
  };
  fetchAndDouble: {
    method: () => Promise<number[]>;
    progress: number;
  };
} | null {
  const [workerApi, setWorkerApi] = useState<any>(null);
  const [progressCalculateArea, setProgressCalculateArea] = useState(0);

  useEffect(() => {
    const worker = new Worker(
      new URL('./feat-collection-area.worker-api.ts', import.meta.url),
      { type: 'module' }
    );

    const wrapped: Remote<WorkerAPI> = wrap(worker);
    setWorkerApi({
      calculateArea: async (data: number[], onProgress?: (p: number) => void) => await wrapped.calculateArea(data, onProgress),
      fetchAndDouble: async () => await wrapped.fetchAndDouble(),
    });

    return () => worker.terminate();
  }, []);

  const api = useMemo(() => {
    if (!workerApi) return null;

    return {
      calculateArea: {
        method: async (data: number[]) => {
          setProgressCalculateArea(0);

          return await workerApi.calculateArea(
            data,
            proxy((p: number) => {
              console.log("UI progress", p);
              setProgressCalculateArea(p);
            })
          );
        },
        progress: progressCalculateArea
      },

      fetchAndDouble: {
        method: async () => {
          return await workerApi.fetchAndDouble();
        },
        progress: -1 // no progress for this method
      }
    };
  }, [workerApi, progressCalculateArea]);

  return api;
}