import { Dispatch, SetStateAction, useEffect } from 'react';
import { Feature } from 'geojson';
import OLFeature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { useMap } from '@map-colonies/react-components';

interface MapFeatureClickHandlerProps {
  onMapFeatureClick?: (feature: Feature | undefined) => void;
  setSelectedFeature: Dispatch<SetStateAction<Feature | undefined>>;
}

export const MapFeatureClickHandler: React.FC<MapFeatureClickHandlerProps> = ({
  onMapFeatureClick,
  setSelectedFeature,
}) => {
  const map = useMap();

  useEffect(() => {
    const onSingleClick = (event: MapBrowserEvent<UIEvent>): void => {
      const clickedFeatures = map.getFeaturesAtPixel(event.pixel, { hitTolerance: 4 });
      const clickedFeature = clickedFeatures?.[0];
      if (clickedFeature) {
        const geojsonFormat = new GeoJSON();
        const geojsonFeature = geojsonFormat.writeFeatureObject(clickedFeature as OLFeature);
        onMapFeatureClick?.(geojsonFeature);
        setSelectedFeature(geojsonFeature);
      }
    };

    map.on('singleclick', onSingleClick);

    return (): void => {
      map.un('singleclick', onSingleClick);
    };
  }, [onMapFeatureClick, setSelectedFeature]);

  return null;
};
