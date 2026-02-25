import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import moment from 'moment';
import path from 'path';
import { assign, SnapshotFrom } from 'xstate';
import { get } from 'lodash';
import { FileData } from '@map-colonies/react-components';
import CONFIG from '../../../../../common/config';
import { getFirstPoint } from '../../../../../common/utils/geo.tools';
import { ErrorLevel } from '../../../helpers/errorUtils';
import { Status } from '../../../../models';
import { FeatureType } from '../pp-map.utils';
import { workflowMachine } from './state-machine';
import {
  AddPolicy,
  BASE_PATH,
  ErrorSource,
  FIRST,
  IContext,
  IFiles,
  IJob,
  IStateError,
  SHAPES_DIR,
  SHAPES_RELATIVE_TO_DATA_DIR,
  STATE_TAGS,
  WORKFLOW,
} from './types';

export const normalizeError = (err: any) => {
  let res = err;
  if (err != null && typeof err === 'object' && Object.keys(err).length === 0) {
    res = buildError('ingestion.error.uncatched-js', get(err, 'message'));
  }
  return { ...res };
};

export const addError = assign((_: { context: IContext; event: any }) => {
  return {
    errors:
      _.event.error.addPolicy === 'merge'
        ? [..._.context.errors, normalizeError(_.event.error)]
        : [normalizeError(_.event.error)],
  };
});

export const warnUnexpectedStateEvent = (_: any) => {
  console.warn(
    `[StateMachine] Unexpected event '${_.event.type}' in state '${_.self._snapshot.value}'`
  );
};

export const getFeatureAndMarker = (
  geometry: Geometry,
  featureFeatureType: FeatureType,
  markerFeatureType: FeatureType
): {
  feature: Feature<Geometry, GeoJsonProperties>;
  marker: Feature<Geometry, GeoJsonProperties>;
} => {
  const feature: Feature<Geometry, GeoJsonProperties> = {
    type: 'Feature',
    properties: {
      featureType: featureFeatureType,
    },
    geometry,
  };
  const marker: Feature<Geometry, GeoJsonProperties> = {
    type: 'Feature',
    properties: {
      featureType: markerFeatureType,
    },
    geometry: {
      coordinates: getFirstPoint(geometry),
      type: 'Point',
    },
  };
  return {
    feature,
    marker,
  };
};

export const getPath = (baseDir: string, filePath: string): string => {
  const resolvedPath = path.resolve(
    baseDir,
    filePath.startsWith(BASE_PATH) ? filePath.substring(1) : filePath
  );
  return resolvedPath.startsWith(BASE_PATH)
    ? resolvedPath.substring(1)
    : resolvedPath;
};

export const getPathWithSlash = (path: string): string => {
  return path.startsWith(BASE_PATH) ? path : BASE_PATH + path;
};

export const getFile = (
  files: FileData[],
  gpkgPath: string,
  fileName: string,
  label: string,
  dateFormatterPredicate: (modDate: Date | string) => string
) => {
  const baseDirectory = path.dirname(gpkgPath);
  const resolvedPath = getPath(
    baseDirectory,
    path.join(SHAPES_RELATIVE_TO_DATA_DIR, SHAPES_DIR, fileName)
  );
  const matchingFiles = files?.filter(
    (file: FileData) => file.name === fileName
  );
  if (!matchingFiles || matchingFiles.length === 0) {
    return {
      label,
      path: resolvedPath,
      isExists: false,
      dateFormatterPredicate,
    };
  }
  return matchingFiles.map((file: FileData) => ({
    label,
    path: resolvedPath,
    details: { ...file },
    isExists: true,
    dateFormatterPredicate,
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
    response,
  };
};

export const hasTagDeep = (
  state: SnapshotFrom<typeof workflowMachine>,
  tag = STATE_TAGS.GENERAL_LOADING
): boolean => {
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

const isFileExistsAndValid = (file: IFiles[keyof IFiles]) => {
  return !!(file?.path && file.isExists && !file.hasError);
};

export const isFilesSelected = (context: IContext): boolean => {
  const files = context.files || {};
  return (
    isFileExistsAndValid(files.data) &&
    isFileExistsAndValid(files.product) &&
    isFileExistsAndValid(files.shapeMetadata)
  );
};

export const validateShapeFiles = (files: IFiles): IStateError[] => {
  const productDetails = files.product?.details;
  const shapeMetadataDetails = files.shapeMetadata?.details;
  if (productDetails && shapeMetadataDetails) {
    const modDateProduct = moment(productDetails.modDate);
    const modDateShapeMetadata = moment(shapeMetadataDetails.modDate);
    const differenceInMinutes = modDateProduct.diff(
      modDateShapeMetadata,
      'minutes'
    );
    if (
      Math.abs(differenceInMinutes) >
      CONFIG.RASTER_INGESTION.CHANGES_IN_SHAPE_FILES
        .TIME_DIFFERENCE_GRACE_MINUTES
    ) {
      return [
        buildError(
          'ingestion.warning.modDateMismatch',
          CONFIG.RASTER_INGESTION.CHANGES_IN_SHAPE_FILES.TIME_DIFFERENCE_GRACE_MINUTES.toString(),
          'logic',
          'warning'
        ),
      ];
    }
  }
  return [];
};

export const handleShapeFilesValidation = (files: IFiles): IStateError[] => {
  let errors: IStateError[] = [];
  if (files.product && files.shapeMetadata) {
    files.product.isModDateDiffExceeded = false;
    files.shapeMetadata.isModDateDiffExceeded = false;
  }
  const shapeFilesValidation = validateShapeFiles(files);
  if (shapeFilesValidation.length > 0) {
    if (files.product) {
      files.product.isModDateDiffExceeded = true;
    }
    if (files.shapeMetadata) {
      files.shapeMetadata.isModDateDiffExceeded = true;
    }
    errors = [...shapeFilesValidation];
  }
  return errors;
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

export const isGoToJobEnabled = (context: IContext): boolean => {
  return !!(context.job && context.job.jobId && context.job?.details);
};

export const isRetryEnabled = (context: IContext): boolean => {
  return (
    !!(context.job && context.job.jobId) &&
    context.selectionMode === 'restore' &&
    !!get(context, 'job.details.availableActions.isResumable')
  );
};

export const isUIDisabled = (isLoading: boolean, state: any): boolean => {
  return isLoading || isDone(state);
};

export const hasError = (errors: IStateError[]): boolean => {
  return (
    errors.length > 0 &&
    (errors.some((error) => error.level === 'error') ||
      errors.some((error) => !error.level))
  );
};

export const isStatusFailed = (status: Status | undefined): boolean => {
  return (
    status !== null &&
    typeof status !== 'undefined' &&
    [Status.Failed, Status.Aborted].includes(status as Status)
  );
};

export const isJobValid = (status: Status | undefined): boolean => {
  return (
    status !== null &&
    typeof status !== 'undefined' &&
    ![Status.Suspended, Status.Expired].includes(status as Status)
  );
};

export const isTaskValid = (job: IJob | undefined): boolean => {
  const taskPercentage = job?.taskPercentage;
  const validationReport = job?.validationReport;
  const errorsSummary = validationReport?.errorsSummary;
  return (
    taskPercentage === 0 ||
    (validationReport?.isValid === true &&
      Object.values(errorsSummary?.errorsCount || {}).every(
        (value) => typeof value !== 'number' || value === 0
      ) &&
      errorsSummary?.thresholds?.smallHoles?.exceeded === false &&
      errorsSummary?.thresholds?.smallGeometries?.exceeded === false)
  );
};

export const isModified = (modDate: Date | string) => {
  return modDate
    ? moment().diff(moment(modDate), 'hours') <=
        CONFIG.RASTER_INGESTION.CHANGES_IN_SHAPE_FILES
          .TIME_MODIFIED_THRESHOLD_HOURS
    : false;
};
