import { useEffect } from 'react';
import {
  GeojsonFeatureCollectionModelType,
  LayerRasterRecordModelType,
  ProductType,
  useQuery,
  useStore,
} from '../../../models';
import { ILayerImage } from '../../../models/layerImage';

export interface RasterBackupData {
  backupMetadata: LayerRasterRecordModelType | undefined;
  changedAreaOuterPerimeter: GeojsonFeatureCollectionModelType | undefined;
  loading: boolean;
  metadataError: unknown;
  outerPerimeterError: unknown;
}

export const useRasterBackupData = (layerRecord: ILayerImage): RasterBackupData => {
  const store = useStore();
  const currentLayer = layerRecord as LayerRasterRecordModelType;

  const metadataQuery = useQuery<{ getRasterBackupMetadata: LayerRasterRecordModelType }>();
  const outerPerimeterQuery = useQuery<{
    getChangedAreaOuterPerimeter: GeojsonFeatureCollectionModelType;
  }>();

  useEffect(() => {
    const { productId, productVersion, productType } = currentLayer;
    if (!productId || !productVersion || !productType) {
      return;
    }
    metadataQuery.setQuery(
      store.queryGetRasterBackupMetadata({
        data: { productId, productVersion, productType: productType as ProductType },
      })
    );
  }, []);

  useEffect(() => {
    const backupMetadata = metadataQuery.data?.getRasterBackupMetadata;
    if (!backupMetadata) {
      return;
    }
    const { productId, productVersion, productType } = backupMetadata;
    if (!productId || !productVersion || !productType) {
      return;
    }
    const data = { productId, productVersion, productType: productType as ProductType };
    outerPerimeterQuery.setQuery(store.queryGetChangedAreaOuterPerimeter({ data }));
  }, [metadataQuery.data]);

  return {
    backupMetadata: metadataQuery.data?.getRasterBackupMetadata,
    changedAreaOuterPerimeter: outerPerimeterQuery.data?.getChangedAreaOuterPerimeter,
    loading: metadataQuery.loading || outerPerimeterQuery.loading,
    metadataError: metadataQuery.error,
    outerPerimeterError: outerPerimeterQuery.error,
  };
};
