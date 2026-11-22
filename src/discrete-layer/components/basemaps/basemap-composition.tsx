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

type BasemapLayer = NonNullable<BasemapModelType['layers']>[number];

const stripOrderAndOpacity = (layers: BasemapModelType['layers']): unknown[] => {
  const strippedLayers = (layers ?? []).map(({ order, opacity, ...layer }) => {
    return layer;
  });
  return sortBy(strippedLayers, 'id');
};

const isOnlyOrderOrOpacityChanged = (
  previous: BasemapModelType | undefined,
  next: BasemapModelType | undefined
): boolean => {
  return (
    previous !== undefined &&
    next !== undefined &&
    previous.id === next.id &&
    isEqual(stripOrderAndOpacity(previous.layers), stripOrderAndOpacity(next.layers))
  );
};

const sortLayersByOrder = (layers: BasemapModelType['layers']): BasemapLayer[] => {
  const direction = 'asc';
  const sign = direction === 'asc' ? 1 : -1;
  return (layers ?? []).slice().sort((curr, next) => {
    return sign * ((curr.order ?? 0) - (next.order ?? 0));
  });
};

const buildLayerMetadata = (
  rasterLayerId: string,
  basemapLayer: BasemapLayer
): Record<string, unknown> => {
  return {
    id: rasterLayerId,
    searchLayerPredicate: (cesiumLayer: ICesiumImageryLayer): boolean => {
      return cesiumLayer.meta?.id === rasterLayerId;
    },
    ...(isResolvedCatalogSource(basemapLayer.source) && {
      layerRecord: {
        ...basemapLayer.source.layer,
        links: getLinksArrWithTokens([...(basemapLayer.source.layer.links as LinkModelType[])]),
      },
    }),
  };
};

export const BasemapComposition: React.FC = observer(() => {
  const mapViewer = useCesiumMap();
  const store = useStore();
  const renderedBasemap = useRef<BasemapModelType>();
  const addedLayerIds = useRef<string[]>([]);
  // Layers get `meta` (context menu + reorder) only in edit mode, so switching modes needs a rebuild.
  const renderedWithMeta = useRef(false);

  const removeAddedLayers = (): void => {
    addedLayerIds.current.forEach((id) => {
      mapViewer.layersManager?.removeLayer(id);
    });
    addedLayerIds.current = [];
  };

  // Layers already on the map: only sync opacity and stacking order.
  const updateLayersOrderAndOpacity = (basemap: BasemapModelType): void => {
    const addedLayers = sortLayersByOrder(basemap.layers).filter((layer) => {
      return addedLayerIds.current.includes(layer.id as string);
    });
    addedLayers.forEach((layer) => {
      mapViewer.layersManager?.setLayerOpacity(layer.id as string, layer.opacity as number);
    });
    mapViewer.layersManager?.setLayersOrder(
      addedLayers.map((layer) => {
        return layer.id as string;
      })
    );
  };

  // Remove everything previously added and add the basemap layers from scratch.
  const rebuildLayers = (basemap: BasemapModelType | undefined, withMeta: boolean): void => {
    removeAddedLayers();
    sortLayersByOrder(basemap?.layers).forEach((basemapLayer) => {
      const rasterLayer = buildRasterLayerFromBasemapLayer(basemapLayer);
      if (rasterLayer === undefined) {
        return;
      }
      mapViewer.layersManager?.addRasterLayer(rasterLayer, mapViewer.imageryLayers.length, '');
      if (withMeta) {
        const layerMetadata = buildLayerMetadata(rasterLayer.id, basemapLayer);
        mapViewer.layersManager?.addMetaToLayer(
          layerMetadata,
          layerMetadata.searchLayerPredicate as never
        );
      }
      addedLayerIds.current.push(rasterLayer.id);
    });
  };

  // The store is the only writer of the layers order, the map just renders it.
  useEffect(() => {
    return (): void => {
      removeAddedLayers();
      renderedBasemap.current = undefined;
      renderedWithMeta.current = false;
    };
  }, [mapViewer, store.basemapsStore]);

  // Render the displayed basemap on the map.
  useEffect(() => {
    const basemap = store.basemapsStore.displayedBasemap;
    const isEditMode = store.basemapsStore.draftBasemap !== undefined;
    if (
      basemap !== undefined &&
      renderedWithMeta.current === isEditMode &&
      isOnlyOrderOrOpacityChanged(renderedBasemap.current, basemap)
    ) {
      updateLayersOrderAndOpacity(basemap);
    } else {
      rebuildLayers(basemap, isEditMode);
      renderedWithMeta.current = isEditMode;
    }
    renderedBasemap.current = basemap;
  }, [mapViewer, store.basemapsStore.displayedBasemap]);

  return null;
});
