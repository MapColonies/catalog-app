import { useEffect } from 'react';
import { WorkerWarmup } from '../../../../views/components/workers-bootstrapper';
import { useWorkerAPI } from './useWorkerAPI';

export const RasterWarmupWorker: React.FC<WorkerWarmup> = (props) => {
  const [api] = useWorkerAPI();
  useEffect(() => {
    if (api?.ready) {
      props.onReady();
    }
  }, [api?.ready, props.onReady]);

  return null;
};
