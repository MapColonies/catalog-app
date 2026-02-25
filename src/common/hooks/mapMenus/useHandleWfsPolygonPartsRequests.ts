import { cloneDeep } from 'lodash';
import { useEffect, useState } from 'react';
import bbox from '@turf/bbox';
import {
  GetFeatureModelType,
  useQuery,
  useStore,
} from '../../../discrete-layer/models';
import { WfsPolygonPartsGetFeatureParams } from '../../../discrete-layer/models/RootStore.base';

type HandlerGetFeatureOptions = WfsPolygonPartsGetFeatureParams & {
  onDataResolved?: (data?: GetFeatureModelType) => void;
  shouldFlyToFeatures?: boolean;
};

const useHandleWfsPolygonPartsRequests = (): {
  data: { getPolygonPartsFeature: GetFeatureModelType } | undefined;
  loading: boolean;
  getPolygonPartsFeatureOptions: WfsPolygonPartsGetFeatureParams | undefined;
  setGetPolygonPartsFeatureOptions: (options: HandlerGetFeatureOptions) => void;
} => {
  const store = useStore();
  const [getPolygonPartsFeatureOptions, setGetPolygonPartsFeatureOptions] =
    useState<HandlerGetFeatureOptions>();

  const { data, loading, setQuery } = useQuery<{
    getPolygonPartsFeature: GetFeatureModelType;
  }>();

  useEffect(() => {
    if (getPolygonPartsFeatureOptions) {
      const { onDataResolved, shouldFlyToFeatures, ...restPPOptions } =
        getPolygonPartsFeatureOptions;
      setQuery(
        store.queryGetPolygonPartsFeature({
          data: { ...restPPOptions, count: 100 },
        })
      );
    }
  }, [getPolygonPartsFeatureOptions]);

  useEffect(() => {
    if (getPolygonPartsFeatureOptions && !loading && data) {
      const featureInfo = {
        ...cloneDeep(data.getPolygonPartsFeature),
        feature: getPolygonPartsFeatureOptions.feature,
      };

      store.mapMenusManagerStore.setCurrentPolygonPartsInfo(featureInfo);

      getPolygonPartsFeatureOptions.onDataResolved?.(featureInfo);
    }

    //TODO: Handle Errors, how should we deal with them?
  }, [data, loading]);

  useEffect(() => {
    // After data has been received, trigger side effect logics
    if (
      store.mapMenusManagerStore.currentPolygonPartsInfo &&
      getPolygonPartsFeatureOptions
    ) {
      const polygonPartsFeatures =
        store.mapMenusManagerStore.currentPolygonPartsInfo.features;
      const { shouldFlyToFeatures } = getPolygonPartsFeatureOptions;

      if (
        polygonPartsFeatures &&
        polygonPartsFeatures.length > 0 &&
        shouldFlyToFeatures
      ) {
        const featuresBBox = bbox({
          type: 'FeatureCollection',
          features: polygonPartsFeatures,
        });
        store.mapMenusManagerStore.setMultiplePolygonPartsBBox(featuresBBox);
      }
    }
  }, [store.mapMenusManagerStore.currentPolygonPartsInfo]);

  return {
    data,
    loading,
    getPolygonPartsFeatureOptions,
    setGetPolygonPartsFeatureOptions,
  };
};

export default useHandleWfsPolygonPartsRequests;
