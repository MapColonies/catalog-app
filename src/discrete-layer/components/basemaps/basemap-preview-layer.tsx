import React, { useEffect } from 'react';
import { Geometry } from 'geojson';
import { observer } from 'mobx-react-lite';
import { ICesiumImageryLayer, useCesiumMap } from '@map-colonies/react-components';
import { useStore } from '../../models/RootStore';
import { LinkModelType } from '../../models';
import { buildRasterLayerFromBasemapLayer } from '../helpers/basemapLayerUtils';
import { getLinksArrWithTokens } from '../helpers/layersUtils';

// EXTERNAL basemap layers have no catalog record, hence no real footprint.
// findLayerByPOI (used by the map's right-click layer menu) drops any layer
// without one, so a world-covering dummy keeps these clickable everywhere.
const WORLD_FOOTPRINT: Geometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-180, -90],
      [180, -90],
      [180, 90],
      [-180, 90],
      [-180, -90],
    ],
  ],
};

export const BasemapPreviewLayer: React.FC = observer(() => {
  const mapViewer = useCesiumMap();
  const store = useStore();
  const { basemapsStore, discreteLayersStore } = store;

  useEffect(() => {
    const layerManager = mapViewer.layersManager;
    const basemap = basemapsStore.shownBasemap;
    const addedLayerIds: string[] = [];

    if (basemap !== undefined) {
      basemap.layers
        .slice()
        .sort((curr, next) => curr.order - next.order)
        .forEach((basemapLayer, index) => {
          const rasterLayer = buildRasterLayerFromBasemapLayer(
            basemapLayer,
            discreteLayersStore.capabilities
          );
          if (rasterLayer !== undefined) {
            const layerMetadata = {
              id: rasterLayer.id,
              searchLayerPredicate: (cesiumLayer: ICesiumImageryLayer): boolean =>
                cesiumLayer.meta?.id === rasterLayer.id,
              ...(basemapLayer.source.type === 'RASTER_RESOLVED_RESOURCE'
                ? {
                    layerRecord: {
                      ...basemapLayer.source.layer,
                      links: getLinksArrWithTokens([
                        ...(basemapLayer.source.layer.links as LinkModelType[]),
                      ]),
                    },
                  }
                : {
                    layerRecord: {
                      footprint: WORLD_FOOTPRINT,
                    },
                  }),
            };

            // empty parentId: a non-empty one tags the layer's meta with
            // `parentBaseMapId`, which the library's Active Layers panel reads
            // via `isBaseMapLayer` to gray out / disable the entry.
            layerManager?.addRasterLayer(rasterLayer, index, '');
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
    basemapsStore.shownBasemapId,
    basemapsStore.basemaps,
    discreteLayersStore.capabilities,
  ]);

  return null;
});
