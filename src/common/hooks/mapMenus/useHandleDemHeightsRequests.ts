import { useEffect, useState } from 'react';
import {
  PositionWithHeightModelType,
  PositionsWithHeightsModelType,
  useQuery,
  useStore,
} from '../../../discrete-layer/models';
import { GetDemPointsHeightsInput } from '../../../discrete-layer/models/RootStore.base';

type HandlerDemHeightsOptions = GetDemPointsHeightsInput & {
  onDataResolved?: (data?: PositionsWithHeightsModelType) => void;
};

const DEM_POINTS_HEIGHTS_QUERY = `data {
  latitude
  longitude
  height
}`;

const useHandleDemHeightsRequests = (): {
  data: { getPointsHeights: PositionsWithHeightsModelType } | undefined;
  loading: boolean;
  demHeightsOptions: GetDemPointsHeightsInput | undefined;
  setDemHeightsOptions: (options: HandlerDemHeightsOptions) => void;
} => {
  const store = useStore();
  const [demHeightsOptions, setDemHeightsOptions] =
    useState<HandlerDemHeightsOptions>();

  const { data, loading, setQuery } = useQuery<{
    getPointsHeights: PositionsWithHeightsModelType;
  }>();

  useEffect(() => {
    if (demHeightsOptions) {
      setQuery(
        store.queryGetPointsHeights(
          { data: { ...demHeightsOptions } },
          DEM_POINTS_HEIGHTS_QUERY
        )
      );
    }
  }, [demHeightsOptions]);

  useEffect(() => {
    if (demHeightsOptions && !loading && data) {
      const demPositionsWithHeights = [
        ...((data?.getPointsHeights as PositionsWithHeightsModelType)
          ?.data as PositionWithHeightModelType[]),
      ];

      store.mapMenusManagerStore.setCurrentPositionDemHeight(
        demPositionsWithHeights[0]
      );

      demHeightsOptions.onDataResolved?.(data.getPointsHeights);
    }
  }, [data, loading]);

  return { data, loading, demHeightsOptions, setDemHeightsOptions };
};

export default useHandleDemHeightsRequests;
