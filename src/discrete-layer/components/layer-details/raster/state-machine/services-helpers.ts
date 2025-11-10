import path from 'path';
import { FileData } from '@map-colonies/react-components';
import { normalizePath } from '../../../../../common/helpers/formatters';
import { Mode } from '../../../../../common/models/mode.enum';
import { LayerMetadataMixedUnion, RecordType } from '../../../../models';
import { LayerRasterRecordInput } from '../../../../models/RootStore.base';
import { transformEntityToFormFields } from '../../utils';
import { FeatureType } from '../pp-map.utils';
import { buildError, getFeatureAndMarker } from './helpers';
import { queryExecutor } from './query-executor';
import {
  BASE_PATH,
  FIRST,
  GPKG_LABEL,
  IContext,
  IPartialContext,
  METADATA_LABEL,
  PRODUCT_LABEL
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

export const selectGpkg = async (context: IContext) => {
  if (!context.files?.gpkg?.path) {
    throw (buildError('ingestion.error.missing', 'GPKG'));
  }
  const gpkgPath = context.files.gpkg.path;
  const result = await queryExecutor(async () => {
    return await context.store.queryValidateGPKGSource({
      data: {
        gpkgFilesPath: [gpkgPath],
        type: RecordType.RECORD_RASTER,
      }
    });
  });

  const validationGPKG = result.validateGPKGSource[FIRST];
  if (!validationGPKG.isValid) {
    throw (buildError('ingestion.error.invalid-source-file', validationGPKG.message as string));
  }

  const validationResult = { ...validationGPKG };
  const { feature, marker } = getFeatureAndMarker(validationResult.extentPolygon, FeatureType.SOURCE_EXTENT, FeatureType.SOURCE_EXTENT_MARKER);

  return {
    validationResult,
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
  const MOUNT_DIR = normalizePath(rootDirectory[FIRST].name);

  const result = await queryExecutor(async () => {
    return await context.store.queryJob({
      id: context.job?.jobId as string
    });
  });
  if (!result?.job) {
    throw buildError('ingestion.error.not-found', `JOB ${context.job?.jobId}`);
  }
  const job = { ...result.job };

  enum RasterJobTypeEnum {
    NEW = 'Ingestion_New',
    UPDATE = 'Ingestion_Update'
  }
  const jobType2FlowType: { [key: string]: Mode } = {
    [RasterJobTypeEnum.NEW]: Mode.NEW,
    [RasterJobTypeEnum.UPDATE]: Mode.UPDATE
  };
  const flowType = jobType2FlowType[job.type || RasterJobTypeEnum.NEW];

  try {
    return {
      flowType: flowType as IPartialContext['flowType'],
      selectionMode: 'restore',
      files: {
        gpkg: {
          label: GPKG_LABEL,
          path: path.resolve(MOUNT_DIR, job.parameters.inputFiles.gpkgFilesPath[0]),
          exists: false
        },
        product: {
          label: PRODUCT_LABEL,
          path: path.resolve(MOUNT_DIR, job.parameters.inputFiles.productShapefilePath),
          exists: false
        },
        metadata: {
          label: METADATA_LABEL,
          path: path.resolve(MOUNT_DIR, job.parameters.inputFiles.metadataShapefilePath),
          exists: false
        }
      },
      resolutionDegree: job.parameters.ingestionResolution,
      formData: transformEntityToFormFields(job.parameters.metadata as unknown as LayerMetadataMixedUnion) as unknown as LayerRasterRecordInput,
      job: {
        jobId: job.id
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw buildError('ingestion.error.restore-failed', message);
  }
};
