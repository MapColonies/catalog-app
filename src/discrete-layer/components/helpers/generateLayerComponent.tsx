import React from 'react';
import { get } from 'lodash';
import {
  Cesium3DTileset,
  CesiumWFSLayer,
  CesiumWMSLayer,
  CesiumWMTSLayer,
  CesiumXYZLayer,
  getImageryProviderUrl,
  ICesiumImageryLayer,
  ILayerManagerMetaMapping,
  isBaseMapLayer,
} from '@map-colonies/react-components';
import {
  adaptToCesiumWmsOptions,
  adaptToCesiumXyzOptions,
} from '@map-colonies/react-components/bridge';
import CONFIG from '../../../common/config';
import { ProtocolType } from '../../../common/models/protocol-type.enum';
import { Layer3DRecordModelType, LayerRasterRecordModelType, LinkModelType } from '../../models';
import { CapabilityModelType } from '../../models/CapabilityModel';
import { ILayerImage } from '../../models/layerImage';
import { CopcWithInfoBox } from '../map-container/copc-with-infobox.component';
import {
  degreesToCesiumRectangle,
  generateLayerRectangle,
  generateLayerRectangleDeg,
  getCesiumWMTSOptions,
  getInjectedAuth,
  getTokenResource,
} from './cesiumUtils';
import { getLayerLink, getLinksArrWithTokens } from './layersUtils';

type SearchLayerPredicate = (layer: ICesiumImageryLayer, idx: number) => boolean;

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

const getImageryLayerMeta = (layer: ILayerImage, layerLink: LinkModelType) => ({
  id: layer.id,
  searchLayerPredicate: ((cesiumLayer, idx) => {
    const correctLinkByProtocol = (layer.links as LinkModelType[]).find(
      (link) => link.protocol === layerLink.protocol
    );
    const linkUrl = getUrlWithoutQueryParams(correctLinkByProtocol?.url);
    const cesiumLayerLinkUrl = getUrlWithoutQueryParams(getImageryProviderUrl(cesiumLayer));
    if (!linkUrl || !cesiumLayerLinkUrl) {
      return false;
    }
    return linkUrl === cesiumLayerLinkUrl;
  }) as SearchLayerPredicate,
  layerRecord: {
    ...layer,
    links: getLinksArrWithTokens([...(layer.links as LinkModelType[])]),
  } as ILayerImage,
});

export interface IGenerateLayerComponentOptions {
  autoZoomTo3D?: boolean;
}

export const generateLayerComponent = (
  layer: ILayerImage,
  capabilities?: CapabilityModelType[],
  options?: IGenerateLayerComponentOptions
): JSX.Element | undefined => {
  const layerLink = getLayerLink(layer);

  switch (layerLink.protocol) {
    case ProtocolType.XYZ: {
      const rectangle = generateLayerRectangleDeg(layer as LayerRasterRecordModelType);
      return (
        <CesiumXYZLayer
          key={layer.id}
          meta={getImageryLayerMeta(layer, layerLink)}
          rectangle={degreesToCesiumRectangle(rectangle)}
          options={adaptToCesiumXyzOptions(
            { url: layerLink.url as string, rectangle },
            getInjectedAuth()
          )}
        />
      );
    }
    case ProtocolType.WMS: {
      const rectangle = generateLayerRectangleDeg(layer as LayerRasterRecordModelType);
      return (
        <CesiumWMSLayer
          key={layer.id}
          meta={getImageryLayerMeta(layer, layerLink)}
          rectangle={degreesToCesiumRectangle(rectangle)}
          options={adaptToCesiumWmsOptions(
            { url: layerLink.url as string, layers: layerLink.name as string, rectangle },
            getInjectedAuth()
          )}
        />
      );
    }
    case ProtocolType.THREE_D_TILES:
      return (
        <Cesium3DTileset
          maximumScreenSpaceError={CONFIG.THREE_D_LAYER.MAXIMUM_SCREEN_SPACE_ERROR}
          cullRequestsWhileMovingMultiplier={
            CONFIG.THREE_D_LAYER.CULL_REQUESTS_WHILE_MOVING_MULTIPLIER
          }
          preloadFlightDestinations
          preferLeaves
          skipLevelOfDetail
          isZoomTo={options?.autoZoomTo3D}
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
    case ProtocolType.COPC:
      return (
        <CopcWithInfoBox
          infoBoxTitle={layer.productName as string}
          key={layer.id}
          url={layerLink.url as string}
          colorMode="classification"
          meta={{
            id: layer.id,
            layerRecord: { ...layer },
          }}
          hoverPixelSize={14}
          extraDimensions="*"
        ></CopcWithInfoBox>
      );
    case ProtocolType.WMTS: {
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
    case ProtocolType.WFS: {
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
