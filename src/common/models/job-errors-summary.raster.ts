import { Status } from '../../discrete-layer/models';

export type CallBack<T> = {
  jobId: string;
  taskId: string;
  jobType: string;
  taskType: string;
  productId: string;
  productType: string;
  version: string;
  status: Status;
  progress: number;
  message?: string;
  error?: string;
  params: T;
};

export type RasterTaskParams = {
  isValid: boolean;
  errorsSummary: RasterErrorsSummary;
  report?: {
    url?: string;
  };
};

type ErrorsCount = {
  geometryValidity: number;
  vertices: number;
  metadata: number;
  resolution: number;
  smallGeometries: number;
  smallHoles: number;
  unknown: number;
};

type Threshold = {
  exceeded: boolean;
};

export type RasterErrorsSummary = {
  errorsCount: ErrorsCount;

  thresholds: Partial<{
    [K in keyof ErrorsCount]: Threshold;
  }>;
};

export type RasterErrorCount = {
  count?: number;
  exceeded?: boolean;
};

export type RasterErrorsCountKey = keyof RasterErrorsSummary['errorsCount'];

export const APPROVAL_REQUIRED_ERRORS: readonly RasterErrorsCountKey[] = ['resolution'];
