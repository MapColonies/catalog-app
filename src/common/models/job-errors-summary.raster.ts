// #region to be removed
// TODO: should be taken from @map-colonies/types
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
};

export type RasterErrorsSummary = {
  errorsCount: {
    geometryValidity: number;
    vertices: number;
    metadata: number;
    resolution: number;
    smallGeometries: number;
    smallHoles: number;
    unknown: number;
  };
  thresholds: {
    smallHoles: {
      exceeded: boolean;
      count: number;
    };
    smallGeometries: {
      exceeded: boolean;
    };
  };
};
// #endregion to be removed

export type RasterErrorCount = {
  count?: number;
  exceeded?: boolean;
};
