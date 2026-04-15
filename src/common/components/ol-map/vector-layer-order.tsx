import { useEffect } from 'react';
import { useVectorLayer } from '@map-colonies/react-components';

interface VectorLayerOrderProps {
  zIndex: number;
}

export const VectorLayerOrder = ({ zIndex }: VectorLayerOrderProps): JSX.Element | null => {
  const vectorLayer = useVectorLayer();

  useEffect(() => {
    vectorLayer.setZIndex(zIndex);
  }, [vectorLayer, zIndex]);

  return null;
};
