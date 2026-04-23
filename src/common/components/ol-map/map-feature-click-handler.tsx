import { Dispatch, MutableRefObject, SetStateAction, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { useMap } from '@map-colonies/react-components';
import {
  NO_PROPERTIES_MESSAGE_CODE,
  NO_PROPERTIES_MESSAGE_KEY
} from '../../../discrete-layer/components/layer-details/raster/pp-map';
import { isValidGeometryType } from '../../utils/geojson.validation';

interface MapFeatureClickHandlerProps {
  enableFeaturePropertiesPopup: boolean;
  externalFeaturesRef?: MutableRefObject<Feature[]>;
  existingPPFeaturesRef: MutableRefObject<Feature[]>;
  showExistingPolygonPartsRef: MutableRefObject<boolean>;
  lastCheckboxClickTimestampRef: MutableRefObject<number>;
  onMapFeatureClick?: (featureKey: string | undefined) => void;
  setSelectedExistingFeature: Dispatch<SetStateAction<Feature | undefined>>;
  setSelectedFeatureProperties: Dispatch<SetStateAction<Record<string, unknown> | undefined>>;
  getClickedOlFeatureProperties: (olFeature: unknown) => Record<string, unknown> | undefined;
  isOlPolygonFeature: (olFeature: unknown) => boolean;
  getClickedFeatureProperties: (coordinate: number[]) => Record<string, unknown> | undefined;
  isFootprintProperties: (properties?: Record<string, unknown>) => boolean;
  addExistingFeatureLabelToProperties: (
    properties: Record<string, unknown>,
    existingFeature: Feature
  ) => Record<string, unknown>;
  addFeatureLabelToProperties: (
    properties: Record<string, unknown>
  ) => Record<string, unknown>;
}

export const MapFeatureClickHandler: React.FC<MapFeatureClickHandlerProps> = ({
  enableFeaturePropertiesPopup,
  externalFeaturesRef,
  existingPPFeaturesRef,
  showExistingPolygonPartsRef,
  lastCheckboxClickTimestampRef,
  onMapFeatureClick,
  setSelectedExistingFeature,
  setSelectedFeatureProperties,
  getClickedOlFeatureProperties,
  isOlPolygonFeature,
  getClickedFeatureProperties,
  isFootprintProperties,
  addExistingFeatureLabelToProperties,
  addFeatureLabelToProperties,
}) => {
  const intl = useIntl();
  const map = useMap();

  useEffect(() => {
    if (!enableFeaturePropertiesPopup) {
      setSelectedFeatureProperties(undefined);
      return;
    }

    const onSingleClick = (event: MapBrowserEvent<UIEvent>): void => {
      if (Date.now() - lastCheckboxClickTimestampRef.current < 150) {
        return;
      }

      let clickedProperties: Record<string, unknown> | undefined;
      let clickedPolygonWithoutProperties = false;
      let clickedFeatureKey: string | undefined;
      let clickedExistingFeature = false;

      map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => {
          const featureProperties = getClickedOlFeatureProperties(feature);
          if (featureProperties) {
            clickedProperties = featureProperties;
            clickedFeatureKey = (featureProperties._key as string | undefined) ?? (featureProperties.key as string | undefined);
            return feature;
          }

          if (isOlPolygonFeature(feature)) {
            // Geometry-only OL feature (no attached properties) - likely an existing feature.
            // Only search the existing features ref when the existing PP layer is visible.
            if (showExistingPolygonPartsRef.current) {
              // Do a turf lookup to find its GeoJSON counterpart and stop iteration
              // before it falls through to the external features.
              const clickedPoint = point(event.coordinate as [number, number]);
              const matchingExisting = existingPPFeaturesRef.current.find((f) => {
                if (!f?.geometry || !isValidGeometryType(f.geometry)) {
                  return false;
                }
                try {
                  return booleanPointInPolygon(clickedPoint, f as Feature<Polygon | MultiPolygon>);
                } catch {
                  return false;
                }
              });

              if (matchingExisting) {
                if (
                  isFootprintProperties(
                    matchingExisting.properties as Record<string, unknown> | undefined
                  )
                ) {
                  return undefined;
                }

                clickedExistingFeature = true;
                setSelectedExistingFeature(matchingExisting);
                if (matchingExisting.properties && Object.keys(matchingExisting.properties).length > 0) {
                  clickedProperties = addExistingFeatureLabelToProperties(
                    matchingExisting.properties as Record<string, unknown>,
                    matchingExisting
                  );
                } else {
                  clickedProperties = addExistingFeatureLabelToProperties({
                    [NO_PROPERTIES_MESSAGE_KEY]: intl.formatMessage({ id: NO_PROPERTIES_MESSAGE_CODE }),
                  }, matchingExisting);
                }
                return feature; // stop iteration — do not continue to external features
              }
            }

            clickedPolygonWithoutProperties = true;
          }

          return undefined;
        },
        { hitTolerance: 4 }
      );

      if (clickedProperties) {
        setSelectedFeatureProperties(addFeatureLabelToProperties(clickedProperties));
        if (clickedExistingFeature) {
          // Existing feature was clicked - clear any external list selection
          onMapFeatureClick?.(undefined);
        } else if (clickedFeatureKey) {
          setSelectedExistingFeature(undefined);
          onMapFeatureClick?.(clickedFeatureKey);
        }
        return;
      }

      const fallbackProperties = getClickedFeatureProperties(event.coordinate);
      if (fallbackProperties) {
        if (isFootprintProperties(fallbackProperties)) {
          setSelectedExistingFeature(undefined);
          setSelectedFeatureProperties(undefined);
          return;
        }

        // Determine whether the hit feature belongs to the existing features or external features
        const clickedPoint = point(event.coordinate as [number, number]);
        const matchingExistingFallback = showExistingPolygonPartsRef.current ? existingPPFeaturesRef.current.find((f) => {
          if (!f?.geometry || !isValidGeometryType(f.geometry)) {
            return false;
          }
          try {
            return booleanPointInPolygon(clickedPoint, f as Feature<Polygon | MultiPolygon>);
          } catch {
            return false;
          }
        }) : undefined;

        if (matchingExistingFallback) {
          if (
            isFootprintProperties(
              matchingExistingFallback.properties as Record<string, unknown> | undefined
            )
          ) {
            setSelectedExistingFeature(undefined);
            setSelectedFeatureProperties(undefined);
            return;
          }

          setSelectedExistingFeature(matchingExistingFallback);
          onMapFeatureClick?.(undefined);
          setSelectedFeatureProperties(
            addExistingFeatureLabelToProperties(fallbackProperties, matchingExistingFallback)
          );
          return;
        }

        setSelectedExistingFeature(undefined);
        const external = [...(externalFeaturesRef?.current ?? [])].find((f) => {
          if (!f?.geometry || !isValidGeometryType(f.geometry)) {
            return false;
          }
          try {
            return booleanPointInPolygon(clickedPoint, f as Feature<Polygon | MultiPolygon>);
          } catch {
            return false;
          }
        });
        const fallbackFeatureKey = external?.properties?._key;
        if (fallbackFeatureKey) {
          onMapFeatureClick?.(fallbackFeatureKey);
        }

        setSelectedFeatureProperties(addFeatureLabelToProperties(fallbackProperties));
        return;
      }

      if (clickedPolygonWithoutProperties) {
        setSelectedExistingFeature(undefined);
        setSelectedFeatureProperties(undefined);
      }
    };

    map.on('singleclick', onSingleClick);

    return (): void => {
      map.un('singleclick', onSingleClick);
    };
  }, [
    map,
    enableFeaturePropertiesPopup,
    externalFeaturesRef,
    existingPPFeaturesRef,
    showExistingPolygonPartsRef,
    lastCheckboxClickTimestampRef,
    onMapFeatureClick,
    setSelectedExistingFeature,
    setSelectedFeatureProperties,
    getClickedOlFeatureProperties,
    isOlPolygonFeature,
    getClickedFeatureProperties,
    isFootprintProperties,
    addExistingFeatureLabelToProperties,
    addFeatureLabelToProperties,
  ]);

  return null;
};
