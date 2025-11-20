import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import path from 'path';
import { assign, SnapshotFrom } from 'xstate';
import { FileData } from '@map-colonies/react-components';
import { getFirstPoint } from '../../../../../common/utils/geo.tools';
import { Status } from '../../../../models';
import { FeatureType } from '../pp-map.utils';
import { workflowMachine } from './state-machine';
import {
  AddPolicy,
  BASE_PATH,
  ErrorLevel,
  ErrorSource,
  FIRST,
  IContext,
  IStateError,
  SHAPES_DIR,
  SHAPES_RELATIVE_TO_DATA_DIR,
  STATE_TAGS,
  WORKFLOW
} from './types';

export const addError = assign((_: { context: IContext; event: any }) => { 
  return {
    errors: _.event.error.addPolicy === "merge" ?
      [ ..._.context.errors, _.event.error] :
      [_.event.error]
  };
});

export const warnUnexpectedStateEvent = (_: any) => {
  console.warn(`[StateMachine] Unexpected event '${_.event.type}' in state '${_.self._snapshot.value}'`);
};

export const getFeatureAndMarker = (
  geometry: Geometry,
  featureFeatureType: FeatureType,
  markerFeatureType: FeatureType
): { feature: Feature<Geometry, GeoJsonProperties>, marker: Feature<Geometry, GeoJsonProperties> } => {
  const feature: Feature<Geometry, GeoJsonProperties> = {
    type: "Feature",
    properties: {
      featureType: featureFeatureType
    },
    geometry
  };
  const marker: Feature<Geometry, GeoJsonProperties> = {
    type: "Feature",
    properties: {
      featureType: markerFeatureType
    },
    geometry: {
      coordinates: getFirstPoint(geometry),
      type: "Point"
    },
  };
  return {
    feature,
    marker
  };
};

export const getPath = (baseDir: string, filePath: string): string => {
  const resolvedPath = path.resolve(baseDir, filePath);
  return resolvedPath.startsWith(BASE_PATH) ? resolvedPath.substring(1) : resolvedPath;
};

export const getPathWithSlash = (path: string): string => {
  return path.startsWith(BASE_PATH) ? path : BASE_PATH + path;
};

export const getFile = (files: FileData[], gpkgPath: string, fileName: string, label: string) => {
  const baseDirectory = path.dirname(gpkgPath);
  const resolvedPath = getPath(baseDirectory, path.join(SHAPES_RELATIVE_TO_DATA_DIR, SHAPES_DIR, fileName));
  const matchingFiles = files?.filter((file: FileData) => file.name === fileName);
  if (!matchingFiles || matchingFiles.length === 0) {
    return {
      label,
      path: resolvedPath,
      exists: false
    };
  }
  return matchingFiles.map((file: FileData) => ({
    label,
    path: resolvedPath,
    details: { ...file },
    exists: true
  }))[FIRST];
};

export const buildError = (
  code: string,
  message: string = '',
  source: ErrorSource = 'logic',
  level: ErrorLevel = 'error',
  addPolicy: AddPolicy = 'merge',
  response?: Record<string, unknown>
): IStateError => {
  return {
    source,
    level,
    code,
    message,
    addPolicy,
    response
  };
};

export const hasTagDeep = (state: SnapshotFrom<typeof workflowMachine>, tag = STATE_TAGS.GENERAL_LOADING): boolean => {
  if (state && typeof state.hasTag === 'function' && state.hasTag(tag)) {
    return true;
  }
  if (state && state.children) {
    for (const child of Object.values(state.children)) {
      const childSnap = child?.getSnapshot?.();
      if (childSnap && hasTagDeep(childSnap, tag)) {
        return true;
      }
    }
  }
  return false;
};

export const isFilesSelected = (context: IContext): boolean => {
  const files = context.files || {};
  return !!(files.data && files.data.path && files.data.exists === true &&
    files.product && files.product.path && files.product.exists === true &&
    files.shapeMetadata && files.shapeMetadata.path && files.shapeMetadata.exists === true);
};

export const isJobSubmitted = (context: IContext): boolean => {
  return !!(context.job && context.job.jobId);
};

export const isDone = (state: SnapshotFrom<typeof workflowMachine>) => {
  return state.value === WORKFLOW.DONE;
};

export const hasActiveJob = (context: IContext): boolean => {
  return !!(context.job && context.job.jobId);
};

export const isRetryEnabled = (context: IContext): boolean => {
  return !!(context.job &&
    (context.job.taskStatus === Status.Failed ||
    (context.job.taskStatus === Status.Completed && context.job.validationReport?.isValid === false)));
};

export const isUIDisabled = (isLoading: boolean, state: any): boolean => {
  return isLoading || isDone(state);
};

export const validationReport = (context: IContext): Record<string, number> => {
  return context.job?.validationReport?.errorsAggregation?.count ?? ({} as Record<string, number>);
};

export const smallHoles = (context: IContext): boolean => {
  return !!context.job?.validationReport?.errorsAggregation?.smallHoles;
};

export const smallHolesCount = (context: IContext): number => {
  return context.job?.validationReport?.errorsAggregation?.smallHoles?.count ?? 0;
};

export const smallHolesExceeded = (context: IContext): boolean => {
  return context.job?.validationReport?.errorsAggregation?.smallHoles?.exceeded ?? false;
};

export const smallGeometries = (context: IContext): boolean => {
  return !!context.job?.validationReport?.errorsAggregation?.smallGeometries;
};

export const smallGeometriesCount = (context: IContext): number => {
  return context.job?.validationReport?.errorsAggregation?.smallGeometries?.count ?? 0;
};

export const smallGeometriesExceeded = (context: IContext): boolean => {
  return context.job?.validationReport?.errorsAggregation?.smallGeometries?.exceeded ?? false;
};
