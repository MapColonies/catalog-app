import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { Feature } from 'geojson';
import OLFeature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { useMap } from '@map-colonies/react-components';
import { getTimeStamp } from '../../../discrete-layer/components/layer-details/utils';

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
      const clickedFeature = clickedFeatures?.[0];
      const isSameFeatureClicked =
        clickedFeature?.getId() && clickedFeature?.getId() === featureRef.current?.getId();

      if (!clickedFeature || isSameFeatureClicked) {
        featureRef.current = null;
        setSelectedFeature(undefined);
      } else {
        const olFeature = clickedFeature as OLFeature;
        if (olFeature.getId() === undefined) {
          olFeature.setId(getTimeStamp());
        }
        const geojsonFormat = new GeoJSON();
        const geojsonFeature = geojsonFormat.writeFeatureObject(olFeature);
        featureRef.current = olFeature;
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
