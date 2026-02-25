/* eslint-disable @typescript-eslint/naming-convention */
import React, { useEffect } from 'react';
import { observer } from 'mobx-react';
import { useQuery, useStore } from '../../../models/RootStore';

export interface IFeatureConfig {
  isVisualized?: boolean;
  color?: string;
  outlineColor?: string;
  dWithin?: number;
  translationId?: string;
  icon?: string;
  markerIcon?: string;
  outlineWidth?: number;
}

export interface IFeatureConfigs {
  [featureType: string]: IFeatureConfig | undefined;
}

export const WfsFeaturesFetcher: React.FC = observer(() => {
  const store = useStore();
  const wfsGetFeatureTypesQuery = useQuery((store) =>
    store.queryGetFeatureTypes()
  );

  useEffect(() => {
    if (!wfsGetFeatureTypesQuery.loading && wfsGetFeatureTypesQuery.data) {
      const featureConfigs = {
        ...(wfsGetFeatureTypesQuery.data.getFeatureTypes
          .featureConfigs as IFeatureConfigs),
      };
      const features = Object.fromEntries(
        Object.entries(featureConfigs).filter(
          ([key, value]) => value?.translationId
        )
      );
      store.mapMenusManagerStore.setWfsTotal(
        Object.keys(featureConfigs).length
      );
      store.mapMenusManagerStore.setWfsFeatureConfigs(features);
    }
  }, [wfsGetFeatureTypesQuery.data, wfsGetFeatureTypesQuery.loading]);

  return null;
});
