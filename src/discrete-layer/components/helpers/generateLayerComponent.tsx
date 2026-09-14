import React from 'react';
import { get } from 'lodash';
import {
  Cesium3DTileset,
  CesiumWFSLayer,
  CesiumWMTSLayer,
  CesiumXYZLayer,
  getImageryProviderUrl,
  ICesiumImageryLayer,
  ILayerManagerMetaMapping,
  isBaseMapLayer,
} from '@map-colonies/react-components';
import CONFIG from '../../../common/config';
import { LinkType } from '../../../common/models/link-type.enum';
import { ILayerImage } from '../../models/layerImage';
import { Layer3DRecordModelType, LayerRasterRecordModelType, LinkModelType } from '../../models';
import { CapabilityModelType } from '../../models/CapabilityModel';
import { getLayerLink, getLinksArrWithTokens } from './layersUtils';
import { generateLayerRectangle, getTokenResource, getCesiumWMTSOptions } from './cesiumUtils';

type SearchLayerPredicate = (layer: ICesiumImageryLayer, idx: number) => boolean;

/**
 * Shared across every `<CesiumMap>` instance that renders layers via {@link generateLayerComponent}
 * (the main map and any isolated preview map, e.g. Links Management's embedded live map) — the
 * shape only depends on the `ILayerImage`/`layerRecord` fields, not on which viewer it's used in.
 */
export const DEFAULT_LAYER_MANAGER_META_MAPPING: ILayerManagerMetaMapping = {
  layer: {
    id: 'id',
    name: 'layerRecord.productName',
    footprint: 'layerRecord.footprint',
  },
  dataLayer: {
    name: 'layerRecord.featureStructure.aliasLayerName',
    fields: 'layerRecord.featureStructure.fields',
  },
};

const getUrlWithoutQueryParams = (url?: string): string | undefined => {
  if (!url) {
    return undefined;
  }
  return url.split('?')[0];
};

/**
 * Builds the Cesium layer component for a single layer record, keyed off its link protocol.
 * Pure function of the layer (plus WMTS capability lookups) — safe to render into any
 * `<CesiumMap>` instance, not just the app's main map.
 */
export const generateLayerComponent = (
  layer: ILayerImage,
  capabilities?: CapabilityModelType[]
): JSX.Element | undefined => {
  const layerLink = getLayerLink(layer);

  switch (layerLink.protocol) {
    case LinkType.XYZ_LAYER:
      return (
        <CesiumXYZLayer
          key={layer.id}
          meta={{
            id: layer.id,
            searchLayerPredicate: ((cesiumLayer, idx) => {
              const correctLinkByProtocol = (layer.links as LinkModelType[]).find(
                (link) => link.protocol === layerLink.protocol
              );
              const linkUrl = getUrlWithoutQueryParams(correctLinkByProtocol?.url);
              const cesiumLayerLinkUrl = getUrlWithoutQueryParams(
                getImageryProviderUrl(cesiumLayer)
              );
              if (!linkUrl || !cesiumLayerLinkUrl) {
                return false;
              }
              return linkUrl === cesiumLayerLinkUrl;
            }) as SearchLayerPredicate,
            layerRecord: {
              ...layer,
              links: getLinksArrWithTokens([...(layer.links as LinkModelType[])]),
            } as ILayerImage,
          }}
          rectangle={generateLayerRectangle(layer as LayerRasterRecordModelType)}
          options={{ url: getTokenResource(layerLink.url as string) }}
        />
      );
    case LinkType.THREE_D_TILES:
    case LinkType.THREE_D_LAYER:
      return (
        <Cesium3DTileset
          maximumScreenSpaceError={CONFIG.THREE_D_LAYER.MAXIMUM_SCREEN_SPACE_ERROR}
          cullRequestsWhileMovingMultiplier={
            CONFIG.THREE_D_LAYER.CULL_REQUESTS_WHILE_MOVING_MULTIPLIER
          }
          preloadFlightDestinations
          preferLeaves
          skipLevelOfDetail
          key={layer.id}
          url={getTokenResource(
            layerLink.url as string,
            (layer as Layer3DRecordModelType).productVersion as string
          )}
          meta={{
            id: layer.id,
            layerRecord: { ...layer },
          }}
        />
      );
    case LinkType.WMTS_LAYER:
    case LinkType.WMTS: {
      const capability = capabilities?.find((item) => layerLink.name === item.id);
      const optionsWMTS = {
        ...getCesiumWMTSOptions(
          layer as LayerRasterRecordModelType,
          layerLink.url as string,
          capability
        ),
      };
      return (
        <CesiumWMTSLayer
          key={layer.id}
          meta={{
            id: layer.id,
            searchLayerPredicate: ((cesiumLayer, idx) => {
              const linkUrl = getUrlWithoutQueryParams(
                get(optionsWMTS, 'url._url') as string | undefined
              );
              const cesiumLayerLinkUrl = getUrlWithoutQueryParams(
                getImageryProviderUrl(cesiumLayer)
              );
              if (!linkUrl || !cesiumLayerLinkUrl) {
                return false;
              }
              const isLayerFound =
                linkUrl === cesiumLayerLinkUrl && !isBaseMapLayer(cesiumLayer.meta);
              return isLayerFound;
            }) as SearchLayerPredicate,
            layerRecord: {
              ...layer,
              links: getLinksArrWithTokens([...(layer.links as LinkModelType[])]),
            } as ILayerImage,
          }}
          rectangle={generateLayerRectangle(layer as LayerRasterRecordModelType)}
          options={optionsWMTS}
        />
      );
    }
    case LinkType.WFS: {
      const options = {
        url: layerLink.url ?? '',
        featureType: layerLink.name ?? '',
        style: CONFIG.WFS.STYLE,
        pageSize: CONFIG.WFS.MAX.PAGE_SIZE,
        zoomLevel: CONFIG.WFS.MAX.ZOOM_LEVEL,
        maxCacheSize: CONFIG.WFS.MAX.CACHE_SIZE,
        keyField: CONFIG.WFS.KEY_FIELD,
      };
      return (
        <CesiumWFSLayer
          key={layer.id}
          options={options}
          meta={{
            id: layer.id,
            layerRecord: {
              ...layer,
            },
          }}
          withGeometryValidation
        />
      );
    }
    default:
      return undefined;
  }
};
