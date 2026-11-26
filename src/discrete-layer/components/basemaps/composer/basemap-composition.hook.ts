import { useCallback, useEffect, useState } from 'react';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import type { ICesiumImageryLayer } from '@map-colonies/react-components';
import { Domain } from '../../../../common/models/domain';
import { BasemapLayerModelType } from '../../../models/BasemapLayerModel';
import { BasemapLayerInput } from '../../../models/RootStore.base';
import { CapabilityModelType } from '../../../models/CapabilityModel';
import { LayerRasterRecordModelType } from '../../../models/LayerRasterRecordModel';
import { LayerMetadataMixedUnion } from '../../../models/LayerMetadataMixedModelSelector';
import { RecordType } from '../../../models/RecordTypeEnum';
import { ResourceResolutionStatus } from '../../../models/ResourceResolutionStatusEnum';
import { useStore } from '../../../models/RootStore';
import { SourceType } from '../../../models/SourceTypeEnum';
import { getLayerLink } from '../../helpers/layersUtils';
import {
  addBasemapLayerToMap,
  COMPOSER_META_KEY,
  ComposerLayerSource,
  IComposerMeta,
  LayersManager,
} from '../basemap-map-layers.utils';
import { useMapViewer } from '../../map-container/cesium-map-viewer.bridge';

export interface ComposerLayer {
  id: string;
  name: string;
  sourceType: SourceType;
  opacity: number;
  isUnresolved: boolean;
}

const getComposerMeta = (layer: ICesiumImageryLayer): IComposerMeta | undefined => {
  return layer.meta?.[COMPOSER_META_KEY] as IComposerMeta | undefined;
};

const getComposerLayers = (
  layersManager: LayersManager | undefined,
  composerId: string | undefined
): ICesiumImageryLayer[] => {
  if (layersManager === undefined || composerId === undefined) {
    return [];
  }
  return layersManager.layerList.filter((layer) => {
    return getComposerMeta(layer)?.id === composerId;
  });
};

const toComposerLayer = (layer: ICesiumImageryLayer): ComposerLayer => {
  const source = getComposerMeta(layer)?.source;
  const layerRecord = layer.meta?.layerRecord as LayerRasterRecordModelType | undefined;
  const id = layer.meta?.id as string;
  const isExternal = source?.type === SourceType.EXTERNAL;
  // a catalog layer without a record is the hidden placeholder of an unresolved one
  const isUnresolved = source?.type === SourceType.CATALOG_RESOURCE && layerRecord === undefined;
  const details = source?.details as { name?: string } | undefined;
  return {
    id,
    name:
      (isExternal ? details?.name : layerRecord?.productName ?? source?.uniqueness?.productId) ??
      id,
    sourceType: source?.type as SourceType,
    opacity: layer.alpha,
    isUnresolved,
  };
};

/**
 * Puts the saved layers of the composed basemap on the map, tagged as composer layers - from then on the map is
 * where the edits happen. Call it once, from the composer panel: edits do not re-run it, only a new saved version.
 */
export const useLoadComposedBasemap = (): void => {
  const store = useStore();
  const mapViewer = useMapViewer();
  const layersManager = mapViewer?.layersManager;
  const composerId = store.basemapsStore.composingBasemapId;
  const savedBasemap = store.basemapsStore.composingBasemap;

  useEffect(() => {
    if (layersManager === undefined || composerId === undefined) {
      return;
    }
    (savedBasemap?.layers ?? []).forEach((basemapLayer) => {
      addBasemapLayerToMap(layersManager, basemapLayer, { composerId });
    });
    return (): void => {
      getComposerLayers(layersManager, composerId).forEach((layer) => {
        layersManager.removeLayer(layer.meta?.id as string);
      });
    };
  }, [layersManager, composerId, savedBasemap]);
};

export const useBasemapComposition = (): {
  layers: ComposerLayer[];
  addLayers: (layers: LayerMetadataMixedUnion[]) => Promise<void>;
  removeLayer: (layerId: string) => void;
  setOpacity: (layerId: string, opacity: number) => void;
  moveLayer: (layerId: string, toIndex: number) => void;
  buildInput: () => BasemapLayerInput[];
  clear: () => void;
} => {
  const store = useStore();
  const mapViewer = useMapViewer();
  const layersManager = mapViewer?.layersManager;
  const composerId = store.basemapsStore.composingBasemapId;
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (layersManager === undefined) {
      return;
    }
    const refresh = (): void => {
      setVersion((version) => version + 1);
    };
    const removeListeners = [
      layersManager.layerUpdated.addEventListener(refresh),
      layersManager.layersOrderChanged.addEventListener(refresh),
      layersManager.layerRemoved.addEventListener(refresh),
      layersManager.layerOpacityChanged.addEventListener(refresh),
    ];
    refresh();
    return (): void => {
      removeListeners.forEach((removeListener) => {
        removeListener();
      });
    };
  }, [layersManager, composerId]);

  const composerLayers = getComposerLayers(layersManager, composerId);

  const addLayers = useCallback(
    async (layers: LayerMetadataMixedUnion[]): Promise<void> => {
      const rasterLayers = layers.filter((layer) => {
        return layer.type === RecordType.RECORD_RASTER;
      }) as LayerRasterRecordModelType[];
      if (layersManager === undefined || mapViewer === undefined || composerId === undefined) {
        return;
      }
      if (rasterLayers.length === 0) {
        return;
      }
      let capabilities: CapabilityModelType[] = [];
      try {
        capabilities = cloneDeep(
          (await store.catalogTreeStore.fetchLayersCapabilities(
            rasterLayers
          )) as CapabilityModelType[]
        );
      } catch (error) {
        console.error(error);
      }
      rasterLayers.forEach((layer) => {
        const basemapLayer = {
          id: uuidv4(),
          order: mapViewer.imageryLayers.length,
          opacity: 1,
          source: {
            __typename: 'CatalogResourceSource',
            type: SourceType.CATALOG_RESOURCE,
            domain: Domain.RASTER,
            status: ResourceResolutionStatus.RESOLVED,
            uniqueness: {
              productId: layer.productId,
              productType: layer.productType,
            },
            capabilities:
              capabilities.find((capability) => {
                return capability.id === getLayerLink(layer)?.name;
              }) ?? null,
            layer: JSON.parse(JSON.stringify(layer)) as LayerRasterRecordModelType,
          },
        } as unknown as BasemapLayerModelType;
        addBasemapLayerToMap(layersManager, basemapLayer, { composerId });
      });
    },
    [layersManager, mapViewer, composerId, store.catalogTreeStore]
  );

  const removeLayer = useCallback(
    (layerId: string): void => {
      layersManager?.removeLayer(layerId);
    },
    [layersManager]
  );

  const setOpacity = useCallback(
    (layerId: string, opacity: number): void => {
      layersManager?.setLayerOpacity(layerId, opacity);
    },
    [layersManager]
  );

  // `toIndex` is a position in the composer layers list, bottom to top.
  const moveLayer = (layerId: string, toIndex: number): void => {
    const orderedIds = composerLayers.map((layer) => {
      return layer.meta?.id as string;
    });
    const fromIndex = orderedIds.indexOf(layerId);
    if (fromIndex < 0 || fromIndex === toIndex) {
      return;
    }
    orderedIds.splice(fromIndex, 1);
    orderedIds.splice(toIndex, 0, layerId);
    layersManager?.setLayersOrder(orderedIds);
  };

  const buildInput = (): BasemapLayerInput[] => {
    return composerLayers.map((layer, index) => {
      return {
        id: layer.meta?.id as string,
        order: index,
        opacity: layer.alpha,
        shouldBeUsedInModelDraping: layer.meta?.shouldBeUsedInModelDraping,
        source: getComposerMeta(layer)?.source as ComposerLayerSource,
      } as BasemapLayerInput;
    });
  };

  const clear = useCallback((): void => {
    getComposerLayers(layersManager, composerId).forEach((layer) => {
      layersManager?.removeLayer(layer.meta?.id as string);
    });
  }, [layersManager, composerId]);

  return {
    layers: composerLayers.map(toComposerLayer),
    addLayers,
    removeLayer,
    setOpacity,
    moveLayer,
    buildInput,
    clear,
  };
};
