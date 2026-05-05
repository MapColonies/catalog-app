import { useEffect, useRef } from 'react';
import { Feature } from 'geojson';
import GeoJSON from 'ol/format/GeoJSON';
import { useMap } from '@map-colonies/react-components';

interface FlyToProps {
  feature?: Feature;
  flyOnce?: boolean;
}

export const FlyTo: React.FC<FlyToProps> = ({ feature, flyOnce = false }) => {
  const map = useMap();
  const hasFlownRef = useRef(false);

  useEffect(() => {
    if (!feature || (flyOnce && hasFlownRef.current)) {
      return;
    }
    try {
      const geometry = new GeoJSON().readGeometry(feature?.geometry);
      const view = map.getView();
      map.getView().fit(geometry.getExtent(), {
        duration: 250,
        maxZoom: view.getMaxZoom() ?? 18,
        padding: [32, 32, 32, 32],
      });
      hasFlownRef.current = true;
    } catch {
      return;
    }
  }, [feature]);

  return null;
};
