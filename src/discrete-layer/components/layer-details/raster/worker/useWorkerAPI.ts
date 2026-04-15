import { SetStateAction, useEffect, useMemo, useState } from 'react';
import { wrap, Remote, proxy } from 'comlink';
import { FeatureCollection, Geometry } from 'geojson';
import {
  BBoxObj,
  StagesInfo,
  LoadOptions,
  Process,
  Stage,
  WorkerAPI,
  WorkerMessage,
  WorkerType,
} from './worker.types';
import { buildMessage } from './feat-collection.worker-api';

type WorkerService = {
  init: {
    method: () => Promise<void>;
  };
  load: {
    method: (fc: FeatureCollection, options?: LoadOptions) => Promise<void>;
    progress: WorkerMessage[] | null;
  };
  loadFromShapeFile: {
    method: (url: string, options?: LoadOptions) => Promise<void>;
    progress: WorkerMessage[] | null;
  };
  updateAreas: {
    method: () => Promise<void>;
    progress: WorkerMessage | null;
  };
  computeOuterGeometry: {
    method: () => Promise<Geometry>;
    progress: WorkerMessage | null;
  };
  getFeatureCollection: {
    method: () => Promise<FeatureCollection>;
    progress: WorkerMessage | null;
  };
  query: {
    method: (bbox: BBoxObj) => Promise<FeatureCollection>;
    progress: WorkerMessage | null;
  };
};

export function useWorkerAPI(): [WorkerService | null, StagesInfo] {
  const [workerApi, setWorkerApi] = useState<any>(null);
  const [progressComputeArea, setProgressComputeArea] = useState<WorkerMessage | null>(null);
  const [progressComputeOuterGeometry, setProgressComputeOuterGeometry] =
    useState<WorkerMessage | null>(null);
  const [loadShapeFileProgress, setLoadShapeFileProgress] = useState<WorkerMessage[] | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('./feat-collection.worker-api.ts', import.meta.url), {
      type: 'module',
    });

    const wrapped: Remote<WorkerAPI> = wrap(worker);
    setWorkerApi({
      init: async () => await wrapped.init(),
      dispose: async () => await wrapped.dispose(),
      load: async (fc: FeatureCollection, options?: LoadOptions) => await wrapped.load(fc, options),
      loadFromShapeFile: async (
        url: string,
        options?: LoadOptions,
        onProgress?: (p: WorkerMessage | null) => void
      ) => await wrapped.loadFromShapeFile(url, options, onProgress),
      updateAreas: async (onProgress?: (p: WorkerMessage | null) => void) =>
        await wrapped.updateAreas(onProgress),
      computeOuterGeometry: async (onProgress?: (p: WorkerMessage | null) => void) =>
        await wrapped.computeOuterGeometry(onProgress),
      getFeatureCollection: async (onProgress?: (p: WorkerMessage | null) => void) =>
        await wrapped.getFeatureCollection(onProgress),
      query: async (
        bbox: BBoxObj,
        onProgress?: (p: WorkerMessage | null) => void
      ): Promise<FeatureCollection> => await wrapped.query(bbox, onProgress),
    });

    return () => {
      wrapped.dispose();
      worker.terminate();
    };
  }, []);

  const upsertWorkerMessageByStage = (
    process: Process,
    workerMessage: WorkerMessage,
    setProgresses: (value: SetStateAction<WorkerMessage[] | null>) => void
  ) => {
    if (process !== workerMessage.process) {
      return;
    }

    setProgresses((prev) => {
      const current = prev ?? [];

      const stageIndex = current.findIndex((msg) => msg.stage === workerMessage.stage);

      if (stageIndex > -1) {
        const newArr = [...current];
        newArr[stageIndex] = workerMessage;
        return newArr;
      } else {
        return [...current, workerMessage];
      }
    });
  };

  const api: WorkerService | null = useMemo(() => {
    if (!workerApi) {
      return null;
    }

    return {
      init: {
        method: async () => {
          return await workerApi.init();
        },
      },
      load: {
        method: async (fc: FeatureCollection, options?: LoadOptions) => {
          return await workerApi.load(fc, options);
        },
        progress: null,
      },
      loadFromShapeFile: {
        method: async (url: string, options?: LoadOptions) => {
          setLoadShapeFileProgress(null);
          return await workerApi.loadFromShapeFile(
            url,
            options,
            proxy((p: WorkerMessage) => {
              console.log('**** Progress LoadShape: ', p);
              upsertWorkerMessageByStage(Process.Load, p, setLoadShapeFileProgress);
            })
          );
        },
        progress: loadShapeFileProgress,
      },
      updateAreas: {
        method: async () => {
          setProgressComputeArea(null);
          return await workerApi.updateAreas(
            proxy((p: WorkerMessage) => {
              console.log('**** Progress Area: ', p);
              setProgressComputeArea(p);
            })
          );
        },
        progress: progressComputeArea,
      },

      computeOuterGeometry: {
        method: async () => {
          // 1. Setup the "Fake" Progress interval
          const duration = 10000; // 10 seconds
          const t0 = performance.now();

          const timer = setInterval(() => {
            const passedTimeFromTheBeginning = performance.now() - t0;
            const ratioOfPassedTime = Math.min(passedTimeFromTheBeginning / duration, 1);

            const eased =
              ratioOfPassedTime < 0.5
                ? 2 * ratioOfPassedTime * ratioOfPassedTime
                : 1 - Math.pow(-2 * ratioOfPassedTime + 2, 2) / 2;
            // Fast-start easing: (1 - (1 - x)^2) slows down towards the end
            // const fakePercent = Math.floor((1 - Math.pow(1 - ratioOfPassedTime, 2)) * 95);
            const fakePercent = Math.floor(eased * 95);
            const details = buildMessage(fakePercent, t0);

            setProgressComputeOuterGeometry({
              process: Process.ComputeOuterGeometry,
              stage: Stage.ComputeOuterGeometry,
              type: WorkerType.Progress,
              details,
            });

            // Safety: Stop updating if we hit the 95% cap
            if (fakePercent >= 95) {
              clearInterval(timer);
            }
          }, 200); // Update every 200ms (5 times per second) is plenty for a bar

          try {
            // 2. Await the actual heavy worker task
            const result = await workerApi.computeOuterGeometry(
              proxy((p: WorkerMessage) => {
                // If the worker sends real pulses, they still work here
                setProgressComputeOuterGeometry(p);
              })
            );

            // 3. Cleanup and finish
            clearInterval(timer);
            return result;
          } catch (err) {
            clearInterval(timer);
            throw err;
          }
        },
        progress: progressComputeOuterGeometry,
      },
      getFeatureCollection: {
        method: async (): Promise<FeatureCollection> => {
          return await workerApi.getFeatureCollection(
            proxy((p: WorkerMessage) => {
              console.log('**** GET FEATURECOLLECTION: ', p);
            })
          );
        },
        progress: null,
      },
      query: {
        method: async (bbox: BBoxObj): Promise<FeatureCollection> => {
          return await workerApi.query(
            bbox,
            proxy((p: WorkerMessage) => {
              console.log('**** QUERY by BBOX: ', p);
            })
          );
        },
        progress: null,
      },
    };
  }, [workerApi, progressComputeArea, progressComputeOuterGeometry, loadShapeFileProgress]);

  const stagesInfo: StagesInfo = useMemo(() => {
    return {
      [Process.Init]: {
        stages: {
          [Stage.Init]: {
            translationCode: 'progress.stage.init.translationCode',
            shouldShowProgress: false,
          },
        },
      },
      [Process.Load]: {
        stages: {
          [Stage.Download]: {
            translationCode: 'progress.stage.load.translationCode',
            shouldShowProgress: true,
          },
          [Stage.Parsing]: {
            translationCode: 'progress.stage.parsing.translationCode',
            shouldShowProgress: true,
          },
          [Stage.Cache]: {
            translationCode: 'progress.stage.cache.translationCode',
            shouldShowProgress: false,
          },
        },
      },
      [Process.UpdateAreas]: {
        stages: {
          [Stage.UpdateAreas]: {
            translationCode: 'progress.stage.updateAreas.translationCode',
            shouldShowProgress: true,
          },
        },
      },
      [Process.ComputeOuterGeometry]: {
        stages: {
          [Stage.ComputeOuterGeometry]: {
            translationCode: 'progress.stage.computeOuterGeometry.translationCode',
            shouldShowProgress: true,
          },
        },
      },
    };
  }, []);

  return [api, stagesInfo];
}
