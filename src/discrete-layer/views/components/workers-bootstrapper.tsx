import { useState } from 'react';
import { RasterWarmupWorker } from '../../components/layer-details/raster/worker/worker-warmup';

export interface WorkerWarmup {
  onReady: () => void;
}

export const WorkersBootstrapper: React.FC = () => {
  const [isRasterWorkerAlive, setIsRasterWorkerAlive] = useState(true);

  return (
    <>
      {isRasterWorkerAlive && <RasterWarmupWorker onReady={() => setIsRasterWorkerAlive(false)} />}
    </>
  );
};
