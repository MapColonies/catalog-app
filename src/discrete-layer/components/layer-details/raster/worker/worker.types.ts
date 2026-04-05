import { FeatureCollection, Geometry } from 'geojson';
import { FeatureType } from '../pp-map.utils';

export type BBoxObj = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};
export type IndexedItem = BBoxObj & { i: number };

export type CustomProperties = {
  [K in `_${string}`]: any;
} & { _featureType?: FeatureType };

export interface LoadOptions {
  customProperties?: CustomProperties;
}

export interface WorkerAPI {
  init(): Promise<void>;
  dispose(): void;
  load(fc: FeatureCollection, options?: LoadOptions): Promise<void>;
  loadFromShapeFile(
    url: string,
    options?: LoadOptions,
    onProgress?: (p: WorkerMessage | null) => void
  ): Promise<void>;
  updateAreas(onProgress?: (p: WorkerMessage | null) => void): void;
  computeOuterGeometry(onProgress?: (p: WorkerMessage | null) => void): Geometry;
  getFeatureCollection(onProgress?: (p: WorkerMessage | null) => void): FeatureCollection;
  query(bbox: BBoxObj, onProgress?: (p: WorkerMessage | null) => void): FeatureCollection;
}

export interface WorkerMessage {
  process:
    | 'Download'
    | 'Parsing'
    | 'Cache'
    | 'UpdateAreas'
    | 'ComputeOuterGeometry'
    | 'GetFeatureCollection';
  type: 'Progress' | 'Done' | 'Error';
  message: string;
}
