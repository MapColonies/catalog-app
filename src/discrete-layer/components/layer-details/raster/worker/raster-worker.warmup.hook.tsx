import { useWarmupWorker } from '../../../../../common/helpers/worker/worker-warmup.hook';
import { IWorkerWarmupHook } from '../../../../../common/helpers/worker/worker.types';
import { IWorkerHookService, useRasterWorkerAPI } from './raster-worker-api.hook';

export const RasterWarmupWorker: React.FC<
  Pick<IWorkerWarmupHook<IWorkerHookService>, 'onReady'>
> = ({ onReady }) => {
  const [api] = useRasterWorkerAPI();

  useWarmupWorker<IWorkerHookService>({
    api,
    onReady,
  });

  return null;
};
