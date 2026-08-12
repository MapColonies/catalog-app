import { useEffect } from 'react';
import {
  GeojsonFeatureCollectionModelType,
  GetFeatureModelType,
  LayerRasterRecordModelType,
  ProductType,
  useQuery,
  useStore,
} from '../../../models';
import { ILayerImage } from '../../../models/layerImage';

export interface RasterBackupData {
  backupMetadata: LayerRasterRecordModelType | undefined;
  backupPolygonParts: GetFeatureModelType | undefined;
  changesAreaOuterPerimeter: GeojsonFeatureCollectionModelType | undefined;
  loading: boolean;
  metadataError: unknown;
  polygonPartsError: unknown;
  outerPerimeterError: unknown;
}

export const useRasterBackupData = (layerRecord: ILayerImage): RasterBackupData => {
  const store = useStore();
  const currentLayer = layerRecord as LayerRasterRecordModelType;

  const metadataQuery = useQuery<{ getRasterBackupMetadata: LayerRasterRecordModelType }>();
  const polygonPartsQuery = useQuery<{ getRasterBackupPolygonParts: GetFeatureModelType }>();
  const outerPerimeterQuery = useQuery<{
    getChangesAreaOuterPerimeter: GeojsonFeatureCollectionModelType;
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
    polygonPartsQuery.setQuery(store.queryGetRasterBackupPolygonParts({ data }));
    outerPerimeterQuery.setQuery(store.queryGetChangesAreaOuterPerimeter({ data }));
  }, [metadataQuery.data]);

  return {
    backupMetadata: metadataQuery.data?.getRasterBackupMetadata,
    backupPolygonParts: polygonPartsQuery.data?.getRasterBackupPolygonParts,
    changesAreaOuterPerimeter: outerPerimeterQuery.data?.getChangesAreaOuterPerimeter,
    loading: metadataQuery.loading || polygonPartsQuery.loading || outerPerimeterQuery.loading,
    metadataError: metadataQuery.error,
    polygonPartsError: polygonPartsQuery.error,
    outerPerimeterError: outerPerimeterQuery.error,
  };
};
