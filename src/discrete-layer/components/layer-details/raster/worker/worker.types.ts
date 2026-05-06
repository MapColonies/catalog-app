import { FeatureCollection, Geometry } from 'geojson';
import { FeatureType } from '../feature-type.enum';

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

export type WorkerError = {
  text?: string;
  code?: string;
  codeParam?: string;
};

export interface WorkerAPI {
  init(): Promise<void>;
  dispose(): void;
  load(fc: FeatureCollection, options?: LoadOptions): Promise<WorkerError | void>;
  loadFromShapeFile(
    url: string,
    options?: LoadOptions,
    onProgress?: (p: WorkerMessage | null) => void
  ): Promise<WorkerError | void>;
  updateAreas(onProgress?: (p: WorkerMessage | null) => void): WorkerError | void;
  computeOuterGeometry(
    onProgress?: (p: WorkerMessage | null) => void,
    predicate?: (property: Record<string, unknown>) => boolean
  ): Promise<Geometry>;
  getFeatureCollection(onProgress?: (p: WorkerMessage | null) => void): FeatureCollection;
  getMarkersFromGeometry(geometry: Geometry): FeatureCollection;
  query(bbox: BBoxObj, onProgress?: (p: WorkerMessage | null) => void): FeatureCollection;
}

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

export enum WorkerType {
  Progress = 'Progress',
  Done = 'Done',
  Error = 'Error',
}

type StageProp = {
  translationCode: string;
  shouldShowProgress: boolean;
};

export interface WorkerMessage {
  process: Process;
  stage: Stage;
  type: WorkerType;
  details: MessageDetails;
}

export interface MessageDetails {
  progress?: string;
  elapsedTime?: number;
  error?: WorkerError;
}

export type ProcessStagesMap = {
  [Process.Init]: Stage.Init;
  [Process.Load]: Stage.Download | Stage.Parsing | Stage.Cache;
  [Process.UpdateAreas]: Stage.UpdateAreas;
  [Process.ComputeOuterGeometry]: Stage.ComputeOuterGeometry;
};

export type StagesFor<P extends Process> = Partial<Record<ProcessStagesMap[P], StageProp>>;

export type ProcessInfo = {
  [P in Process]: {
    runCount: number;
    stages: StagesFor<P>;
  };
};
