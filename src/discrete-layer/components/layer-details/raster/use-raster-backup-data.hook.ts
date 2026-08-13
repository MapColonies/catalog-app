import { useEffect } from 'react';
import {
  GeojsonFeatureCollectionModelType,
  LayerRasterRecordModelType,
  ProductType,
  useQuery,
  useStore,
} from '../../../models';
import { ILayerImage } from '../../../models/layerImage';
import { RasterBackupParams } from '../../../models/RootStore.base';

export interface RasterBackupData {
  backupMetadata: LayerRasterRecordModelType | undefined;
  OuterPerimeter: GeojsonFeatureCollectionModelType | undefined;
  loading: boolean;
  metadataError: unknown;
  outerPerimeterError: unknown;
}

export const useRasterBackupData = (layerRecord: ILayerImage): RasterBackupData => {
  const store = useStore();
  const currentLayer = layerRecord as LayerRasterRecordModelType;

  const metadataQuery = useQuery<{ getRasterBackupMetadata: LayerRasterRecordModelType }>();
  const outerPerimeterQuery = useQuery<{
    getOuterPerimeter: GeojsonFeatureCollectionModelType;
  }>();

  useEffect(() => {
    const { productId, productVersion, productType } = currentLayer;
    if (!productId || !productVersion || !productType) {
      return;
    }
    const currentLayerParams: RasterBackupParams = {
      productId,
      productVersion,
      productType: productType as ProductType,
    };
    metadataQuery.setQuery(store.queryGetRasterBackupMetadata({ data: currentLayerParams }));
    outerPerimeterQuery.setQuery(store.queryGetOuterPerimeter({ data: currentLayerParams }));
  }, []);

  return {
    backupMetadata: metadataQuery.data?.getRasterBackupMetadata,
    OuterPerimeter: outerPerimeterQuery.data?.getOuterPerimeter,
    loading: metadataQuery.loading || outerPerimeterQuery.loading,
    metadataError: metadataQuery.error,
    outerPerimeterError: outerPerimeterQuery.error,
  };
};
