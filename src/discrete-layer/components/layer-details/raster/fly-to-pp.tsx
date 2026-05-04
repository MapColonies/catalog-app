import { useEffect, useState } from 'react';
import { Feature } from 'geojson';
import GeoJSON from 'ol/format/GeoJSON';
import { containsExtent } from 'ol/extent';
import { useMap } from '@map-colonies/react-components';
import { FlyTo } from '../../../../common/components/ol-map/fly-to';

interface FlyToPPProps {
  feature?: Feature;
}

export const FlyToPP: React.FC<FlyToPPProps> = ({ feature }) => {
  const map = useMap();
  const [isOutsideExtent, setIsOutsideExtent] = useState(false);

  useEffect(() => {
    if (!feature?.geometry) {
      setIsOutsideExtent(false);
      return;
    }
    try {
      const geometry = new GeoJSON().readGeometry(feature.geometry);
      const mapSize = map.getSize();
      if (!mapSize) {
        setIsOutsideExtent(true);
        return;
      }
      const currentExtent = map.getView().calculateExtent(mapSize);
      const selectedExtent = geometry.getExtent();
      setIsOutsideExtent(!containsExtent(currentExtent, selectedExtent));
    } catch {
      setIsOutsideExtent(false);
    }
  }, [feature]);

  if (!feature) {
    return null;
  }

  return (feature.properties?._flyTo === true || isOutsideExtent)
    ? <FlyTo feature={feature} />
    : null;
};
