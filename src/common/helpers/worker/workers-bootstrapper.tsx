import { useState } from 'react';
import { RasterWarmupWorker } from '../../../discrete-layer/components/layer-details/raster/worker/raster-worker.warmup.hook';

export const WorkersBootstrapper: React.FC = () => {
  const [isRasterWorkerAlive, setIsRasterWorkerAlive] = useState(true);

  return (
    <>
      {isRasterWorkerAlive && <RasterWarmupWorker onReady={() => setIsRasterWorkerAlive(false)} />}
    </>
  );
};
