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
    if (!feature?.geometry || feature?.properties?._showAsFootprint === true) {
      setIsOutsideExtent(false);
      return;
    }

    const checkExtent = (): boolean => {
      const mapSize = map.getSize();
      if (!mapSize) {
        return false;
      }
      try {
        const geometry = new GeoJSON().readGeometry(feature.geometry);
        const currentExtent = map.getView().calculateExtent(mapSize);
        const selectedExtent = geometry.getExtent();
        setIsOutsideExtent(!containsExtent(currentExtent, selectedExtent));
      } catch (e) {
        console.log('e', e);
        setIsOutsideExtent(false);
      }
      return true;
    };

    if (!checkExtent()) {
      // Map not ready yet - retry once after first render
      const onPostRender = (): void => {
        checkExtent();
        map.un('postrender', onPostRender);
      };
      map.on('postrender', onPostRender);
      return () => {
        map.un('postrender', onPostRender);
      };
    }
  }, [feature?.properties?.id]);

  if (!feature) {
    return null;
  }

  return feature.properties?._flyTo === true || isOutsideExtent ? (
    <FlyTo feature={feature} />
  ) : null;
};
