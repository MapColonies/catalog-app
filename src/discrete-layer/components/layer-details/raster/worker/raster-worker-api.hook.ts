import { SetStateAction, useMemo, useState } from 'react';
import { proxy } from 'comlink';
import { FeatureCollection, Geometry } from 'geojson';
import { IWorkerBase, IWorkerHookBase } from '../../../../../common/helpers/worker/worker.types';
import { useComlinkWorker } from '../../../../../common/helpers/worker/worker.hook';
import { fakeProgress } from '../../../../../common/helpers/fake-progress';
import {
  BBoxObj,
  ProcessInfo,
  LoadOptions,
  Process,
  Stage,
  WorkerMessage,
  WorkerType,
  WorkerError,
} from './worker.types';
import { buildMessageDetails } from './utils';

export interface IWorkerHookService extends IWorkerHookBase {
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

export interface IRasterWorkerApi extends IWorkerBase {
  init(): Promise<unknown>;
  load(fc: FeatureCollection, options?: LoadOptions): Promise<unknown>;
  loadFromShapeFile(
    url: string,
    options?: LoadOptions,
    onProgress?: (p: WorkerMessage | null) => void
  ): Promise<unknown>;
  updateAreas(onProgress?: (p: WorkerMessage | null) => void): Promise<unknown>;
  computeOuterGeometry(
    onProgress?: (p: WorkerMessage | null) => void,
    predicate?: (properties: Record<string, unknown>) => boolean
  ): Promise<unknown>;
  getFeatureCollection(onProgress?: (p: WorkerMessage | null) => void): Promise<unknown>;
  getMarkersFromGeometry(geometry: Geometry): Promise<unknown>;
  query(bbox: BBoxObj, onProgress?: (p: WorkerMessage | null) => void): Promise<FeatureCollection>;
}

const FAKE_PROGRESS_TIME = 10000;
const DEFAULT_RUN_COUNT = 1;

export function useRasterWorkerAPI(
  processRunCounts?: Partial<Record<Process, number>>
): [IWorkerHookService | null, ProcessInfo] {
  const worker = useMemo(() => {
    const worker = new Worker(new URL('./feat-collection.worker-api.ts', import.meta.url), {
      type: 'module',
    });

    return worker;
  }, []);

  const [comlinkWorker, isWorkerReady] = useComlinkWorker<IRasterWorkerApi>(worker);

  const [progressComputeArea, setProgressComputeArea] = useState<WorkerMessage | null>(null);
  const [progressComputeOuterGeometry, setProgressComputeOuterGeometry] =
    useState<WorkerMessage | null>(null);
  const [progressGetFeatureCollection, setProgressGetFeatureCollection] =
    useState<WorkerMessage | null>(null);
  const [progressLoadShapeFile, setProgressLoadShapeFile] = useState<WorkerMessage[] | null>(null);

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

  const api: IWorkerHookService | null = useMemo(() => {
    if (!comlinkWorker) {
      return null;
    }

    return {
      ready: isWorkerReady,
      init: {
        method: async () => {
          await comlinkWorker.init();
        },
      },
      load: {
        method: async (fc: FeatureCollection, options?: LoadOptions) => {
          return (await comlinkWorker.load(fc, options)) as WorkerError | void;
        },
        progress: null,
      },
      loadFromShapeFile: {
        method: async (url: string, options?: LoadOptions) => {
          setProgressLoadShapeFile(null);
          return (await comlinkWorker.loadFromShapeFile(
            url,
            options,
            proxy((p: WorkerMessage | null) => {
              // console.log('**** Progress LoadShape: ', p);
              if (p) upsertWorkerMessageByStage(Process.Load, p, setProgressLoadShapeFile);
            })
          )) as WorkerError | void;
        },
        progress: progressLoadShapeFile,
      },
      updateAreas: {
        method: async () => {
          setProgressComputeArea(null);
          return (await comlinkWorker.updateAreas(
            proxy((p: WorkerMessage | null) => {
              // console.log('**** Progress Area: ', p);
              setProgressComputeArea(p);
            })
          )) as WorkerError | void;
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

          const result = await comlinkWorker.computeOuterGeometry(
            proxy((p: WorkerMessage | null) => {
              // If the worker sends real pulses, they still work here
              setProgressComputeOuterGeometry(p);
            }),
            predicate &&
              proxy((properties: Record<string, unknown>) => {
                return predicate(properties);
              })
          );

          clear();
          return result as Geometry;
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

          const result = await comlinkWorker.getFeatureCollection(
            proxy((p: WorkerMessage | null) => {
              setProgressGetFeatureCollection(p);
            })
          );

          clear();
          return result as FeatureCollection;
        },
        progress: progressGetFeatureCollection,
      },
      getMarkersFromGeometry: {
        method: async (geometry: Geometry): Promise<FeatureCollection> => {
          return (await comlinkWorker.getMarkersFromGeometry(geometry)) as FeatureCollection;
        },
        progress: null,
      },
      query: {
        method: async (bbox: BBoxObj): Promise<FeatureCollection> => {
          return await comlinkWorker.query(
            bbox,
            proxy((p: WorkerMessage | null) => {
              // console.log('**** QUERY by BBOX: ', p);
            })
          );
        },
        progress: null,
      },
    };
  }, [
    comlinkWorker,
    isWorkerReady,
    progressLoadShapeFile,
    progressComputeOuterGeometry,
    progressComputeArea,
    progressGetFeatureCollection,
  ]);

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
