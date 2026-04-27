import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { Feature } from 'geojson';
import GeoJSON from 'ol/format/GeoJSON';
import { useMap } from '@map-colonies/react-components';

const NO_PROPERTIES_MESSAGE_KEY = '__noPropertiesMessage';
const NO_PROPERTIES_MESSAGE_CODE = 'polygon-parts.map-preview.no-feature-properties';

interface FeatureSelectionHandlerProps {
  featuresRef?: MutableRefObject<Feature[]>;
  pendingSelectionFeatureRef?: MutableRefObject<Feature | null>;
  selectedFeatureKey?: string;
  selectedFeatureRequestId?: number;
  enableFeaturePropertiesPopup: boolean;
  setSelectedFeature: Dispatch<SetStateAction<Feature | undefined>>;
}

export const FeatureSelectionHandler: React.FC<FeatureSelectionHandlerProps> = ({
  featuresRef,
  pendingSelectionFeatureRef,
  selectedFeatureKey,
  selectedFeatureRequestId,
  enableFeaturePropertiesPopup,
  setSelectedFeature,
}) => {
  const intl = useIntl();
  const map = useMap();
  const lastHandledSelectedFeatureKeyRef = useRef<string | undefined>(undefined);
  const lastHandledSelectedFeatureRequestIdRef = useRef<number | undefined>(undefined);

  const toSelectedFeature = useCallback((feature: Feature): Feature => {
    const properties = feature.properties as Record<string, unknown> | null | undefined;
    if (properties && Object.keys(properties).length > 0) {
      return feature;
    }
    return {
      ...feature,
      properties: {
        ...(properties ?? {}),
        [NO_PROPERTIES_MESSAGE_KEY]: intl.formatMessage({ id: NO_PROPERTIES_MESSAGE_CODE }),
      },
    };
  }, []);

  useEffect(() => {
    if (!selectedFeatureKey) {
      lastHandledSelectedFeatureKeyRef.current = undefined;
      lastHandledSelectedFeatureRequestIdRef.current = undefined;
      return;
    }

    const selectedFeature = [...(featuresRef?.current ?? [])].find((feature) => {
      return feature?.properties?._key === selectedFeatureKey;
    });

    // If not in viewport, use pendingSelectionFeatureRef (set by list click)
    let featureToFit = selectedFeature;
    if (!featureToFit) {
      const pending = pendingSelectionFeatureRef?.current;
      const pendingKey = pending?.properties?._key;
      if (pendingSelectionFeatureRef && pendingKey === selectedFeatureKey) {
        featureToFit = pending ?? undefined;
        pendingSelectionFeatureRef.current = null;
      }
    }

    if (!featureToFit?.geometry) {
      return;
    }

    const shouldFitToSelectedFeature = selectedFeatureRequestId !== undefined
      ? lastHandledSelectedFeatureRequestIdRef.current !== selectedFeatureRequestId
      : lastHandledSelectedFeatureKeyRef.current !== selectedFeatureKey;

    if (shouldFitToSelectedFeature) {
      try {
        const geometry = new GeoJSON().readGeometry(featureToFit.geometry);
        const view = map.getView();
        map.getView().fit(geometry.getExtent(), {
          duration: 250,
          maxZoom: view.getMaxZoom() ?? 18,
          padding: [32, 32, 32, 32],
        });
        lastHandledSelectedFeatureKeyRef.current = selectedFeatureKey;
        lastHandledSelectedFeatureRequestIdRef.current = selectedFeatureRequestId;
      } catch {
        return;
      }

      if (!enableFeaturePropertiesPopup) {
        return;
      }

      setSelectedFeature(toSelectedFeature(featureToFit));
    }
  }, [
    map,
    featuresRef,
    pendingSelectionFeatureRef,
    selectedFeatureKey,
    selectedFeatureRequestId,
    enableFeaturePropertiesPopup,
    setSelectedFeature,
    toSelectedFeature,
  ]);

  return null;
};
