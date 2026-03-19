/// <reference lib="webworker" />

import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import initGeosJs from 'geos-wasm';

type ShpJsParser = (buffer: ArrayBuffer) => Promise<unknown>;

interface WorkerRequest {
  buffer: ArrayBuffer;
  batchSize?: number;
}

interface WorkerProgressMessage {
  type: 'progress';
  processed: number;
  total: number;
}

interface WorkerResultMessage {
  type: 'result';
  result: {
    type: 'FeatureCollection';
    features: Array<Feature<Geometry, GeoJsonProperties>>;
    meta: {
      total: number;
      elapsedMs: number;
    };
  };
}

interface WorkerErrorMessage {
  type: 'error';
  error: string;
}

const ctx: DedicatedWorkerGlobalScope = globalThis as unknown as DedicatedWorkerGlobalScope;
type GeosApi = Awaited<ReturnType<typeof initGeosJs>>;

const isFeatureCollection = (value: unknown): value is FeatureCollection<Geometry, GeoJsonProperties> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'FeatureCollection' &&
    Array.isArray((value as { features?: unknown }).features)
  );
};

const toFeatureCollection = (
  parsed: unknown
): FeatureCollection<Geometry, GeoJsonProperties> => {
  if (isFeatureCollection(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed)) {
    const features: Array<Feature<Geometry, GeoJsonProperties>> = [];
    parsed.forEach((item) => {
      if (isFeatureCollection(item)) {
        features.push(...item.features);
      }
    });
    return { type: 'FeatureCollection', features };
  }

  return { type: 'FeatureCollection', features: [] };
};

const getAreaWithGeos = (geos: GeosApi, geometry: Geometry): number | null => {
  const reader = geos.GEOSGeoJSONReader_create();
  const areaPtr = geos.Module._malloc(8);
  const geometryJson = JSON.stringify(geometry);
  const geometryPtrLength = geometryJson.length + 1;
  const geometryJsonPtr = geos.Module._malloc(geometryPtrLength);

  let geosGeometryPtr = 0;

  try {
    geos.Module.stringToUTF8(geometryJson, geometryJsonPtr, geometryPtrLength);
    geosGeometryPtr = geos.GEOSGeoJSONReader_readGeometry(reader, geometryJsonPtr);

    if (geosGeometryPtr === 0) {
      return null;
    }

    const status = geos.GEOSArea(geosGeometryPtr, areaPtr);
    if (status !== 1) {
      return null;
    }

    return geos.Module.getValue(areaPtr, 'double');
  } finally {
    if (geosGeometryPtr !== 0) {
      geos.GEOSGeom_destroy(geosGeometryPtr);
    }
    geos.GEOSGeoJSONReader_destroy(reader);
    geos.Module._free(geometryJsonPtr);
    geos.Module._free(areaPtr);
  }
};

const getShpParser = async (): Promise<ShpJsParser> => {
  const shpjsModule = (await import('shpjs')) as unknown as {
    default?: ShpJsParser;
  };

  const parser = shpjsModule.default ?? (shpjsModule as unknown as ShpJsParser);
  if (typeof parser !== 'function') {
    throw new Error('shpjs parser is not available');
  }

  return parser;
};

ctx.addEventListener('message', async (evt: MessageEvent<WorkerRequest>) => {
  try {
    const { buffer, batchSize = 500 } = evt.data;
    const safeBatchSize = Math.max(1, batchSize);
    const t0 = performance.now();

    const [parseZip, geos] = await Promise.all([getShpParser(), initGeosJs()]);
    const parsed = await parseZip(buffer);
    const collection = toFeatureCollection(parsed);
    const features = collection.features;

    const total = features.length;
    let processed = 0;

    for (let offset = 0; offset < total; offset += safeBatchSize) {
      const end = Math.min(offset + safeBatchSize, total);

      for (let i = offset; i < end; i++) {
        const feature = features[i];

        try {
          const geometry = feature.geometry;
          if (geometry == null) {
            throw new Error('feature has no geometry');
          }

          const area = getAreaWithGeos(geos, geometry);

          feature.properties = {
            ...(feature.properties ?? {}),
            area,
          };
        } catch (error) {
          feature.properties = {
            ...(feature.properties ?? {}),
            area: null,
            _areaError: error instanceof Error ? error.message : String(error),
          };
        }

        processed++;
      }

      ctx.postMessage({
        type: 'progress',
        processed,
        total,
      } satisfies WorkerProgressMessage);

      await Promise.resolve();
    }

    const elapsedMs = performance.now() - t0;

    ctx.postMessage({
      type: 'result',
      result: {
        type: 'FeatureCollection',
        features,
        meta: {
          total,
          elapsedMs,
        },
      },
    } satisfies WorkerResultMessage);
  } catch (error) {
    ctx.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    } satisfies WorkerErrorMessage);
  }
});
