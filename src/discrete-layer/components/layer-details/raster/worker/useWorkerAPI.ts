import { useEffect, useMemo, useState } from 'react';
import { wrap, Remote, proxy } from 'comlink';
import type { BBoxObj, LoadOptions, WorkerAPI, WorkerMessage } from './worker.types';
import { FeatureCollection, Geometry } from 'geojson';

export function useWorkerAPI(): {
  init: {
    method: () => Promise<void>;
  };
  load: {
    method: (fc: FeatureCollection, options?: LoadOptions) => Promise<void>;
    progress: string;
  };
  loadFromShapeFile: {
    method: (url: string, options?: LoadOptions) => Promise<void>;
    progress: WorkerMessage | null;
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
} | null {
  const [workerApi, setWorkerApi] = useState<any>(null);
  const [progressComputeArea, setProgressComputeArea] = useState<WorkerMessage | null>(null);
  const [progressLoadShapeFile, setProgressLoadShapeFile] = useState<WorkerMessage | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('./feat-collection.worker-api.ts', import.meta.url), {
      type: 'module',
    });

    const wrapped: Remote<WorkerAPI> = wrap(worker);
    setWorkerApi({
      init: async () => await wrapped.init(),
      dispose: async () => await wrapped.dispose(),
      load: async (fc: FeatureCollection, options?: LoadOptions) => await wrapped.load(fc, options),
      loadFromShapeFile: async (url: string, options?: LoadOptions, onProgress?: (p: WorkerMessage | null) => void) =>
        await wrapped.loadFromShapeFile(url, options, onProgress),
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

  const api = useMemo(() => {
    if (!workerApi) return null;

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
        progress: '-1',
      },
      loadFromShapeFile: {
        method: async (url: string, options?: LoadOptions) => {
          setProgressLoadShapeFile(null);
          return await workerApi.loadFromShapeFile(
            url,
            options,
            proxy((p: WorkerMessage) => {
              console.log('**** Progress LoadShape: ', p);
              setProgressLoadShapeFile(p);
            })
          );
        },
        progress: progressLoadShapeFile,
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
          return await workerApi.computeOuterGeometry(
            proxy((p: WorkerMessage) => {
              console.log('**** Progress Outer Geometry: ', p);
            })
          );
        },
        progress: null,
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
  }, [workerApi, progressComputeArea, progressLoadShapeFile]);

  return api;
}
