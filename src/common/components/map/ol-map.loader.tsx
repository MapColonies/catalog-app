import { useEffect } from 'react';
import { useMap } from '@map-colonies/react-components';
import { MapEvent } from 'ol';

import './ol-map.loader.css';

interface MapLoadingIndicatorProps {}

export const MapLoadingIndicator: React.FC<MapLoadingIndicatorProps> = () => {
  const mapOl = useMap();

  useEffect(() => {
    const handleLoadStartEvent = (e: MapEvent): void => {
      mapOl.getTargetElement().classList.add('olSpinner');
    };
    mapOl.on('loadstart', handleLoadStartEvent);

    const handleLoadEndEvent = (e: MapEvent): void => {
      mapOl.getTargetElement().classList.remove('olSpinner');
    };
    mapOl.on('loadend', handleLoadEndEvent);

    return (): void => {
      try {
        mapOl.un('loadstart', handleLoadStartEvent);
        mapOl.un('loadend', handleLoadEndEvent);
      } catch (e) {
        console.log('OL loading events remove listener failed', e);
      }
    };
  }, []);

  return <></>;
};
