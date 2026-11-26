import type { CesiumViewer, ICesiumImageryLayer } from '@map-colonies/react-components';
import { BasemapLayerModelType } from '../../models/BasemapLayerModel';
import { BasemapLayerInput } from '../../models/RootStore.base';
import {
  BasemapLayerSource,
  buildRasterLayerFromBasemapLayer,
  isExternalSource,
} from '../helpers/basemapLayerUtils';

// Marks a map layer as part of the basemap being composed. Deliberately not `parentBaseMapId`: the layers
// manager treats any layer carrying it as a base map layer (excluded from order events, removed by
// `removeBaseMapLayers`, ...), which composer layers must not be.
export const COMPOSER_META_KEY = 'basemapComposer';

export type LayersManager = NonNullable<CesiumViewer['layersManager']>;

export type ComposerLayerSource = BasemapLayerInput['source'];

// Kept under `COMPOSER_META_KEY`: `id` is the composer the layer belongs to, `source` is what
// `BasemapLayerInput.source` needs on save, kept next to the layer on the map.
export interface IComposerMeta {
  id: string;
  source: ComposerLayerSource;
}

const toLayerSource = (source: BasemapLayerSource | undefined): ComposerLayerSource => {
  if (isExternalSource(source)) {
    return { type: source.type, details: source.details } as ComposerLayerSource;
  }
  return {
    type: source?.type,
    domain: source?.domain,
    uniqueness: source?.uniqueness,
  } as ComposerLayerSource;
};

const buildLayerMetadata = (
  composerId: string,
  rasterLayerId: string,
  basemapLayer: BasemapLayerModelType
): Record<string, unknown> => {
  return {
    id: rasterLayerId,
    searchLayerPredicate: (cesiumLayer: ICesiumImageryLayer): boolean => {
      return cesiumLayer.meta?.id === rasterLayerId;
    },
    [COMPOSER_META_KEY]: {
      id: composerId,
      source: toLayerSource(basemapLayer.source as BasemapLayerSource | undefined),
    } as IComposerMeta,
  };
};

export interface IAddBasemapLayerOptions {
  /** The basemap being composed: the layer gets the composer meta. Not combined with `parentBaseMapId`. */
  composerId?: string;
  /** The basemap being viewed: the layer is marked as a base map layer of it (`meta.parentBaseMapId`). */
  parentBaseMapId?: string;
}

/**
 * Adds a basemap layer to the map. With `composerId` the layer also gets the composer meta (context menu,
 * reorder, and what is needed to save it); with `parentBaseMapId` it is a plain base map layer of the viewed
 * basemap. Composer layers deliberately are not base map layers, see `COMPOSER_META_KEY`.
 */
export const addBasemapLayerToMap = (
  layersManager: LayersManager,
  basemapLayer: BasemapLayerModelType,
  { composerId, parentBaseMapId = '' }: IAddBasemapLayerOptions = {}
): string | undefined => {
  const rasterLayer = buildRasterLayerFromBasemapLayer(basemapLayer);
  if (rasterLayer === undefined) {
    return undefined;
  }
  layersManager.addRasterLayer(rasterLayer, layersManager.layerList.length, parentBaseMapId);
  if (composerId !== undefined) {
    const layerMetadata = buildLayerMetadata(composerId, rasterLayer.id, basemapLayer);
    layersManager.addMetaToLayer(layerMetadata, layerMetadata.searchLayerPredicate as never);
  }
  return rasterLayer.id;
};
