import { MutableRefObject } from 'react';
import { Feature } from 'geojson';
import { isEmpty } from 'lodash';
import { FitOptions } from 'ol/View';
import { GeoJSONFeature, useMap, useVectorSource } from '@map-colonies/react-components';
import { PPMapStyles } from './pp-map.utils';

const RENDERS_TILL_FULL_FEATURES_SET = 1; // first render with source, second with PPs perimeter geometry

interface GeoFeaturesInnerProps {
  geoFeatures?: Feature[];
  fitOptions?: FitOptions | undefined;
  renderCount: MutableRefObject<number>;
}

export const GeoFeaturesInnerComponent: React.FC<GeoFeaturesInnerProps> = ({
  geoFeatures,
  fitOptions,
  renderCount,
}) => {
  const source = useVectorSource();
  const map = useMap();

  if (renderCount.current < RENDERS_TILL_FULL_FEATURES_SET) {
    source.once('change', () => {
      if (source.getState() === 'ready') {
        setTimeout(() => {
          map.getView().fit(source.getExtent(), fitOptions);
        }, 0);
      }
    });
  }

  return (
    <>
      {geoFeatures?.map((feat, idx) => {
        return feat && !isEmpty(feat.geometry) ? (
          <GeoJSONFeature
            geometry={{ ...feat.geometry }}
            fit={false}
            key={feat.id ?? idx}
            featureStyle={PPMapStyles.get(feat?.properties?.featureType)}
          />
        ) : null;
      })}
    </>
  );
};
