import { Dispatch, MutableRefObject, SetStateAction, useEffect } from 'react';
import { Feature } from 'geojson';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { useMap } from '@map-colonies/react-components';

interface MapFeatureClickHandlerProps {
  enableFeaturePropertiesPopup: boolean;
  lastCheckboxClickTimestampRef: MutableRefObject<number>;
  onMapFeatureClick?: (featureKey: string | undefined) => void;
  setSelectedFeature: Dispatch<SetStateAction<Feature | undefined>>;
  isOlPolygonFeature: (olFeature: unknown) => boolean;
  getClickedFeature: (coordinate: number[]) => Feature | undefined;
  isFootprintProperties: (properties?: Record<string, unknown>) => boolean;
}

export const MapFeatureClickHandler: React.FC<MapFeatureClickHandlerProps> = ({
  enableFeaturePropertiesPopup,
  lastCheckboxClickTimestampRef,
  onMapFeatureClick,
  setSelectedFeature,
  isOlPolygonFeature,
  getClickedFeature,
  isFootprintProperties,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!enableFeaturePropertiesPopup) {
      setSelectedFeature(undefined);
      return;
    }

    const onSingleClick = (event: MapBrowserEvent<UIEvent>): void => {
      if (Date.now() - lastCheckboxClickTimestampRef.current < 150) {
        return;
      }

      let clickedPolygonWithoutProperties = false;

      map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => {
          if (isOlPolygonFeature(feature)) {
            clickedPolygonWithoutProperties = true;
            return feature;
          }

          return undefined;
        },
        { hitTolerance: 4 }
      );

      const clickedFeature = getClickedFeature(event.coordinate);
      if (clickedFeature) {
        const properties = clickedFeature.properties as Record<string, unknown> | undefined;
        if (isFootprintProperties(properties)) {
          setSelectedFeature(undefined);
          return;
        }

        const featureKey = properties?._key as string | undefined;
        const featureType = properties?._featureType as string | undefined;

        setSelectedFeature(clickedFeature);

        if (featureType === 'EXISTING_PP') {
          onMapFeatureClick?.(undefined);
          return;
        }

        if (featureKey) {
          onMapFeatureClick?.(featureKey);
          return;
        }

        onMapFeatureClick?.(undefined);
        return;
      }

      if (clickedPolygonWithoutProperties) {
        setSelectedFeature(undefined);
      }
    };

    map.on('singleclick', onSingleClick);

    return (): void => {
      map.un('singleclick', onSingleClick);
    };
  }, [
    enableFeaturePropertiesPopup,
    lastCheckboxClickTimestampRef,
    onMapFeatureClick,
    setSelectedFeature,
    isOlPolygonFeature,
    getClickedFeature,
    isFootprintProperties,
  ]);

  return null;
};
