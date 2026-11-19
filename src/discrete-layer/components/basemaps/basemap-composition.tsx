import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { isEqual, sortBy } from 'lodash';
import { ICesiumImageryLayer, useCesiumMap } from '@map-colonies/react-components';
import { useStore } from '../../models/RootStore';
import { LinkModelType } from '../../models';
import { BasemapModelType } from '../../models/BasemapModel';
import {
  buildRasterLayerFromBasemapLayer,
  isResolvedCatalogSource,
} from '../helpers/basemapLayerUtils';
import { getLinksArrWithTokens } from '../helpers/layersUtils';

export const BasemapComposition: React.FC = observer(() => {
  const mapViewer = useCesiumMap();
  const store = useStore();
  const renderedBasemap = useRef<BasemapModelType>();
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
          (previous.layers ?? []).map(({ order, opacity, ...layer }) => layer),
          'id'
        ),
        sortBy(
          (basemap.layers ?? []).map(({ order, opacity, ...layer }) => layer),
          'id'
        )
      );

    isUpdatingMap.current = true;
    try {
      if (onlyOrderOrOpacityChanged && basemap !== undefined) {
        (basemap.layers ?? [])
          .slice()
          .sort((curr, next) => (next.order ?? 0) - (curr.order ?? 0))
          .filter((layer) => addedLayerIds.current.includes(layer.id as string))
          .forEach((layer) => {
            const imageryLayer = layerManager?.get(layer.id as string);
            if (imageryLayer !== undefined) {
              imageryLayer.alpha = layer.opacity as number;
              mapViewer.imageryLayers.lowerToBottom(imageryLayer);
            }
          });
        renderedBasemap.current = basemap;
        return;
      }

      addedLayerIds.current.forEach((id) => layerManager?.removeLayer(id));
      addedLayerIds.current = [];
      if (basemap !== undefined) {
        (basemap.layers ?? [])
          .slice()
          .sort((curr, next) => (curr.order ?? 0) - (next.order ?? 0))
          .forEach((basemapLayer) => {
            const isResolvedCatalogResource = isResolvedCatalogSource(basemapLayer.source);
            const rasterLayer = buildRasterLayerFromBasemapLayer(basemapLayer);
            if (rasterLayer !== undefined) {
              const layerMetadata = {
                id: rasterLayer.id,
                searchLayerPredicate: (cesiumLayer: ICesiumImageryLayer): boolean =>
                  cesiumLayer.meta?.id === rasterLayer.id,
                ...(isResolvedCatalogResource && {
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
