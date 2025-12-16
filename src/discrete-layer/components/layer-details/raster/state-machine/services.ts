import path from 'path';
import { fromPromise } from 'xstate';
import CONFIG from '../../../../../common/config';
import { relativeDateFormatter } from '../../../../../common/helpers/formatters';
import { Mode } from '../../../../../common/models/mode.enum';
import { RecordType } from '../../../../models';
import { LayerRasterRecordInput } from '../../../../models/RootStore.base';
import { FeatureType } from '../pp-map.utils';
import {
  buildError,
  getFeatureAndMarker,
  getFile,
  getPath,
  handleShapeFilesValidation,
  hasError,
  isModified
} from './helpers';
import { MOCK_JOB_UPDATE } from './MOCK';
import { queryExecutor } from './query-executor';
import {
  fetchProduct,
  getDetails,
  getDirectory,
  getJob,
  getRestoreData,
  getTask,
  selectData,
  validateGPKG
} from './services-helpers';
import {
  FromPromiseArgs,
  IContext,
  PRODUCT_LABEL,
  PRODUCT_FILENAME,
  SHAPEMETADATA_LABEL,
  SHAPEMETADATA_FILENAME,
  SHAPES_DIR,
  SHAPES_RELATIVE_TO_DATA_DIR,
  WORKFLOW
} from './types';

export const SERVICES = {
  [WORKFLOW.ROOT]: {
    fetchActiveJobService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      // const { updatedLayer } = input.context || {};

      // const result = await queryExecutor(async () => {
      //   return await input.context.store.queryGetActiveJob({
      //     productId: updatedLayer?.productId,
      //     productType: updatedLayer?.productType
      //   });
      // });

      const jobId = MOCK_JOB_UPDATE.id; // TODO: Mock should be removed

      return {
        jobId
      };
    }),
    retryJobService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { store, job } = input.context || {};
      const result = await queryExecutor(async () => {
        return await store.mutateJobRetry({
          jobRetryParams: {
            id: job?.jobId as string,
            domain: 'RASTER',
          }
        });
      });

      return result;
    }),
    jobSubmissionService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { store, files, resolutionDegree, formData } = input.context || {};

      const data = {
        ingestionResolution: resolutionDegree as number,
        inputFiles: {
          gpkgFilesPath: [files?.data?.path].filter(Boolean) as string[],
          productShapefilePath: files?.product?.path || '',
          metadataShapefilePath: files?.shapeMetadata?.path || ''
        },
        metadata: (formData ?? {}) as LayerRasterRecordInput,
        callbackUrls: [`${CONFIG.SERVICE_PROTOCOL}${CONFIG.SERVICE_NAME}/callback/task`],
        type: RecordType.RECORD_RASTER,
      };

      let result;
      let jobId: string = '';
      switch (input.context.flowType) {
        case Mode.NEW:
          result = await queryExecutor(async () => {
            return await store.mutateStartRasterIngestion({ data });
          });
          jobId = result.startRasterIngestion?.jobId || '';
          break;
        case Mode.UPDATE:
          result = await queryExecutor(async () => {
            return await store.mutateStartRasterUpdateGeopkg({ data });
          });
          jobId = result.startRasterUpdateGeopkg?.jobId || '';
          break;
        default:
          throw buildError('ingestion.error.invalid', 'flowType');
      }

      return {
        jobId
      };
    }),
    jobPollingService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { jobId } = input.context.job || {};
      if (!jobId) {
        throw buildError('ingestion.error.missing', 'jobId');
      }

      const job = await getJob(input.context);

      const task = await getTask(input.context);

      return {
        taskId: task.id,
        taskPercentage: task.percentage ?? 0,
        validationReport: task.parameters || {},
        taskStatus: task.status ?? '',
        taskReason: task.reason ?? '',
        details: job
      };
    }),
    restoreJobService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { flowType, selectionMode, files, resolutionDegree, formData, job } = await getRestoreData(input.context);
      let errors = input.context.errors;

      if (files) {
        if (files.data) {
          files.data.details = await getDetails(files.data.path, input.context);
          files.data.exists = !!files.data.details;
          if (files.data.exists === false) {
            errors = [ ...errors, buildError('ingestion.error.missing', 'GPKG') ];
          } else {
            const gpkgValidation = await validateGPKG(files.data.path, input.context);
            files.data.validationResult = { ...gpkgValidation };
            if (!!files.data.validationResult.extentPolygon) {
              files.data.geoDetails = getFeatureAndMarker(files.data.validationResult.extentPolygon, FeatureType.SOURCE_EXTENT, FeatureType.SOURCE_EXTENT_MARKER);
            }
          }
        }
        if (files.product) {
          files.product.details = await getDetails(files.product.path, input.context);
          files.product.exists = !!files.product.details;
          if (files.product.exists === false) {
            errors = [ ...errors, buildError('ingestion.error.missing', PRODUCT_FILENAME) ];
          } else {
            const productFile = await fetchProduct(files.product, input.context);
            files.product.geoDetails = productFile?.geoDetails;
          }
        }
        if (files.shapeMetadata) {
          files.shapeMetadata.details = await getDetails(files.shapeMetadata.path, input.context);
          files.shapeMetadata.exists = !!files.shapeMetadata.details;
          if (files.shapeMetadata.exists === false) {
            errors = [ ...errors, buildError('ingestion.error.missing', SHAPEMETADATA_FILENAME) ];
          }
        }
        if (!hasError(errors) &&
          files.product?.details?.modDate &&
          files.shapeMetadata?.details?.modDate &&
          (isModified(files.product.details.modDate) || isModified(files.shapeMetadata.details.modDate))) {
          errors = handleShapeFilesValidation(files);
        }
      }

      return {
        flowType,
        selectionMode,
        files,
        resolutionDegree,
        formData,
        job,
        errors
      };
    })
  },
  [WORKFLOW.FILES.ROOT]: {
    selectFilesService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const data = await selectData(input.context);
      const dataPath = input.context.files?.data?.path as string;
      const result = await getDirectory(getPath(path.dirname(dataPath), path.join(SHAPES_RELATIVE_TO_DATA_DIR, SHAPES_DIR)), input.context);
      const product = getFile(result ?? [], dataPath, PRODUCT_FILENAME, PRODUCT_LABEL, relativeDateFormatter);
      const shapeMetadata = getFile(result ?? [], dataPath, SHAPEMETADATA_FILENAME, SHAPEMETADATA_LABEL, relativeDateFormatter);
      return {
        data,
        product,
        shapeMetadata
      };
    }),
    selectDataService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      return selectData(input.context);
    }),
    fetchProductService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { product } = input.context.files ?? {};
      if (!product || !product.exists || !product.path) {
        throw buildError('ingestion.error.missing', PRODUCT_FILENAME);
      }
      return fetchProduct(product, input.context);
    }),
    checkShapeMetadataService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { shapeMetadata } = input.context.files || {};
      if (!shapeMetadata || !shapeMetadata.exists || !shapeMetadata.path) {
        throw buildError('ingestion.error.missing', SHAPEMETADATA_FILENAME);
      }
      return Promise.resolve({ success: true });
    })
  }
};
