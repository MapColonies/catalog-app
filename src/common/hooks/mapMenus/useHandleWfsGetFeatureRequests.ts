import { cloneDeep } from 'lodash';
import { useEffect, useState } from 'react';
import {
  GetFeatureModelType,
  useQuery,
  useStore,
} from '../../../discrete-layer/models';
import { WfsGetFeatureParams } from '../../../discrete-layer/models/RootStore.base';

type HandlerGetFeatureOptions = WfsGetFeatureParams & {
  onDataResolved?: (data?: GetFeatureModelType) => void;
};

const useHandleWfsGetFeatureRequests = (): {
  data: { getFeature: GetFeatureModelType } | undefined;
  loading: boolean;
  getFeatureOptions: WfsGetFeatureParams | undefined;
  setGetFeatureOptions: (options: HandlerGetFeatureOptions) => void;
} => {
  const store = useStore();
  const [getFeatureOptions, setGetFeatureOptions] =
    useState<HandlerGetFeatureOptions>();

  const { data, loading, setQuery } = useQuery<{
    getFeature: GetFeatureModelType;
  }>();

  useEffect(() => {
    if (getFeatureOptions) {
      const featureConfig = store.mapMenusManagerStore.getFeatureConfig(
        getFeatureOptions.typeName
      );
      const dWithin = featureConfig.dWithin;

      setQuery(
        store.queryGetFeature({ data: { ...getFeatureOptions, dWithin } })
      );
    }
  }, [getFeatureOptions]);

  useEffect(() => {
    if (getFeatureOptions && !loading && data) {
      const featureInfo = {
        ...cloneDeep(data.getFeature),
        pointCoordinates: getFeatureOptions.pointCoordinates,
        typeName: getFeatureOptions.typeName,
      };

      store.mapMenusManagerStore.setCurrentWfsFeatureInfo(featureInfo);

      getFeatureOptions.onDataResolved?.(featureInfo);
    }

    //TODO: Handle Errors, how should we deal with them?
  }, [data, loading]);

  return { data, loading, getFeatureOptions, setGetFeatureOptions };
};

export default useHandleWfsGetFeatureRequests;
