import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import path from 'path';
import { fromPromise } from 'xstate';
import { Mode } from '../../../../../common/models/mode.enum';
import { RecordType } from '../../../../models';
import { LayerRasterRecordInput } from '../../../../models/RootStore.base';
import { FeatureType } from '../pp-map.utils';
import { buildError, getFeatureAndMarker, getFile, getPath } from './helpers';
import { MOCK_JOB_UPDATE } from './MOCK';
import { queryExecutor } from './query-executor';
import {
  getDetails,
  getDirectory,
  fetchProduct,
  getRestoreData,
  selectData,
  validateGPKG
} from './services-helpers';
import {
  FIRST,
  FromPromiseArgs,
  IContext,
  SHAPEMETADATA_LABEL,
  SHAPEMETADATA_FILENAME,
  PRODUCT_LABEL,
  PRODUCT_FILENAME,
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

      const job = MOCK_JOB_UPDATE; // TODO: Mock should be removed

      return {
        jobId: job.id
      };
    }),
    jobSubmissionService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { store, files, resolutionDegree, formData } = input.context || {};

      const data = {
        ingestionResolution: resolutionDegree as number,
        inputFiles: {
          gpkgFilesPath: [files?.data?.path] as string[],
          productShapefilePath: files?.product?.path as string,
          metadataShapefilePath: files?.shapeMetadata?.path as string
        },
        metadata: (formData ?? {}) as LayerRasterRecordInput,
        type: RecordType.RECORD_RASTER,
      };

      let jobId: string = '';
      if (input.context.flowType === Mode.NEW) {
        const result = await queryExecutor(async () => {
          return await store.mutateStartRasterIngestion({ data });
        });
        jobId = result.startRasterIngestion.jobId ?? '';
      } else if (input.context.flowType === Mode.UPDATE) {
        const result = await queryExecutor(async () => {
          return await store.mutateStartRasterUpdateGeopkg({ data });
        });
        jobId = result.startRasterUpdateGeopkg.jobId ?? '';
      }

      return {
        jobId,
      };
    }),
    jobPollingService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { jobId } = input.context.job || {};
      if (!jobId) {
        throw buildError('ingestion.error.missing', 'jobId');
      }

      const result = await queryExecutor(async () => {
        return await input.context.store.queryFindTasks({
          params: {
            jobId: jobId as string,
            type: 'validation'
          }
        });
      });
      const task = result.findTasks[FIRST];

      if (!task) {
        throw buildError('ingestion.error.not-found', 'validation task');
      }

      return {
        taskPercentage: task.percentage ?? 0,
        validationReport: task.parameters?.isValid === false ? task.parameters.errors : undefined,
        taskStatus: task.status ?? ''
      };
    }),
    restoreJobService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { flowType, selectionMode, files, resolutionDegree, formData, job } = await getRestoreData(input.context || {});
      const { data, product, shapeMetadata } = files || {};

      if (files?.data) {
        files.data.details = await getDetails(files.data.path, input.context);
        files.data.exists = !!files.data.details;
      }
      if (files?.product) {
        files.product.details = await getDetails(files.product.path, input.context);
        files.product.exists = !!files.product.details;
      }
      if (files?.shapeMetadata) {
        files.shapeMetadata.details = await getDetails(files.shapeMetadata.path, input.context);
        files.shapeMetadata.exists = !!files.shapeMetadata.details;
      }

      if (!files?.data?.path) {
        throw (buildError('ingestion.error.missing', 'GPKG'));
      }

      const gpkgValidation = await validateGPKG(files.data.path, input.context);
      const validationResult = { ...gpkgValidation };
      let geoDetails: { feature: Feature<Geometry, GeoJsonProperties>; marker: Feature<Geometry, GeoJsonProperties>; } | undefined;
      if (validationResult.extentPolygon) {
        geoDetails = getFeatureAndMarker(validationResult.extentPolygon, FeatureType.SOURCE_EXTENT, FeatureType.SOURCE_EXTENT_MARKER);
      }

      if (files.product) {
        const productFile = await fetchProduct(files.product, input.context);
        files.product.file = productFile?.file;
        files.product.geoDetails = productFile?.geoDetails;
      }

      return {
        flowType,
        selectionMode,
        files: {
          ...files,
          data: {
            ...data,
            validationResult,
            geoDetails
          },
          product: {
            ...product
          },
          shapeMetadata: {
            ...shapeMetadata
          }
        },
        resolutionDegree,
        formData,
        job
      };
    })
  },
  [WORKFLOW.FILES.ROOT]: {
    selectFilesService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const data = await selectData(input.context);
      const dataPath = input.context.files?.data?.path as string;
      const result = await getDirectory(getPath(path.dirname(dataPath), path.join(SHAPES_RELATIVE_TO_DATA_DIR, SHAPES_DIR)), input.context);
      const product = getFile(result ?? [], dataPath, PRODUCT_FILENAME, PRODUCT_LABEL);
      const shapeMetadata = getFile(result ?? [], dataPath, SHAPEMETADATA_FILENAME, SHAPEMETADATA_LABEL);
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
