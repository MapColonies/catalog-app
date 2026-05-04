import { useEffect, useState } from 'react';
import { Feature } from 'geojson';
import { Options } from 'ol/layer/Base';
import { Style } from 'ol/style';
import { VectorLayer, VectorSource, GeoJSONFeature } from '@map-colonies/react-components';
import { getStyleByFeatureType } from '../../../discrete-layer/components/layer-details/raster/pp-map.utils';

interface SelectedFeatureVectorLayerProps {
  feature?: Feature;
  options?: Options;
}

export const SelectedFeatureVectorLayer: React.FC<SelectedFeatureVectorLayerProps> = ({
  feature,
  options,
}) => {
  const [featureGeometry, setFeatureGeometry] = useState<Feature['geometry'] | undefined>(undefined);
  const [featureStyle, setFeatureStyle] = useState<Style | undefined>(undefined);

  useEffect(() => {
    if (!feature) {
      setFeatureGeometry(undefined);
      setFeatureStyle(undefined);
      return;
    }
    if (feature.properties?._showAsFootprint) {
      return;
    }
    const style = getStyleByFeatureType(feature)?.clone();
    const stroke = style?.getStroke();
    if (stroke) {
      const selectedStroke = stroke.clone();
      selectedStroke.setWidth((stroke.getWidth() ?? 0) + 4);
      style?.setStroke(selectedStroke);
    }
    setFeatureStyle(style);
    setFeatureGeometry(feature?.geometry ? { ...feature.geometry } : undefined);
  }, [feature]);

  return (
    <VectorLayer options={options}>
      <VectorSource>
        {featureGeometry
          ? <GeoJSONFeature geometry={featureGeometry} featureStyle={featureStyle} />
          : null}
      </VectorSource>
    </VectorLayer>
  );
};
