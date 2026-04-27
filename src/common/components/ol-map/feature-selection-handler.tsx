import { useEffect } from 'react';
import { Feature } from 'geojson';
import GeoJSON from 'ol/format/GeoJSON';
import { useMap } from '@map-colonies/react-components';

interface FeatureSelectionHandlerProps {
  selectedItem?: Feature;
  setSelectedFeature: (feature: Feature | undefined) => void;
}

export const FeatureSelectionHandler: React.FC<FeatureSelectionHandlerProps> = ({ selectedItem, setSelectedFeature }) => {
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
      setSelectedFeature(selectedItem);
    } catch {
      return;
    }
  }, [selectedItem]);

  return null;
};
