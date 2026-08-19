import { useMemo } from 'react';
import { Feature } from 'geojson';
import { Options } from 'ol/layer/Base';
import { VectorLayer, VectorSource, GeoJSONFeature } from '@map-colonies/react-components';
import { getStyleByFeatureType } from '../../../discrete-layer/components/layer-details/raster/pp-map.utils';

interface SelectedFeatureVectorLayerProps {
  feature?: Feature;
  options?: Options;
  fit?: boolean;
}

export const SelectedFeatureVectorLayer: React.FC<SelectedFeatureVectorLayerProps> = ({
  feature,
  options,
  fit,
}) => {
  const featureStyle = useMemo(() => {
    const style = getStyleByFeatureType(feature)?.clone();
    const stroke = style?.getStroke();
    if (stroke) {
      const selectedStroke = stroke.clone();
      selectedStroke.setWidth((stroke.getWidth() ?? 0) + 4);
      style?.setStroke(selectedStroke);
    }
    return style;
  }, [feature]);

  if (!feature || feature.properties?._showAsFootprint) {
    return null;
  }

  return (
    <VectorLayer options={options}>
      <VectorSource>
        {feature ? (
          <GeoJSONFeature geometry={feature} fit={fit} featureStyle={featureStyle} />
        ) : null}
      </VectorSource>
    </VectorLayer>
  );
};
