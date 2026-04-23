import { Dispatch, MutableRefObject, SetStateAction, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Feature } from 'geojson';
import GeoJSON from 'ol/format/GeoJSON';
import { FitOptions } from 'ol/View';
import { useMap } from '@map-colonies/react-components';
import {
  NO_PROPERTIES_MESSAGE_CODE,
  NO_PROPERTIES_MESSAGE_KEY
} from '../../../discrete-layer/components/layer-details/raster/pp-map';

interface FeatureSelectionHandlerProps {
  featuresRef?: MutableRefObject<Feature[]>;
  pendingSelectionFeatureRef?: MutableRefObject<Feature | null>;
  selectedFeatureKey?: string;
  selectedFeatureRequestId?: number;
  fitOptions?: FitOptions;
  enableFeaturePropertiesPopup: boolean;
  setSelectedExistingFeature: Dispatch<SetStateAction<Feature | undefined>>;
  setSelectedFeatureProperties: Dispatch<SetStateAction<Record<string, unknown> | undefined>>;
  lastHandledSelectedFeatureKeyRef: MutableRefObject<string | undefined>;
  lastHandledSelectedFeatureRequestIdRef: MutableRefObject<number | undefined>;
}

export const FeatureSelectionHandler: React.FC<FeatureSelectionHandlerProps> = ({
  featuresRef,
  pendingSelectionFeatureRef,
  selectedFeatureKey,
  selectedFeatureRequestId,
  fitOptions,
  enableFeaturePropertiesPopup,
  setSelectedExistingFeature,
  setSelectedFeatureProperties,
  lastHandledSelectedFeatureKeyRef,
  lastHandledSelectedFeatureRequestIdRef,
}) => {
  const intl = useIntl();
  const map = useMap();

  useEffect(() => {
    if (!selectedFeatureKey) {
      lastHandledSelectedFeatureKeyRef.current = undefined;
      lastHandledSelectedFeatureRequestIdRef.current = undefined;
      return;
    }

    setSelectedExistingFeature(undefined);

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
        map.getView().fit(geometry.getExtent(), {
          duration: 250,
          maxZoom: 18,
          padding: [32, 32, 32, 32],
          ...fitOptions,
        });
        lastHandledSelectedFeatureKeyRef.current = selectedFeatureKey;
        lastHandledSelectedFeatureRequestIdRef.current = selectedFeatureRequestId;
      } catch {
        return;
      }

      if (!enableFeaturePropertiesPopup) {
        return;
      }

      const properties = featureToFit.properties as Record<string, unknown> | null | undefined;
      if (properties && Object.keys(properties).length > 0) {
        setSelectedFeatureProperties(properties);
        return;
      }

      setSelectedFeatureProperties({
        [NO_PROPERTIES_MESSAGE_KEY]: intl.formatMessage({ id: NO_PROPERTIES_MESSAGE_CODE }),
      });
    }
  }, [
    map,
    featuresRef,
    pendingSelectionFeatureRef,
    selectedFeatureKey,
    selectedFeatureRequestId,
    fitOptions,
    enableFeaturePropertiesPopup,
    setSelectedExistingFeature,
    setSelectedFeatureProperties,
    lastHandledSelectedFeatureKeyRef,
    lastHandledSelectedFeatureRequestIdRef,
  ]);

  return null;
};
