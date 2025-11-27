import { FeatureCollection } from 'geojson';
import path from 'path';
import { merge } from 'lodash';
import shp from 'shpjs';
import { FileData } from '@map-colonies/react-components';
import CONFIG from '../../../../../common/config';
import { dateFormatter, relativeDateFormatter } from '../../../../../common/helpers/formatters';
import {
  JobModelType,
  LayerMetadataMixedUnion,
  RecordType,
  SourceValidationModelType,
  TaskModelType
} from '../../../../models';
import { LayerRasterRecordInput } from '../../../../models/RootStore.base';
import { filterByKeys } from '../../entity-types-keys';
import { jobType2Mode, RasterJobTypeEnum, transformEntityToFormFields } from '../../utils';
import { FeatureType } from '../pp-map.utils';
import {
  buildError,
  getFeatureAndMarker,
  getPath,
  getPathWithSlash
} from './helpers';
import { queryExecutor } from './query-executor';
import {
  BASE_PATH,
  DATA_LABEL,
  FIRST,
  IContext,
  IPartialContext,
  IProductFile,
  PRODUCT_LABEL,
  SHAPEMETADATA_LABEL,
} from './types';

export const getDirectory = async (filePath: string, context: IContext): Promise<FileData[] | undefined> => {
  try {
    const result = await queryExecutor(async () => {
      return await context.store.queryGetDirectory({
        data: {
          path: getPathWithSlash(filePath),
          type: RecordType.RECORD_RASTER,
        },
      });
    });
    return [ ...(result?.getDirectory as FileData[]) ];
  } catch (e) {
    return undefined;
  }
};

export const getDetails = async (filePath: string, context: IContext): Promise<FileData | undefined> => {
  const files = await getDirectory(path.dirname(filePath), context);
  if (files) {
    return { ...(files.filter((file: FileData) => file.name === path.basename(filePath))[0]) };
  }
  return undefined;
};

export const validateGPKG = async (filePath: string, context: IContext): Promise<SourceValidationModelType> => {
  const result = await queryExecutor(async () => {
    return await context.store.queryValidateGPKGSource({
      data: {
        gpkgFilesPath: [filePath],
        type: RecordType.RECORD_RASTER,
      }
    });
  });
  return result.validateGPKGSource[FIRST];
};

export const selectData = async (context: IContext) => {
  if (!context.files?.data?.path) {
    throw buildError('ingestion.error.missing', 'GPKG');
  }
  const gpkgValidation = await validateGPKG(context.files.data.path, context);
  if (!gpkgValidation.isValid) {
    throw buildError('ingestion.error.invalid-source-file', gpkgValidation.message as string);
  }
  const validationResult = { ...gpkgValidation };
  const geoDetails = getFeatureAndMarker(validationResult.extentPolygon, FeatureType.SOURCE_EXTENT, FeatureType.SOURCE_EXTENT_MARKER);
  return {
    validationResult,
    geoDetails
  };
};

export const fetchProduct = async (product: IProductFile, context: IContext) => {
  if (!product || !product.exists || !product.path) {
    return undefined;
  }

  const apiUrl = CONFIG.SERVICE_URL.replace('graphql', 'zipshape');
  const params = {
    folder: getPathWithSlash(path.dirname(product.path)),
    name: CONFIG.RASTER_INGESTION_FILES_STRUCTURE.product.producerFileName,
    type: RecordType.RECORD_RASTER
  };
  const queryString = new URLSearchParams(params).toString();

  const result = await queryExecutor(async () => {
    return await context.store.fetch(
      `${apiUrl}?${queryString}`,
      'GET',
      {},
      { responseType: 'arraybuffer' }
    );
  });

  const parsedSHP = await shp(result as unknown as ArrayBuffer);
  const outlinedPolygon = (parsedSHP as FeatureCollection)?.features[FIRST];
  const geoDetails = getFeatureAndMarker(outlinedPolygon.geometry, FeatureType.PP_PERIMETER, FeatureType.PP_PERIMETER_MARKER);

  return {
    geoDetails
  };
};

export const getJob = async (context: IContext): Promise<JobModelType> => {
  const result = await queryExecutor(async () => {
    return await context.store.queryJob({
      id: context.job?.jobId as string
    });
  });
  if (!result?.job) {
    throw buildError('ingestion.error.not-found', `JOB ${context.job?.jobId}`);
  }
 
  const jobParametersMetadata = { ...result.job.parameters.metadata };
  
  const resolvedMetadata = await queryExecutor(async () => {
    return await context.store.queryResolveMetadataAsModel(
      {
        data: {
          metadata: JSON.stringify(jobParametersMetadata),
          type: RecordType.RECORD_RASTER,
        }
      }
    );
  });
  if (!resolvedMetadata?.resolveMetadataAsModel) {
    throw buildError('ingestion.error.invalid', `JOB.parameters.metadata can't be transformed to entity`);
  }
  const resolvedJob = merge(
    {},
    result.job,
    {
      parameters: {
        metadata: {
          ...filterByKeys(resolvedMetadata.resolveMetadataAsModel, jobParametersMetadata)
        }
      }
    }
  );
  return resolvedJob;
};

export const getTask = async (context: IContext): Promise<TaskModelType> => {
  const result = await queryExecutor(async () => {
    return await context.store.queryFindTasks({
      params: {
        jobId: context.job?.jobId as string,
        type: 'validation'
      }
    });
  });
  if (!result?.findTasks[FIRST]) {
    throw buildError('ingestion.error.not-found', 'validation task');
  }
  return { ...result.findTasks[FIRST] };
};

export const getRestoreData = async (context: IContext): Promise<IPartialContext> => {
  const rootDirectory = await getDirectory(BASE_PATH, context);
  if (!rootDirectory || rootDirectory.length === 0) {
    throw buildError('ingestion.error.not-found', BASE_PATH);
  }
  const MOUNT_DIR = rootDirectory[FIRST].name;

  const job = await getJob(context);
  try {
    return {
      flowType: jobType2Mode[job.type || RasterJobTypeEnum.NEW] as IPartialContext['flowType'],
      selectionMode: 'restore',
      files: {
        data: {
          label: DATA_LABEL,
          path: getPath(MOUNT_DIR, job.parameters.inputFiles.gpkgFilesPath[0]),
          exists: false,
          dateFormatterPredicate: dateFormatter
        },
        product: {
          label: PRODUCT_LABEL,
          path: getPath(MOUNT_DIR, job.parameters.inputFiles.productShapefilePath),
          exists: false,
          dateFormatterPredicate: relativeDateFormatter
        },
        shapeMetadata: {
          label: SHAPEMETADATA_LABEL,
          path: getPath(MOUNT_DIR, job.parameters.inputFiles.metadataShapefilePath),
          exists: false,
          dateFormatterPredicate: relativeDateFormatter
        }
      },
      resolutionDegree: job.parameters.ingestionResolution,
      formData: transformEntityToFormFields({ ...job.parameters.metadata, resolutionDegree: job.parameters.ingestionResolution } as unknown as LayerMetadataMixedUnion) as unknown as LayerRasterRecordInput,
      job: {
        jobId: job.id,
        details: job
      }
    };
  } catch (error) {
    throw buildError('ingestion.error.restore-failed');
  }
};
