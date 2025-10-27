import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { /*ActionArgs, */EventObject, PromiseActorRef } from 'xstate';
import { AnyActorSystem } from 'xstate/dist/declarations/src/system';
import { FileData } from '@map-colonies/react-components';
import { Mode } from '../../../../../common/models/mode.enum';
import {
  IBaseRootStore,
  IRootStore,
  SourceValidationModelType,
  Status
} from '../../../../models';
import { LayerRasterRecordInput } from '../../../../models/RootStore.base';

export type ErrorSource = "api" | "logic";
export type ErrorLevel = "error" | "warning";
export type AddPolicy = "merge" | "override";
export type SelectionMode = "auto" | "manual" | "restore";

export interface IStateError {
  source: ErrorSource;
  level: ErrorLevel;
  code: string;
  message: string;
  field?: string;
  addPolicy?: AddPolicy;
  response?: Record<string, unknown>;
}

export interface IFileBase {
  label: string;
  path: string;
  exists: boolean;
  details?: FileData;
}

export interface IGeoDetails {
  geoDetails?: {
    feature: Feature<Geometry, GeoJsonProperties>;
    marker: Feature<Geometry, GeoJsonProperties>;
  };
}

export interface IGPKGFile extends IFileBase, IGeoDetails {
  validationResult?: SourceValidationModelType;
}

export interface IProductFile extends IFileBase, IGeoDetails {
  data?: File;
}

export interface IFiles {
  gpkg?: IGPKGFile;
  product?: IProductFile;
  metadata?: IFileBase;
}

export interface IJob {
  jobId?: string;
  taskId?: string;
  percentage?: number;
  report?: Record<string, unknown>;
  taskStatus?: Status;
}

export interface IContext {
  store: IRootStore | IBaseRootStore;
  errors: IStateError[];
  flowType?: Mode.NEW | Mode.UPDATE;
  selectionMode?: SelectionMode;
  files?: IFiles;
  resolutionDegree?: number;
  formData?: LayerRasterRecordInput;
  job?: IJob;
}

export type Events =
  | { type: "START", flowType: Mode, selectionMode: SelectionMode }
  | { type: "AUTO" }
  | { type: "MANUAL" }
  | { type: "SELECT_FILES", file: IGPKGFile }
  | { type: "SELECT_GPKG", file: IGPKGFile }
  | { type: "SELECT_PRODUCT", file: IProductFile }
  | { type: "SELECT_METADATA", file: IFileBase }
  | { type: "RESELECT_FILES" }
  | { type: "SET_FILES", files: IFiles, addPolicy: AddPolicy }
  | { type: "FILES_SELECTED" }
  | { type: "FILES_ERROR", error: IStateError }
  | { type: "CLEAN_ERRORS" }
  | { type: "NOOP" }
  | { type: "SUBMIT", data: LayerRasterRecordInput, resolutionDegree: number }
  | { type: "RESTORE", data: Record<string, unknown> }
  | { type: "RETRY" }
  | { type: "DONE" };

// type FlowActionArgs = ActionArgs<Context, Events, Events>;

export type FromPromiseArgs<TInput> = {
  input: {
    context: TInput;
  };
  system: AnyActorSystem;
  self: PromiseActorRef<any>;
  signal: AbortSignal;
  emit: (emitted: EventObject) => void;
};

export enum STATE_TAGS {
  GENERAL_LOADING = 'GENERAL_LOADING'
}

export const WORKFLOW = {
  ROOT: "workflow",
  IDLE: "idle",
  FILES: {
    ROOT: "files",
    SELECTION_MODE: "selectionMode",
    AUTO: {
      ROOT: "auto",
      IDLE: "idle",
      SELECT_FILES: "selectFiles",
      FETCH_PRODUCT: "fetchProduct",
      CHECK_METADATA: "checkMetadata"
    },
    MANUAL: {
      ROOT: "manual",
      IDLE: "idle",
      SELECT_GPKG: "selectGpkg",
      FETCH_PRODUCT: "fetchProduct"
    }
  },
  JOB_SUBMISSION: "jobSubmission",
  JOB_POLLING: "jobPolling",
  JOB_POLLING_WAIT: "jobPollingWait",
  RESTORE_JOB: "restoreJob",
  DONE: "done",
  ERROR: "error"
} as const;

export const FIRST = 0;
export const GPKG_PATH = '\\layerSources';
export const SHAPES_DIR = '../../Shapes';
export const PRODUCT_SHP = 'Product.shp';
export const METADATA_SHP = 'ShapeMetadata.shp';
export const PRODUCT_LABEL = 'file-name.product';
export const METADATA_LABEL = 'file-name.metadata';
