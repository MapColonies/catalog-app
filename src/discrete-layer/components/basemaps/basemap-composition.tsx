import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { ICesiumImageryLayer, useCesiumMap } from '@map-colonies/react-components';
import { useStore } from '../../models/RootStore';
import { LinkModelType } from '../../models';
import { buildRasterLayerFromBasemapLayer } from '../helpers/basemapLayerUtils';
import { getLinksArrWithTokens } from '../helpers/layersUtils';

export const BasemapComposition: React.FC = observer(() => {
  const mapViewer = useCesiumMap();
  const store = useStore();

  useEffect(() => {
    const layerManager = mapViewer.layersManager;
    const basemap = store.basemapsStore.shownBasemap;
    const addedLayerIds: string[] = [];

    if (basemap !== undefined) {
      basemap.layers
        .slice()
        .sort((curr, next) => curr.order - next.order)
        .forEach((basemapLayer) => {
          const rasterLayer = buildRasterLayerFromBasemapLayer(
            basemapLayer,
            basemapLayer.source.type === 'RASTER_RESOLVED_RESOURCE'
              ? store.basemapsStore.getLayerCapability(basemapLayer.source.layer)
              : undefined
          );
          if (rasterLayer !== undefined) {
            const layerMetadata = {
              id: rasterLayer.id,
              searchLayerPredicate: (cesiumLayer: ICesiumImageryLayer): boolean =>
                cesiumLayer.meta?.id === rasterLayer.id,
              ...(basemapLayer.source.type === 'RASTER_RESOLVED_RESOURCE' && {
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
            addedLayerIds.push(rasterLayer.id);
          }
        });
    }

    return (): void => {
      addedLayerIds.forEach((id) => layerManager?.removeLayer(id));
    };
  }, [
    mapViewer,
    store.basemapsStore.shownBasemapId,
    store.basemapsStore.basemaps,
    store.basemapsStore.capabilities,
  ]);

  return null;
});
