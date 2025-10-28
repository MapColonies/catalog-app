import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import path from 'path';
// import shp from 'shpjs';
import { fromPromise } from 'xstate';
import { FileData } from '@map-colonies/react-components';
import { Mode } from '../../../../../common/models/mode.enum';
import {
  LayerMetadataMixedUnion,
  RecordType,
  // EntityDescriptorModelType
} from '../../../../models';
// import { LayerRasterRecordInput } from '../../../../models/RootStore.base';
// import { cleanUpEntityPayload, getFlatEntityDescriptors } from '../../utils';
import { FeatureType } from '../pp-map.utils';
import { buildError, getFeatureAndMarker, getFile } from './helpers';
import { MOCK_POLYGON } from './MOCK';
import { queryExecutor } from './query-executor';
import {
  FIRST,
  FromPromiseArgs,
  GPKG_LABEL,
  GPKG_PATH,
  IContext,
  METADATA_LABEL,
  METADATA_SHP,
  PRODUCT_LABEL,
  PRODUCT_SHP,
  SHAPES_DIR,
  WORKFLOW
} from './types';
import { transformEntityToFormFields } from '../../utils';
import { MOCK_JOB } from './MOCK';

const getDetails = async (filePath: string, context: IContext): Promise<FileData | undefined> => {
  try {
    const result = await queryExecutor(async () => {
      return await context.store.queryGetDirectory({
        data: {
          path: path.dirname(filePath),
          type: RecordType.RECORD_RASTER,
        },
      });
    });
    return (result?.getDirectory as FileData[]).filter((file: FileData) => file.name === path.basename(filePath))[0];
  } catch (e) {
    return undefined;
  }
};

const selectGpkg = async (context: IContext) => {
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

export const SERVICES = {
  [WORKFLOW.ROOT]: {
    fetchActiveJobService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {

      // const job = await queryExecutor(async () => {
      //   return await input.context.store.queryGetActiveJob({
      //     productId: input.context.updatedLayer?.productId,
      //     productVersion: input.context.updatedLayer?.productVersion,
      //     productType: input.context.updatedLayer?.productType
      //   });
      // });

      const job = MOCK_JOB; // TODO: Mock should be removed

      const restoreData = {
        data: {
          flowType: Mode.UPDATE,
          selectionMode: 'restore',
          files: {
            gpkg: {
              label: GPKG_LABEL,
              path: path.resolve(GPKG_PATH, job.parameters.inputFiles.gpkgFilesPath[0]),
              exists: false
            },
            product: {
              label: PRODUCT_LABEL,
              path: path.resolve(GPKG_PATH, job.parameters.inputFiles.productShapefilePath),
              exists: false
            },
            metadata: {
              label: METADATA_LABEL,
              path: path.resolve(GPKG_PATH, job.parameters.inputFiles.metadataShapefilePath),
              exists: false
            }
          },
          resolutionDegree: job.parameters.ingestionResolution,
          formData: {
            ...transformEntityToFormFields(job.parameters.metadata as unknown as LayerMetadataMixedUnion)
          },
          job: {
            jobId: job.id
          }
        }
      }

      // const locked = job ? true : false;
      const locked = false;
      const result = { 
        locked,
        ...restoreData
      };
      return result;
    }),
    jobSubmissionService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      /*const { store, files, resolutionDegree, formData } = input.context || {};

      const data = {
        ingestionResolution: resolutionDegree as number,
        inputFiles: {
          gpkgFilesPath: [files?.gpkg?.path],
          productShapefilePath: files?.product?.path,
          metadataShapefilePath: files?.metadata?.path
        },
        metadata: formData ?? {},
        callbackUrls: ['https://my-dns-for-callback'],
        type: RecordType.RECORD_RASTER,
      };*/

      let result;
      if (input.context.flowType === Mode.NEW) {
        /* result = await queryExecutor(async () => {
          return await store.mutateStartRasterIngestion({ data });
        });
        if (!result || !result.startRasterIngestion.jobId || !res.startRasterIngestion.taskIds[0]) {
          throw buildError('general.server.error');
        } */
      } else if (input.context.flowType === Mode.UPDATE) {
        /* result = await queryExecutor(async () => {
          return await store.mutateStartRasterUpdateGeopkg({ data });
        });
        if (!result || !result.startRasterUpdateGeopkg.jobId || !res.startRasterIngestion.taskIds[0]) {
          throw buildError('general.server.error');
        } */
      }
      result = {
        jobId: '8b62987a-c1f7-4326-969e-ceca4c81b5aa',
        taskIds: [
          '3fa85f64-5717-4562-b3fc-2c963f66afa6'
        ]
      };

      return {
        jobId: result.jobId,
        taskId: result.taskIds[0]
      };
    }),
    jobPollingService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { jobId, taskId } = input.context.job || {};
      const missing = [];
      if (!jobId) {
        missing.push('jobId');
      }
      if (!taskId) {
        missing.push('taskId');
      }
      if (missing.length > 0) {
        throw buildError('ingestion.error.missing', `${missing.join(', ')}`);
      }

      // const result = await queryExecutor(async () => {
      //   return await input.context.store.queryTaskById({
      //     params: {
      //       jobId: jobId as string,
      //       taskId: taskId as string
      //     }
      //   });
      // });
      const result = await queryExecutor(async () => {
        return await input.context.store.queryTasks({
          params: {
            jobId: jobId as string
          }
        });
      });
      // @ts-ignore
      const task = (result.tasks as TasksGroupModelType[]).find(task => task.type === 'init');
      // const task = (result.tasks as TasksGroupModelType[]).find(task => task.id === taskId);

      if (!task) {
        throw buildError('ingestion.error.not-found', taskId);
      }

      return {
        percentage: task.percentage ?? 0,
        report: task.parameters ?? {invalidData: 5, invalidGeometry: 10, tooManyVertices: 1, smallHoles: 1, resolutionMismatch: 13},
        taskStatus: task.status ?? ''
      };
    }),
    restoreJobService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      let { flowType, selectionMode, files, resolutionDegree, formData, job } = input.context || {};
      let { gpkg, product, metadata } = files || {};

      if (files?.gpkg) {
        const gpkgRef = files.gpkg;
        gpkgRef.details = await getDetails(gpkgRef.path, input.context);
        gpkgRef.exists = !!gpkgRef.details;
      }
      if (files?.product) {
        const productRef = files.product;
        productRef.details = await getDetails(productRef.path, input.context);
        productRef.exists = !!productRef.details;
      }
      if (files?.metadata) {
        const metadataRef = files.metadata;
        metadataRef.details = await getDetails(metadataRef.path, input.context);
        metadataRef.exists = !!metadataRef.details;
      }

      if (!files?.gpkg?.path) {
        throw (buildError('ingestion.error.missing', 'GPKG'));
      }

      const gpkgPath = files.gpkg.path;

      const result = await queryExecutor(async () => {
        return await input.context.store.queryValidateGPKGSource({
          data: {
            gpkgFilesPath: [gpkgPath],
            type: RecordType.RECORD_RASTER,
          }
        });
      });

      const validationResult = { ...result.validateGPKGSource[FIRST] };
      const { feature: gpkgFeature, marker: gpkgMarker } = getFeatureAndMarker(validationResult.extentPolygon, FeatureType.SOURCE_EXTENT, FeatureType.SOURCE_EXTENT_MARKER);

      let productFM: { feature: Feature<Geometry, GeoJsonProperties>; marker: Feature<Geometry, GeoJsonProperties>; } | undefined;
      if (files.product) {
        // const result = await queryExecutor(async () => {
        //   return await input.context.store.queryGetFile({
        //       data: {
        //         path: files.product?.path ?? '',
        //         type: RecordType.RECORD_RASTER,
        //       },
        //     });
        // });

        // const outlinedPolygon = await shp(result.getFile[FIRST]);
        const outlinedPolygon: Geometry = MOCK_POLYGON;

        productFM = getFeatureAndMarker(outlinedPolygon, FeatureType.PP_PERIMETER, FeatureType.PP_PERIMETER_MARKER);
      }

      return {
        flowType,
        selectionMode,
        files: {
          ...files,
          gpkg: {
            ...gpkg,
            validationResult,
            geoDetails: {
              feature: gpkgFeature,
              marker: gpkgMarker
            }
          },
          product: {
            ...product,
            geoDetails: {
              feature: productFM?.feature,
              marker: productFM?.marker
            }
          },
          metadata: {
            ...metadata
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
      const gpkg = await selectGpkg(input.context);
      const gpkgPath = input.context.files?.gpkg?.path as string;
      let result;
      try {
        result = await queryExecutor(async () => {
          return await input.context.store.queryGetDirectory({
            data: {
              path: path.resolve(gpkgPath, SHAPES_DIR),
              type: RecordType.RECORD_RASTER,
            },
          });
        });
      } catch (e) {
      }
      const product = getFile(result?.getDirectory as FileData[], gpkgPath, PRODUCT_SHP, PRODUCT_LABEL);
      const metadata = getFile(result?.getDirectory as FileData[], gpkgPath, METADATA_SHP, METADATA_LABEL);

      return {
        gpkg: {
          ...gpkg
        },
        product,
        metadata
      };
    }),
    selectGpkgService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      return selectGpkg(input.context);
    }),
    fetchProductService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { product } = input.context.files ?? {};
      if (!product || !product.exists || !product.path) {
        throw buildError('ingestion.error.missing', PRODUCT_SHP);
      }

      // const result = await queryExecutor(async () => {
      //   return await input.context.store.queryGetFile({
      //       data: {
      //         path: product?.path ?? '',
      //         type: RecordType.RECORD_RASTER,
      //       },
      //     });
      // });

      // const outlinedPolygon = await shp(result.getFile[FIRST]);
      const outlinedPolygon: Geometry = MOCK_POLYGON;

      const { feature, marker } = getFeatureAndMarker(outlinedPolygon, FeatureType.PP_PERIMETER, FeatureType.PP_PERIMETER_MARKER);

      return {
        // data: new File(result.getFile[FIRST], path.basename(product.path)),
        geoDetails: {
          feature,
          marker
        }
      };
    }),
    checkMetadataService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { metadata } = input.context.files || {};
      if (!metadata || !metadata.exists || !metadata.path) {
        throw buildError('ingestion.error.missing', METADATA_SHP);
      }
      return Promise.resolve({ success: true });
    })
  }
};
