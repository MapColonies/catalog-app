import { useEffect } from 'react';
import { Feature } from 'geojson';
import GeoJSON from 'ol/format/GeoJSON';
import { useMap } from '@map-colonies/react-components';

interface FeatureSelectionHandlerProps {
  selectedItem?: Feature;
}

export const FeatureSelectionHandler: React.FC<FeatureSelectionHandlerProps> = ({ selectedItem }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedItem) {
      return;
    }
    try {
      const geometry = new GeoJSON().readGeometry(selectedItem?.geometry);
      const view = map.getView();
      map.getView().fit(geometry.getExtent(), {
        duration: 250,
        maxZoom: view.getMaxZoom() ?? 18,
        padding: [32, 32, 32, 32],
      });
    } catch {
      return;
    }
  }, [selectedItem]);

  return null;
};
