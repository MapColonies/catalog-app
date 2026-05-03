import { useEffect, useMemo } from 'react';
import { Feature } from 'geojson';
import { Options } from 'ol/layer/Base';
import { Style } from 'ol/style';
import { VectorLayer, VectorSource, GeoJSONFeature, useMap } from '@map-colonies/react-components';
import { FlyTo } from './feature-selection-handler';

const fittedFeatureSignaturesByMap = new WeakMap<object, Set<string>>();

const getFeatureSignature = (feature?: Feature): string | undefined => {
  if (!feature) {
    return undefined;
  }
  return feature.geometry ? `geom:${JSON.stringify(feature.geometry)}` : undefined;
};

const getOrCreateFittedSignatures = (cacheKey: object): Set<string> => {
  const existing = fittedFeatureSignaturesByMap.get(cacheKey);
  if (existing) {
    return existing;
  }
  const created = new Set<string>();
  fittedFeatureSignaturesByMap.set(cacheKey, created);
  return created;
};

const getSelectedStyle = (featureStyle?: Style): Style | undefined => {
  if (!featureStyle) {
    return undefined;
  }
  const style = featureStyle.clone();
  const stroke = style.getStroke();
  if (stroke) {
    const selectedStroke = stroke.clone();
    selectedStroke.setWidth((stroke.getWidth() ?? 0) + 4);
    style.setStroke(selectedStroke);
  }
  return style;
};

interface SelectedFeatureVectorLayerProps {
  feature?: Feature;
  featureStyle?: Style;
  options?: Options;
}

export const SelectedFeatureVectorLayer: React.FC<SelectedFeatureVectorLayerProps> = ({
  feature,
  featureStyle,
  options,
}) => {
  const mapOl = useMap();
  const mapCacheKey = mapOl.getTargetElement() ?? mapOl;

  const selectedGeometry = useMemo(() => {
    return feature?.geometry ? { ...feature.geometry } : undefined;
  }, [feature]);

  const selectedFeatureSignature = useMemo(() => getFeatureSignature(feature), [feature]);

  const fittedFeatureSignatures = useMemo(
    () => getOrCreateFittedSignatures(mapCacheKey),
    [mapCacheKey]
  );

  const shouldFitSelectedFeature =
    selectedFeatureSignature !== undefined &&
    !fittedFeatureSignatures.has(selectedFeatureSignature);

  useEffect(() => {
    if (!selectedFeatureSignature || !shouldFitSelectedFeature) {
      return;
    }
    fittedFeatureSignatures.add(selectedFeatureSignature);
  }, [fittedFeatureSignatures, selectedFeatureSignature, shouldFitSelectedFeature]);

  const selectedFeatureStyle = useMemo(() => getSelectedStyle(featureStyle), [featureStyle]);

  if (!selectedGeometry) {
    return null;
  }

  return (
    <VectorLayer options={options}>
      <VectorSource>
        <GeoJSONFeature geometry={selectedGeometry} featureStyle={selectedFeatureStyle} />
        {shouldFitSelectedFeature && feature && <FlyTo feature={feature} />}
      </VectorSource>
    </VectorLayer>
  );
};
