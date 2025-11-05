import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import path from 'path';
// import shp from 'shpjs';
import { fromPromise } from 'xstate';
import { FileData } from '@map-colonies/react-components';
import { Mode } from '../../../../../common/models/mode.enum';
import {
  LayerMetadataMixedUnion,
  RecordType,
  TasksGroupModelType,
  // EntityDescriptorModelType
} from '../../../../models';
// import { LayerRasterRecordInput } from '../../../../models/RootStore.base';
// import { cleanUpEntityPayload, getFlatEntityDescriptors } from '../../utils';
import { transformEntityToFormFields } from '../../utils';
import { FeatureType } from '../pp-map.utils';
import { buildError, getFeatureAndMarker, getFile } from './helpers';
import { MOCK_JOB, MOCK_POLYGON } from './MOCK';
import { queryExecutor } from './query-executor';
import {
  FIRST,
  FromPromiseArgs,
  GPKG_LABEL,
  IContext,
  METADATA_LABEL,
  METADATA_SHP,
  PRODUCT_LABEL,
  PRODUCT_SHP,
  SHAPES_DIR,
  SHAPES_RELATIVE_TO_DATA_DIR,
  WORKFLOW
} from './types';

const getDirectory = async (filePath: string, context: IContext): Promise<FileData[] | undefined> => {
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

const getDetails = async (filePath: string, context: IContext): Promise<FileData | undefined> => {
  const files = await getDirectory(path.dirname(filePath), context);
  if (files) {
    return files.filter((file: FileData) => file.name === path.basename(filePath))[0];
  }
  return undefined;
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
      // const { updatedLayer } = input.context || {};

      // const result = await queryExecutor(async () => {
      //   return await input.context.store.queryGetActiveJob({
      //     productId: updatedLayer?.productId,
      //     productVersion: updatedLayer?.productVersion,
      //     productType: updatedLayer?.productType
      //   });
      // });

      const job = MOCK_JOB; // TODO: Mock should be removed

      const rootDirectory = await getDirectory('/', input.context);
      if (!rootDirectory || rootDirectory.length === 0) {
        throw buildError('ingestion.error.not-found', '/');
      }
      const MOUNT_DIR = rootDirectory[FIRST].name;

      const restoreData = {
        data: {
          flowType: Mode.UPDATE,
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
          gpkgFilesPath: [files?.gpkg?.path] as string[],
          productShapefilePath: files?.product?.path as string,
          metadataShapefilePath: files?.metadata?.path as string
        },
        metadata: formData ?? {},
        callbackUrls: ['https://my-dns-for-callback'],
        type: RecordType.RECORD_RASTER,
      };*/

      let result;
      if (input.context.flowType === Mode.NEW) {
        /* result = await queryExecutor(async () => {
          return await store.mutateStartRasterIngestion({ data });
        }); */
      } else if (input.context.flowType === Mode.UPDATE) {
        /* result = await queryExecutor(async () => {
          return await store.mutateStartRasterUpdateGeopkg({ data });
        }); */
      }
      result = {
        jobId: MOCK_JOB.id
      };

      return {
        jobId: result.jobId
      };
    }),
    jobPollingService: fromPromise(async ({ input }: FromPromiseArgs<IContext>) => {
      const { jobId } = input.context.job || {};
      if (!jobId) {
        throw buildError('ingestion.error.missing', 'jobId');
      }

      // const result = await queryExecutor(async () => {
      //   return await input.context.store.queryFindTask({
      //     params: {
      //       jobId: jobId as string,
      //       type: 'validation'
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
      const task = (result.tasks as TasksGroupModelType[]).find(task => task.type === 'init');

      if (!task) {
        throw buildError('ingestion.error.not-found', 'validation task');
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
      const result = await getDirectory(path.resolve(path.dirname(gpkgPath), SHAPES_RELATIVE_TO_DATA_DIR, SHAPES_DIR), input.context);
      const product = getFile(result ?? [], gpkgPath, PRODUCT_SHP, PRODUCT_LABEL);
      const metadata = getFile(result ?? [], gpkgPath, METADATA_SHP, METADATA_LABEL);

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
