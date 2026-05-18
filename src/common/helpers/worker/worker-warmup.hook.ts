import { useEffect } from 'react';
import { IWorkerHookBase, IWorkerWarmupHook } from './worker.types';

export const useWarmupWorker = <T extends IWorkerHookBase>(props: IWorkerWarmupHook<T>) => {
  useEffect(() => {
    if (props.api?.ready) {
      props.onReady();
    }
  }, [props.api?.ready, props.onReady]);
};
