import { expose } from 'comlink';
import initGeos, { geos } from 'geos-wasm';
import { cloneDeep } from 'lodash';
import {
  FeatureCollection,
  Feature,
  Geometry,
  GeoJsonProperties,
  Polygon,
  MultiPolygon,
} from 'geojson';
import RBush from 'rbush';
import { DEGREES_PER_METER, ONE_DEGREE_KM } from '../../../../../common/utils/geo.tools';
import {
  WorkerAPI,
  WorkerMessage,
  IndexedItem,
  BBoxObj,
  LoadOptions,
  CustomProperties,
  Process,
  Stage,
  MessageDetails,
  WorkerType,
} from './worker.types';

type ShpJsParser = (buffer: ArrayBuffer) => Promise<unknown>;

let _geos: geos;
let _fc: FeatureCollection;
let _geoms: number[] = [];
let _tree = new RBush<IndexedItem>();
const _properties: Record<string, unknown>[] = [];
const _featureTemplate: Feature[] = [];

const formatTime = (performanceStartTime: number) => {
  return (performance.now() - performanceStartTime).toFixed(0);
};

export const buildMessage = (
  percent: number,
  performanceStartTime: number,
  error?: string
): MessageDetails => ({
  progress: `${percent}%`,
  elapsedTime: `${formatTime(performanceStartTime)} (ms)`,
  error: error,
});

export const percentageOfTotal = (
  total: number | null | undefined,
  partial: number,
  performanceStartTime: number
): MessageDetails => {
  const timeItTookInMs = `${formatTime(performanceStartTime)} (ms)`;

  if (total !== null && total !== undefined) {
    return {
      progress: `${Math.floor((partial / total) * 100)}%`,
      elapsedTime: timeItTookInMs,
    };
  } else {
    return {
      progress: '0%',
      elapsedTime: timeItTookInMs,
    };
  }
};

const _computeBBox = (geometry: Polygon | MultiPolygon) => {
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  const scan = (coords: any) => {
    if (typeof coords[0] === 'number') {
      const [x, y] = coords;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    } else {
      coords.forEach(scan);
    }
  };

  scan(geometry.coordinates);

  return { minX, minY, maxX, maxY };
};

const _GEOSGeomToGeoJSON = (geomPtr: number): Geometry => {
  const writer = _geos.GEOSGeoJSONWriter_create();

  const indentation = -1; // MO indentation
  const jsonPtr = _geos.GEOSGeoJSONWriter_writeGeometry(writer, geomPtr, indentation);

  // Extract the string from WASM memory to JS
  const geojsonString = _geos.Module.UTF8ToString(jsonPtr);
  // console.log('***** GEOSGeomToGeoJSON:', geojsonString);

  // Cleanup memory (Crucial in GEOS-WASM)
  _geos.GEOSFree(jsonPtr);
  _geos.GEOSGeoJSONWriter_destroy(writer);

  return JSON.parse(geojsonString);
};

const _downloadFile = async (
  url: string,
  onProgress?: (p: WorkerMessage | null) => void
): Promise<ArrayBuffer | null> => {
  try {
    const t0 = performance.now();
    const response = await fetch(url);

    if (!response.ok || !response.body) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : null;

    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    let details: MessageDetails;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      received += value.length;

      details = percentageOfTotal(total, received, t0);

      onProgress?.({
        process: Process.Load,
        stage: Stage.Download,
        type: WorkerType.Progress,
        details: details,
      });
    }

    // Combine chunks into one ArrayBuffer
    const blob = new Blob(chunks);
    const arrayBuffer = await blob.arrayBuffer();
    details = percentageOfTotal(total, received, t0);

    onProgress?.({
      process: Process.Load,
      stage: Stage.Download,
      type: WorkerType.Error,
      details,
    });
    return arrayBuffer;
  } catch (error) {
    onProgress?.({
      process: Process.Load,
      stage: Stage.Download,
      type: WorkerType.Error,
      details: (error as any).message,
    });
    return null;
  }
};

const isFeatureCollection = (
  value: unknown
): value is FeatureCollection<Geometry, GeoJsonProperties> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'FeatureCollection' &&
    Array.isArray((value as { features?: unknown }).features)
  );
};

const toFeatureCollection = (parsed: unknown): FeatureCollection<Geometry, GeoJsonProperties> => {
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

const parseShpFileContent = async (buffer: ArrayBuffer): Promise<FeatureCollection> => {
  const shpjsModule = (await import('shpjs')) as unknown as {
    default?: ShpJsParser;
  };

  const parser = shpjsModule.default ?? (shpjsModule as unknown as ShpJsParser);
  if (typeof parser !== 'function') {
    throw new Error('shpjs parser is not available');
  }
  const parsed = await parser(buffer);
  const collection = toFeatureCollection(parsed);
  return collection;
};

function _getCustomProps<T extends CustomProperties>(templates: T, replacement: string): T {
  if (!templates) return {} as T;
  return Object.fromEntries(
    Object.entries(templates).map(([key, value]) => [key, value.replace(/{index}/g, replacement)])
  ) as T;
}

const prepareGEOSData = (
  customProps?: CustomProperties,
  onProgress?: (p: WorkerMessage | null) => void
) => {
  const startParsingTime = performance.now();
  let message: MessageDetails;
  const reader = _geos.GEOSGeoJSONReader_create();

  const items: IndexedItem[] = [];
  let i = 0;
  for (const f of _fc.features) {
    const geomString = JSON.stringify(f.geometry);

    const size = geomString.length + 1;
    const ptr = _geos.Module._malloc(size);
    _geos.Module.stringToUTF8(geomString, ptr, size);

    const geomPtr = _geos.GEOSGeoJSONReader_readGeometry(reader, ptr);

    _geos.Module._free(ptr);

    _geoms.push(geomPtr);
    _properties.push({
      ...(f.properties || {}),
      ..._getCustomProps(customProps as CustomProperties, i.toString()),
    });

    // store lightweight feature shell
    _featureTemplate.push({
      type: 'Feature',
      geometry: f.geometry, // keep original reference
      properties: null,
    });

    // RBush index
    const bbox = _computeBBox(f.geometry as Polygon | MultiPolygon);
    items.push({
      ...bbox,
      i,
    });

    if (i % 50 === 0) {
      message = percentageOfTotal(_fc.features.length, i + 1, startParsingTime);
      onProgress?.({
        process: Process.Load,
        stage: Stage.Parsing,
        type: WorkerType.Progress,
        details: message,
      });
    }
    i++;
  }

  _geos.GEOSGeoJSONReader_destroy(reader);
  message = percentageOfTotal(_fc.features.length, i + 1, startParsingTime);

  onProgress?.({
    process: Process.Load,
    stage: Stage.Parsing,
    type: WorkerType.Done,
    details: message,
  });
  // console.log('******* prepareGEOSData', performance.now()-t0, '(ms)'); // ~12K --> 23000ms

  const startCacheTime = performance.now();
  _tree.load(items);
  message = percentageOfTotal(_fc.features.length, i + 1, startCacheTime);

  onProgress?.({
    process: Process.Load,
    stage: Stage.Cache,
    type: WorkerType.Done,
    details: message,
  });
  // console.log('******* initQueryCache', performance.now()-t1, '(ms)'); // ~12K --> 17ms
};

const api: WorkerAPI = {
  async init(): Promise<void> {
    _geos = await initGeos();
  },
  dispose() {
    if (!_geoms) return;

    for (const g of _geoms) {
      try {
        _geos.GEOSGeom_destroy(g);
      } catch {}
    }
    _geoms = [];

    _tree.clear();
    console.log('******** DISPOSED');
  },
  async load(fc: FeatureCollection, options?: LoadOptions): Promise<void> {
    api.dispose();
    _fc = fc; //cloneDeep(fc);
    prepareGEOSData(options?.customProperties);
  },
  async loadFromShapeFile(
    url: string,
    options?: LoadOptions,
    onProgress?: (p: WorkerMessage | null) => void
  ): Promise<void> {
    api.dispose();
    const buffer = await _downloadFile(url, onProgress);
    if (buffer) {
      const fc = await parseShpFileContent(buffer);
      _fc = fc; //cloneDeep(fc);
      prepareGEOSData(options?.customProperties, onProgress);
    }
  },
  updateAreas(onProgress?: (p: WorkerMessage | null) => void): void {
    const total = _geoms.length;
    const t0 = performance.now();
    let message: MessageDetails;

    for (let i = 0; i < total; i++) {
      const areaPtr = _geos.Module._malloc(8);
      const centroidPtr = _geos.GEOSGetCentroid(_geoms[i]);
      const latitudePtr = _geos.Module._malloc(8);
      _geos.GEOSGeomGetY(centroidPtr, latitudePtr);
      const lat = _geos.Module.getValue(latitudePtr, 'double');

      const status = _geos.GEOSArea(_geoms[i], areaPtr);
      if (status !== 1) {
        onProgress?.({
          process: Process.UpdateAreas,
          stage: Stage.UpdateAreas,
          type: WorkerType.Error,
          details: {
            error: `BAD geometry: ${_properties[i].id}`,
          },
        });
        return;
      }

      _properties[i]._area =
        _geos.Module.getValue(areaPtr, 'double') *
        Math.pow(ONE_DEGREE_KM, 2) *
        Math.cos(lat * (Math.PI / 180));
      // console.log(`**** AREA(${_properties[i].id}): ${_properties[i]._area}`);

      if (i % 50 === 0) {
        message = percentageOfTotal(_fc.features.length, i + 1, t0);
        onProgress?.({
          process: Process.UpdateAreas,
          stage: Stage.UpdateAreas,
          type: WorkerType.Progress,
          details: message,
        });
      }

      _geos.Module._free(areaPtr);
      _geos.Module._free(latitudePtr);
      _geos.GEOSGeom_destroy(centroidPtr);
    }

    message = percentageOfTotal(total, total, t0);

    onProgress?.({
      process: Process.UpdateAreas,
      stage: Stage.UpdateAreas,
      type: WorkerType.Done,
      details: message,
    });
  },

  computeOuterGeometry(onProgress?: (p: WorkerMessage | null) => void): Geometry {
    const t0 = performance.now();
    let message: MessageDetails;

    message = percentageOfTotal(0, 0, t0);

    onProgress?.({
      process: Process.ComputeOuterGeometry,
      stage: Stage.ComputeOuterGeometry,
      type: WorkerType.Progress,
      details: message,
    });

    const count = _geoms.length;

    // 1. Create a TypedArray of the pointers
    const geomPtrs = new Int32Array(_geoms);

    // 2. Allocate space on the WASM heap (4 bytes per pointer)
    const bytesPerElement = geomPtrs.BYTES_PER_ELEMENT;
    const bufferPtr = _geos.Module._malloc(count * bytesPerElement);

    // 3. Set the pointers in the heap memory
    // Use HEAP32 for 32-bit pointers; shift right by 2 to get the index
    _geos.Module.HEAP32.set(geomPtrs, bufferPtr >> 2);

    // 4. Create a GeometryCollection from these pointers
    // GEOSUnaryUnion typically operates on a single Geometry (like a Collection)
    const collection = _geos.GEOSGeom_createCollection(
      7, // GEOS_GEOMETRYCOLLECTION type
      bufferPtr,
      count
    );

    message = percentageOfTotal(10, 3, t0);

    onProgress?.({
      process: Process.ComputeOuterGeometry,
      stage: Stage.ComputeOuterGeometry,
      type: WorkerType.Progress,
      details: message,
    });

    // 5. Calculate the merged geometry (Unary Union)
    const mergedGeomPtr = _geos.GEOSUnaryUnion(collection);

    // 6. Simplifies geometry with tillerance 10m (DEGREES_PER_METER * 10)
    const simplified = _geos.GEOSSimplify(mergedGeomPtr, DEGREES_PER_METER * 10);
    const simplifiedOuterJSON = _GEOSGeomToGeoJSON(simplified);

    // 7. Cleanup
    // Important: GEOSGeom_destroy(collection) also destroys members
    // If you want to keep originals, you might need to clone them first
    _geos.GEOSGeom_destroy(collection);
    _geos.Module._free(bufferPtr);
    _geos.GEOSGeom_destroy(simplified);

    message = percentageOfTotal(10, 10, t0);

    onProgress?.({
      process: Process.ComputeOuterGeometry,
      stage: Stage.ComputeOuterGeometry,
      type: WorkerType.Done,
      details: message,
    });

    return simplifiedOuterJSON;
  },
  getFeatureCollection(onProgress?: (p: WorkerMessage | null) => void): FeatureCollection {
    const t0 = performance.now();
    const featuresArray = cloneDeep(
      _featureTemplate.map((item, idx) => {
        return {
          ..._featureTemplate[idx],
          properties: _properties[idx],
        };
      })
    );

    console.log(
      'getFeatureCollection took:',
      _featureTemplate.length,
      '    ',
      performance.now() - t0,
      'ms'
    );

    return {
      type: 'FeatureCollection',
      features: featuresArray,
    };
  },
  query(bbox: BBoxObj, onProgress?: (p: WorkerMessage | null) => void): FeatureCollection {
    const t0 = performance.now();
    const matches = _tree.search(bbox);
    console.log('query took:', matches.length, '    ', performance.now() - t0, 'ms');
    return {
      type: 'FeatureCollection',
      features: matches.map((item) => {
        return {
          ..._featureTemplate[item.i],
          properties: _properties[item.i],
        };
      }),
    };
  },
};
expose(api);
