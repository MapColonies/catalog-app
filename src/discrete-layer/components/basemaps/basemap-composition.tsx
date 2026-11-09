import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { isEqual, sortBy } from 'lodash';
import { ICesiumImageryLayer, useCesiumMap } from '@map-colonies/react-components';
import { useStore } from '../../models/RootStore';
import { LinkModelType } from '../../models';
import {
  buildRasterLayerFromBasemapLayer,
  isResolvedCatalogSource,
} from '../helpers/basemapLayerUtils';
import { getLinksArrWithTokens } from '../helpers/layersUtils';
import { BasemapOutput } from './XXXbasemapMockXXX';

export const BasemapComposition: React.FC = observer(() => {
  const mapViewer = useCesiumMap();
  const store = useStore();
  const renderedBasemap = useRef<BasemapOutput>();
  const addedLayerIds = useRef<string[]>([]);
  const isUpdatingMap = useRef(false);

  useEffect(() => {
    const removeListener = mapViewer.imageryLayers.layerMoved.addEventListener(() => {
      if (isUpdatingMap.current) {
        return;
      }
      const layerIds: string[] = [];
      for (let index = 0; index < mapViewer.imageryLayers.length; index++) {
        const layer = mapViewer.imageryLayers.get(index) as ICesiumImageryLayer;
        if (layer.meta?.id !== undefined) {
          layerIds.push(layer.meta.id);
        }
      }
      store.basemapsStore.syncDraftLayerOrder(layerIds);
    });
    return (): void => {
      removeListener();
      addedLayerIds.current.forEach((id) => mapViewer.layersManager?.removeLayer(id));
      addedLayerIds.current = [];
      renderedBasemap.current = undefined;
    };
  }, [mapViewer, store.basemapsStore]);

  useEffect(() => {
    const layerManager = mapViewer.layersManager;
    const basemap = store.basemapsStore.displayedBasemap;
    const previous = renderedBasemap.current;
    const onlyOrderOrOpacityChanged =
      previous !== undefined &&
      basemap !== undefined &&
      previous.id === basemap.id &&
      isEqual(
        sortBy(
          previous.layers.map(({ order, opacity, ...layer }) => layer),
          'id'
        ),
        sortBy(
          basemap.layers.map(({ order, opacity, ...layer }) => layer),
          'id'
        )
      );

    isUpdatingMap.current = true;
    try {
      if (onlyOrderOrOpacityChanged) {
        basemap.layers
          .slice()
          .sort((curr, next) => next.order - curr.order)
          .filter((layer) => addedLayerIds.current.includes(layer.id))
          .forEach((layer) => {
            const imageryLayer = layerManager?.get(layer.id);
            if (imageryLayer !== undefined) {
              imageryLayer.alpha = layer.opacity;
              mapViewer.imageryLayers.lowerToBottom(imageryLayer);
            }
          });
        renderedBasemap.current = basemap;
        return;
      }

      addedLayerIds.current.forEach((id) => layerManager?.removeLayer(id));
      addedLayerIds.current = [];
      if (basemap !== undefined) {
        basemap.layers
          .slice()
          .sort((curr, next) => curr.order - next.order)
          .forEach((basemapLayer) => {
            const rasterLayer = buildRasterLayerFromBasemapLayer(basemapLayer);
            if (rasterLayer !== undefined) {
              const layerMetadata = {
                id: rasterLayer.id,
                searchLayerPredicate: (cesiumLayer: ICesiumImageryLayer): boolean =>
                  cesiumLayer.meta?.id === rasterLayer.id,
                ...(isResolvedCatalogSource(basemapLayer.source) && {
                  layerRecord: {
                    ...basemapLayer.source.layer,
                    links: getLinksArrWithTokens([
                      ...(basemapLayer.source.layer.links as LinkModelType[]),
                    ]),
                  },
                }),
              };

              layerManager?.addRasterLayer(rasterLayer, mapViewer.imageryLayers.length, '');
              layerManager?.addMetaToLayer(layerMetadata, layerMetadata.searchLayerPredicate);
              addedLayerIds.current.push(rasterLayer.id);
            }
          });
      }
      renderedBasemap.current = basemap;
    } finally {
      isUpdatingMap.current = false;
    }
  }, [
    mapViewer,
    store.basemapsStore.shownBasemapId,
    store.basemapsStore.draftBasemap,
    store.basemapsStore.basemaps,
  ]);

  return null;
});
