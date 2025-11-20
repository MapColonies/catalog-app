import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { /*ActionArgs, */EventObject, PromiseActorRef } from 'xstate';
import { AnyActorSystem } from 'xstate/dist/declarations/src/system';
import { FileData } from '@map-colonies/react-components';
import CONFIG from '../../../../../common/config';
import { Mode } from '../../../../../common/models/mode.enum';
import {
  IBaseRootStore,
  IRootStore,
  JobModelType,
  LayerRasterRecordModelType,
  SourceValidationModelType,
  Status
} from '../../../../models';
import { LayerRasterRecordInput } from '../../../../models/RootStore.base';
import { IError } from '../../../helpers/errorUtils';

export type ErrorSource = "api" | "logic";
export type AddPolicy = "merge" | "override";
export type SelectionMode = "auto" | "manual" | "restore";

export interface IStateError extends IError {
  source: ErrorSource;
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

export interface IProductFile extends IFileBase, IGeoDetails {}

export interface IFiles {
  data?: IGPKGFile;
  product?: IProductFile;
  shapeMetadata?: IFileBase;
}

export interface IJob {
  jobId?: string;
  taskId?: string;
  taskPercentage?: number;
  validationReport?: Record<string, unknown>;
  taskStatus?: Status;
  record?: JobModelType;
}

export interface IContext {
  store: IRootStore | IBaseRootStore;
  errors: IStateError[];
  flowType?: Mode.NEW | Mode.UPDATE;
  updatedLayer?: LayerRasterRecordModelType;
  selectionMode?: SelectionMode;
  files?: IFiles;
  resolutionDegree?: number;
  formData?: LayerRasterRecordInput;
  job?: IJob;
}

export interface IPartialContext extends Omit<IContext, 'store' | 'errors'> {};

export type Events =
  | { type: "START_NEW", flowType: Mode.NEW, selectionMode: SelectionMode }
  | { type: "START_UPDATE", updatedLayer: LayerRasterRecordModelType }
  | { type: "AUTO" }
  | { type: "MANUAL" }
  | { type: "SELECT_FILES", file: IGPKGFile }
  | { type: "SELECT_DATA", file: IGPKGFile }
  | { type: "SELECT_PRODUCT", file: IProductFile }
  | { type: "SELECT_METADATA", file: IFileBase }
  | { type: "RESELECT_FILES" }
  | { type: "SET_FILES", files: IFiles, addPolicy: AddPolicy }
  | { type: "FILES_SELECTED" }
  | { type: "FILES_ERROR", error: IStateError }
  | { type: "CLEAN_ERRORS" }
  | { type: "NOOP" }
  | { type: "SUBMIT", data: LayerRasterRecordInput, resolutionDegree: number }
  | { type: "RESTORE", job: IJob }
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
  START_UPDATE: "startUpdate",
  FILES: {
    ROOT: "files",
    SELECTION_MODE: "selectionMode",
    AUTO: {
      ROOT: "auto",
      IDLE: "idle",
      SELECT_FILES: "selectFiles",
      FETCH_PRODUCT: "fetchProduct",
      CHECK_SHAPEMETADATA: "checkShapeMetadata"
    },
    MANUAL: {
      ROOT: "manual",
      IDLE: "idle",
      SELECT_DATA: "selectData",
      FETCH_PRODUCT: "fetchProduct",
      CHECK_SHAPEMETADATA: "checkShapeMetadata"
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
export const BASE_PATH = '/';
export const DATA_DIR = CONFIG.RASTER_INGESTION_FILES_STRUCTURE.data.relativeToAOIDirPath;
export const SHAPES_DIR = CONFIG.RASTER_INGESTION_FILES_STRUCTURE.shapeMetadata.relativeToAOIDirPath;
export const SHAPES_RELATIVE_TO_DATA_DIR = '..';
export const PRODUCT_FILENAME = `${CONFIG.RASTER_INGESTION_FILES_STRUCTURE.product.producerFileName}${CONFIG.RASTER_INGESTION_FILES_STRUCTURE.product.selectableExt[0]}`;
export const SHAPEMETADATA_FILENAME = `${CONFIG.RASTER_INGESTION_FILES_STRUCTURE.shapeMetadata.producerFileName}${CONFIG.RASTER_INGESTION_FILES_STRUCTURE.shapeMetadata.selectableExt[0]}`;
export const DATA_LABEL = 'file-name.data';
export const PRODUCT_LABEL = 'file-name.product';
export const SHAPEMETADATA_LABEL = 'file-name.shapeMetadata';
