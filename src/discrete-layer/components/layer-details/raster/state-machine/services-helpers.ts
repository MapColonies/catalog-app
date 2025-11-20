import { Geometry } from 'geojson';
import path from 'path';
// import shp from 'shpjs';
import { FileData } from '@map-colonies/react-components';
import {
  LayerMetadataMixedUnion,
  RecordType,
  SourceValidationModelType
} from '../../../../models';
import { LayerRasterRecordInput } from '../../../../models/RootStore.base';
import { jobType2Mode, RasterJobTypeEnum, transformEntityToFormFields } from '../../utils';
import { FeatureType } from '../pp-map.utils';
import { buildError, getFeatureAndMarker, getPath } from './helpers';
import { MOCK_POLYGON } from './MOCK';
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
          path: filePath,
          type: RecordType.RECORD_RASTER,
        },
      });
    });
    return result?.getDirectory as FileData[];
  } catch (e) {
    return undefined;
  }
};

export const getDetails = async (filePath: string, context: IContext): Promise<FileData | undefined> => {
  const files = await getDirectory(path.dirname(filePath), context);
  if (files) {
    return files.filter((file: FileData) => file.name === path.basename(filePath))[0];
  }
  return undefined;
};

export const validateGPKG = async (filePath: string, context: IContext): Promise<SourceValidationModelType> => {
  let gpkgPath = filePath;
  if (gpkgPath.startsWith(BASE_PATH)) {
    gpkgPath = gpkgPath.substring(1);
  }
  const result = await queryExecutor(async () => {
    return await context.store.queryValidateGPKGSource({
      data: {
        gpkgFilesPath: [gpkgPath],
        type: RecordType.RECORD_RASTER,
      }
    });
  });
  return result.validateGPKGSource[FIRST];
};

export const selectData = async (context: IContext) => {
  if (!context.files?.data?.path) {
    throw (buildError('ingestion.error.missing', 'GPKG'));
  }
  const gpkgValidation = await validateGPKG(context.files.data.path, context);
  if (!gpkgValidation.isValid) {
    throw (buildError('ingestion.error.invalid-source-file', gpkgValidation.message as string));
  }
  const validationResult = { ...gpkgValidation };
  const { feature, marker } = getFeatureAndMarker(validationResult.extentPolygon, FeatureType.SOURCE_EXTENT, FeatureType.SOURCE_EXTENT_MARKER);
  return {
    validationResult,
    geoDetails: {
      feature,
      marker
    }
  };
};

export const fetchProduct = async (product: IProductFile, context: IContext) => {
  if (!product || !product.exists || !product.path) {
    return undefined;
  }
  // const result = await queryExecutor(async () => {
  //   return await context.store.queryGetFile({
  //       data: {
  //         path: product?.path ?? '',
  //         type: RecordType.RECORD_RASTER,
  //       },
  //     });
  // });
  // const outlinedPolygon = await shp(result.getFile[FIRST]);
  const outlinedPolygon: Geometry = MOCK_POLYGON; // TODO: Mock should be removed
  const { feature, marker } = getFeatureAndMarker(outlinedPolygon, FeatureType.PP_PERIMETER, FeatureType.PP_PERIMETER_MARKER);
  return {
    // file: new File(result.getFile[FIRST], path.basename(product.path)),
    file: undefined,
    geoDetails: {
      feature,
      marker
    }
  };
};

export const getRestoreData = async (context: IContext): Promise<IPartialContext> => {
  const rootDirectory = await getDirectory(BASE_PATH, context);
  if (!rootDirectory || rootDirectory.length === 0) {
    throw buildError('ingestion.error.not-found', BASE_PATH);
  }
  const MOUNT_DIR = rootDirectory[FIRST].name;

  const result = await queryExecutor(async () => {
    return await context.store.queryJob({
      id: context.job?.jobId as string
    });
  });
  if (!result?.job) {
    throw buildError('ingestion.error.not-found', `JOB ${context.job?.jobId}`);
  }
  const job = { ...result.job };

    try {
    return {
      flowType: jobType2Mode[job.type || RasterJobTypeEnum.NEW] as IPartialContext['flowType'],
      selectionMode: 'restore',
      files: {
        data: {
          label: DATA_LABEL,
          path: getPath(MOUNT_DIR, job.parameters.inputFiles.gpkgFilesPath[0]),
          exists: false
        },
        product: {
          label: PRODUCT_LABEL,
          path: getPath(MOUNT_DIR, job.parameters.inputFiles.productShapefilePath),
          exists: false
        },
        shapeMetadata: {
          label: SHAPEMETADATA_LABEL,
          path: getPath(MOUNT_DIR, job.parameters.inputFiles.metadataShapefilePath),
          exists: false
        }
      },
      resolutionDegree: job.parameters.ingestionResolution,
      formData: transformEntityToFormFields({ ...job.parameters.metadata, resolutionDegree: job.parameters.ingestionResolution } as unknown as LayerMetadataMixedUnion) as unknown as LayerRasterRecordInput,
      job: {
        jobId: job.id,
        record: job
      }
    };
  } catch (error) {
    throw buildError('ingestion.error.restore-failed');
  }
};
