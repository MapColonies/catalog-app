import React, { useCallback, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { BasemapModelType } from '../../models/BasemapModel';
import { useStore } from '../../models/RootStore';
import { useMapViewer } from '../map-container/cesium-map-viewer.bridge';
import { addBasemapLayerToMap } from './basemap-map-layers.utils';

const useBasemapMapLayers = (): {
  rebuild: (basemap: BasemapModelType | undefined) => void;
  remove: () => void;
} => {
  const mapViewer = useMapViewer();
  const addedLayerIds = useRef<string[]>([]);

  const remove = useCallback((): void => {
    addedLayerIds.current.forEach((id) => {
      mapViewer?.layersManager?.removeLayer(id);
    });
    addedLayerIds.current = [];
  }, [mapViewer]);

  // Removes everything previously added and adds the basemap's layers from scratch.
  const rebuild = useCallback(
    (basemap: BasemapModelType | undefined): void => {
      remove();
      const layersManager = mapViewer?.layersManager;
      if (layersManager === undefined) {
        return;
      }
      (basemap?.layers ?? []).forEach((basemapLayer) => {
        const layerId = addBasemapLayerToMap(layersManager, basemapLayer, {
          parentBaseMapId: basemap?.id,
        });
        if (layerId !== undefined) {
          addedLayerIds.current.push(layerId);
        }
      });
    },
    [mapViewer, remove]
  );

  return { rebuild, remove };
};

export const BasemapViewer: React.FC = observer(() => {
  const store = useStore();
  const { rebuild, remove } = useBasemapMapLayers();

  useEffect(() => {
    return remove;
  }, [remove]);

  useEffect(() => {
    rebuild(store.basemapsStore.shownBasemap);
  }, [rebuild, store.basemapsStore.shownBasemap]);

  return null;
});
