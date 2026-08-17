import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { Feature } from 'geojson';
import OLFeature, { FeatureLike } from 'ol/Feature';
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
  const featureRef = useRef<OLFeature | null>(null);

  useEffect(() => {
    const onSingleClick = (event: MapBrowserEvent<UIEvent>): void => {
      const clickedFeatures = map.getFeaturesAtPixel(event.pixel, { hitTolerance: 4 });
      const clickedFeature: FeatureLike = clickedFeatures?.[0];
      if (!clickedFeature || clickedFeature === featureRef.current) {
        featureRef.current = null;
        setSelectedFeature(undefined);
      } else {
        const geojsonFormat = new GeoJSON();
        const geojsonFeature = geojsonFormat.writeFeatureObject(clickedFeature as OLFeature);
        featureRef.current = clickedFeature as OLFeature;
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
