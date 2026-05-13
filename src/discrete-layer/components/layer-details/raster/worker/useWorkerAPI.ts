import { SetStateAction, useEffect, useMemo, useState } from 'react';
import { wrap, Remote, proxy } from 'comlink';
import { FeatureCollection, Geometry } from 'geojson';
import { fakeProgress } from '../../../../../common/helpers/fake-progress';
import {
  BBoxObj,
  ProcessInfo,
  LoadOptions,
  Process,
  Stage,
  WorkerAPI,
  WorkerMessage,
  WorkerType,
  WorkerError,
} from './worker.types';
import { WorkerBase } from './worker-hook.types';
import { buildMessageDetails } from './utils';

interface WorkerService extends WorkerBase {
  ready: boolean;
  init: {
    method: () => Promise<void>;
  };
  load: {
    method: (fc: FeatureCollection, options?: LoadOptions) => Promise<WorkerError | void>;
    progress: WorkerMessage[] | null;
  };
  loadFromShapeFile: {
    method: (url: string, options?: LoadOptions) => Promise<WorkerError | void>;
    progress: WorkerMessage[] | null;
  };
  updateAreas: {
    method: () => Promise<WorkerError | void>;
    progress: WorkerMessage | null;
  };
  computeOuterGeometry: {
    method: (predicate?: (properties: Record<string, unknown>) => boolean) => Promise<Geometry>;
    progress: WorkerMessage | null;
  };
  getFeatureCollection: {
    method: () => Promise<FeatureCollection>;
    progress: WorkerMessage | null;
  };
  getMarkersFromGeometry: {
    method: (geometry: Geometry) => Promise<FeatureCollection>;
  };
  query: {
    method: (bbox: BBoxObj) => Promise<FeatureCollection>;
    progress: WorkerMessage | null;
  };
}

const FAKE_PROGRESS_TIME = 10000;

const createRasterWorker = (): [Worker, Remote<WorkerAPI>] => {
  const worker = new Worker(new URL('./feat-collection.worker-api.ts', import.meta.url), {
    type: 'module',
  });

  return [worker, wrap(worker)];
};

export function useWorkerAPI(
  processRunCounts?: Partial<Record<Process, number>>
): [WorkerService | null, ProcessInfo] {
  const [workerApi, setWorkerApi] = useState<any>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [progressComputeArea, setProgressComputeArea] = useState<WorkerMessage | null>(null);
  const [progressComputeOuterGeometry, setProgressComputeOuterGeometry] =
    useState<WorkerMessage | null>(null);
  const [progressGetFeatureCollection, setProgressGetFeatureCollection] =
    useState<WorkerMessage | null>(null);
  const [loadShapeFileProgress, setLoadShapeFileProgress] = useState<WorkerMessage[] | null>(null);

  useEffect(() => {
    const [worker, wrapped]: [Worker, Remote<WorkerAPI>] = createRasterWorker();

    void wrapped.ready.then((isReady) => {
      setIsWorkerReady(isReady);
    });

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
      computeOuterGeometry: async (
        onProgress?: (p: WorkerMessage | null) => void,
        predicate?: (properties: Record<string, unknown>) => boolean
      ) => await wrapped.computeOuterGeometry(onProgress, predicate),
      getFeatureCollection: async (onProgress?: (p: WorkerMessage | null) => void) =>
        await wrapped.getFeatureCollection(onProgress),
      getMarkersFromGeometry: async (geometry: Geometry) =>
        await wrapped.getMarkersFromGeometry(geometry),
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
      ready: isWorkerReady,
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
              // console.log('**** Progress LoadShape: ', p);
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
              // console.log('**** Progress Area: ', p);
              setProgressComputeArea(p);
            })
          );
        },
        progress: progressComputeArea,
      },
      computeOuterGeometry: {
        method: async (predicate?: (properties: Record<string, unknown>) => boolean) => {
          const t0 = performance.now();

          const clear = fakeProgress(FAKE_PROGRESS_TIME, (fakePercent: number) => {
            const details = buildMessageDetails(`${fakePercent}`, t0);

            setProgressComputeOuterGeometry({
              process: Process.ComputeOuterGeometry,
              stage: Stage.ComputeOuterGeometry,
              type: WorkerType.Progress,
              details,
            });
          });

          const result = await workerApi.computeOuterGeometry(
            proxy((p: WorkerMessage) => {
              // If the worker sends real pulses, they still work here
              setProgressComputeOuterGeometry(p);
            }),
            predicate &&
              proxy((properties: Record<string, unknown>) => {
                return predicate(properties);
              })
          );

          clear();
          return result;
        },
        progress: progressComputeOuterGeometry,
      },
      getFeatureCollection: {
        method: async (): Promise<FeatureCollection> => {
          const startTime = performance.now();

          const clear = fakeProgress(FAKE_PROGRESS_TIME, (fakePercent: number) => {
            const details = buildMessageDetails(`${fakePercent}`, startTime);

            setProgressGetFeatureCollection({
              process: Process.GetFeatureCollection,
              stage: Stage.GetFeatureCollection,
              type: WorkerType.Progress,
              details,
            });
          });

          const result = await workerApi.getFeatureCollection(
            proxy((p: WorkerMessage) => {
              setProgressGetFeatureCollection(p);
            })
          );

          clear();
          return result;
        },
        progress: progressGetFeatureCollection,
      },
      getMarkersFromGeometry: {
        method: async (geometry: Geometry): Promise<FeatureCollection> => {
          return await workerApi.getMarkersFromGeometry(geometry);
        },
        progress: null,
      },
      query: {
        method: async (bbox: BBoxObj): Promise<FeatureCollection> => {
          return await workerApi.query(
            bbox,
            proxy((p: WorkerMessage) => {
              // console.log('**** QUERY by BBOX: ', p);
            })
          );
        },
        progress: null,
      },
    };
  }, [
    workerApi,
    isWorkerReady,
    loadShapeFileProgress,
    progressComputeOuterGeometry,
    progressComputeArea,
    progressGetFeatureCollection,
  ]);

  const DEFAULT_RUN_COUNT = 1;

  const stagesInfo: ProcessInfo = useMemo(() => {
    return {
      [Process.Init]: {
        runCount: processRunCounts?.[Process.Init] ?? DEFAULT_RUN_COUNT,
        stages: {
          [Stage.Init]: {
            translationCode: 'progress.stage.init',
            shouldShowProgress: false,
          },
        },
      },
      [Process.Load]: {
        runCount: processRunCounts?.[Process.Load] ?? DEFAULT_RUN_COUNT,
        stages: {
          [Stage.Download]: {
            translationCode: 'progress.stage.load',
            shouldShowProgress: true,
          },
          [Stage.Parsing]: {
            translationCode: 'progress.stage.parsing',
            shouldShowProgress: true,
          },
          [Stage.Cache]: {
            translationCode: 'progress.stage.cache',
            shouldShowProgress: false,
          },
        },
      },
      [Process.UpdateAreas]: {
        runCount: processRunCounts?.[Process.UpdateAreas] ?? DEFAULT_RUN_COUNT,
        stages: {
          [Stage.UpdateAreas]: {
            translationCode: 'progress.stage.updateAreas',
            shouldShowProgress: true,
          },
        },
      },
      [Process.ComputeOuterGeometry]: {
        runCount: processRunCounts?.[Process.ComputeOuterGeometry] ?? DEFAULT_RUN_COUNT,
        stages: {
          [Stage.ComputeOuterGeometry]: {
            translationCode: 'progress.stage.computeOuterGeometry',
            shouldShowProgress: true,
          },
        },
      },
      [Process.GetFeatureCollection]: {
        runCount: processRunCounts?.[Process.GetFeatureCollection] ?? DEFAULT_RUN_COUNT,
        stages: {
          [Stage.GetFeatureCollection]: {
            translationCode: 'progress.stage.getFeatureCollection',
            shouldShowProgress: true,
          },
        },
      },
    };
  }, []);

  return [api, stagesInfo];
}
