import React, { useEffect, useSyncExternalStore } from 'react';
import { CesiumViewer, useCesiumMap } from '@map-colonies/react-components';

// The map and the panels that need it live in sibling React subtrees,
// so the viewer is published through a module-level holder.
let mainMapViewer: CesiumViewer | undefined;
const listeners = new Set<() => void>();

const setMapViewer = (viewer: CesiumViewer | undefined): void => {
  mainMapViewer = viewer;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return (): void => {
    listeners.delete(listener);
  };
};

const getMapViewer = (): CesiumViewer | undefined => mainMapViewer;

export const useMapViewer = (): CesiumViewer | undefined =>
  useSyncExternalStore(subscribe, getMapViewer);

export const MapViewerBridge: React.FC = () => {
  const mapViewer = useCesiumMap();
  useEffect(() => {
    setMapViewer(mapViewer);
    return (): void => {
      if (mainMapViewer === mapViewer) {
        setMapViewer(undefined);
      }
    };
  }, [mapViewer]);
  return null;
};
