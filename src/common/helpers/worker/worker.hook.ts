import { Remote, wrap } from 'comlink';
import { useEffect, useState } from 'react';
import { IWorkerBase } from './worker.types';

export function useComlinkWorker<T extends IWorkerBase>(worker: Worker) {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [comlinkWorker, setComlinkWorker] = useState<Remote<T> | null>();

  useEffect(() => {
    const comlinkWorker: Remote<T> = wrap(worker);
    setComlinkWorker(() => comlinkWorker);
    void comlinkWorker.ready.then((isReady) => {
      setIsWorkerReady(isReady);
    });

    return () => {
      comlinkWorker.cleanup();
      worker.terminate();
    };
  }, []);

  return [comlinkWorker, isWorkerReady] as const;
}
