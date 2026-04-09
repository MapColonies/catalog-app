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

// export type Process =
//   | { loadFromShapeFile: 'Download' | 'Parsing' | 'Cache' }
//   | { UpdateAreas: 'UpdateAreas' }
//   | { ComputeOuterGeometry: 'ComputeOuterGeometry' }
//   | { GetFeatureCollection: 'GetFeatureCollection' };

// export type Processes =
//   | { loadFromShapeFile: 'Download' | 'Parsing' | 'Cache' }
//   | { UpdateAreas: 'UpdateAreas' }
//   | { ComputeOuterGeometry: 'ComputeOuterGeometry' }
//   | { GetFeatureCollection: 'GetFeatureCollection' };

export enum Process {
  Init = 'Init',
  Load = 'Load',
  UpdateAreas = 'UpdateAreas',
  ComputeOuterGeometry = 'ComputeOuterGeometry',
}

export enum Stage {
  Init = 'Init',
  Download = 'Download',
  Parsing = 'Parsing',
  Cache = 'Cache',
  UpdateAreas = 'UpdateAreas',
  ComputeOuterGeometry = 'ComputeOuterGeometry',
  GetFeatureCollection = 'GetFeatureCollection',
}

type StageProp = {
  translationCode: string;
  isReportingOnProgress: boolean;
};

type WorkerType = 'Progress' | 'Done' | 'Error';

export interface WorkerMessage {
  process: Process;
  stage: Stage;
  type: WorkerType;
  message: string;
}

export type ProcessStagesMap = {
  [Process.Init]: Stage.Init;
  [Process.Load]: Stage.Download | Stage.Parsing | Stage.Cache;
  [Process.UpdateAreas]: Stage.UpdateAreas;
  [Process.ComputeOuterGeometry]: Stage.ComputeOuterGeometry;
};

export type StagesFor<P extends Process> = Partial<Record<ProcessStagesMap[P], StageProp>>;

export type Descriptor = {
  [P in Process]: {
    stages: StagesFor<P>;
  };
};
