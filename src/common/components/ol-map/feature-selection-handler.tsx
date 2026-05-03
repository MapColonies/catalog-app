import { useEffect } from 'react';
import { Feature } from 'geojson';
import GeoJSON from 'ol/format/GeoJSON';
import { useMap } from '@map-colonies/react-components';

interface FeatureSelectionHandlerProps {
  feature?: Feature;
}

export const FlyTo: React.FC<FeatureSelectionHandlerProps> = ({ feature }) => {
  const map = useMap();

  useEffect(() => {
    if (!feature) {
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
    } catch {
      return;
    }
  }, [feature]);

  return null;
};
