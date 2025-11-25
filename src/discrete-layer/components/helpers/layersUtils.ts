import { Feature } from 'geojson';
import { get, isEmpty } from 'lodash';
import bbox from '@turf/bbox';
import area from '@turf/area';
import bboxPolygon from '@turf/bbox-polygon';
import booleanContains from '@turf/boolean-contains';
import {
  CesiumGeographicTilingScheme,
  CesiumRectangle,
  CesiumResource,
  RCesiumWMTSLayerOptions
} from '@map-colonies/react-components';
import CONFIG from '../../../common/config';
import { LinkType } from '../../../common/models/link-type.enum';
import {
  CapabilityModelType,
  LayerMetadataMixedUnion,
  LayerRasterRecordModelType,
  LinkModelType,
  StyleModelType,
  TileMatrixSetModelType
} from '../../models';
import { ILayerImage } from '../../models/layerImage';
import { ResourceUrlModelType } from '../../models/ResourceUrlModel';

const DEFAULT_RECTANGLE_FACTOR = 0.2;
const EARTH_AREA = 509000000; //whole EARTH surface, in square km

export const isPolygonContainedInLayer = (polygon: Feature, layer: LayerMetadataMixedUnion): boolean => {
  const layerFootprintBBox = bbox(layer.footprint);
  const layerFootprintBBoxPolygon = bboxPolygon(layerFootprintBBox);
  return booleanContains(layerFootprintBBoxPolygon, polygon);
};

export const generateLayerRectangle = (layer: LayerMetadataMixedUnion): CesiumRectangle => {
  // eslint-disable-next-line
  return CesiumRectangle.fromDegrees(...bbox(layer.footprint)) as CesiumRectangle;
};

export const applyFactor = (rect: CesiumRectangle, factor = DEFAULT_RECTANGLE_FACTOR) => {
  rect.east = rect.east + rect.width * factor;
  rect.west = rect.west - rect.width * factor;
  rect.south = rect.south - rect.height * factor;
  rect.north = rect.north + rect.height * factor;
}

export const generateFactoredLayerRectangle = (layer: LayerMetadataMixedUnion, factor = DEFAULT_RECTANGLE_FACTOR): CesiumRectangle => {
  const rectWithBuffers = generateLayerRectangle(layer);
  if (area({ type: 'Feature', properties:{}, geometry: layer.footprint})/1000000 > EARTH_AREA) {
    factor = 0;
  }
  applyFactor(rectWithBuffers, factor);
  return rectWithBuffers;
};

export const findLayerLink = (layer: ILayerImage): LinkModelType | undefined => {
  let wmtsLayer = layer.links?.find((link: LinkModelType) => [LinkType.WMTS_LAYER as string].includes(link.protocol as string)) as LinkModelType | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (wmtsLayer === undefined) {
    wmtsLayer = layer.links?.find((link: LinkModelType) => [LinkType.WMTS as string].includes(link.protocol as string)) as LinkModelType | undefined;
  }
  return wmtsLayer;
};

export const getLayerLink = (layer: ILayerImage): LinkModelType => {
  let layerLink = findLayerLink(layer);
  if (layerLink === undefined) {
    layerLink = get(layer, 'links[0]') as LinkModelType;
  }
  return layerLink;
};

export const getTokenParam = (): string => {
  // eslint-disable-next-line
  const {INJECTION_TYPE, ATTRIBUTE_NAME, TOKEN_VALUE} = CONFIG.ACCESS_TOKEN as {INJECTION_TYPE: string, ATTRIBUTE_NAME: string, TOKEN_VALUE: string};    
  if (INJECTION_TYPE && INJECTION_TYPE.toLowerCase() === 'queryparam') {
    return `?${ATTRIBUTE_NAME}=${TOKEN_VALUE}`;
  }
  return '';
};

export const getLinkUrl = (links: LinkModelType[], protocol: string): string | undefined => {
  return links.find((link: LinkModelType) => link.protocol === protocol)?.url;
};

export const getLinkUrlWithToken = (links: LinkModelType[], protocol?: string): string | undefined => {
  if (typeof links !== 'undefined') {
    // supporting a single link
    let linkUrl = links[0]?.url;
    // in case of a single link there is no need to find link by protocol
    if (typeof protocol !== 'undefined') {
      linkUrl = getLinkUrl(links, protocol);
    }
    const urlWithToken = `${linkUrl ?? ''}${linkUrl !== undefined ? getTokenParam() : ''}`;
    return !isEmpty(urlWithToken) ? urlWithToken : undefined;
  }
};

export const getLinksArrWithTokens = (links: LinkModelType[]): LinkModelType[] => {
  const linksWithTokens = links.map(link => {
    return {
      ...link,
      url: getLinkUrlWithToken([link])
    };
  });
  return linksWithTokens;
};

export const getTokenResource = (url: string, ver?: string): CesiumResource => {
  const tokenProps: Record<string, unknown> = { url };
  
  // eslint-disable-next-line
  const {INJECTION_TYPE, ATTRIBUTE_NAME, TOKEN_VALUE} = CONFIG.ACCESS_TOKEN as {INJECTION_TYPE: string, ATTRIBUTE_NAME: string, TOKEN_VALUE: string};
  
  if (INJECTION_TYPE && INJECTION_TYPE.toLowerCase() === 'header') {
    tokenProps.headers = {
      [ATTRIBUTE_NAME]: TOKEN_VALUE
    } as Record<string, unknown>;
  } else if (INJECTION_TYPE && INJECTION_TYPE.toLowerCase() === 'queryparam') {
    tokenProps.queryParameters = {
      [ATTRIBUTE_NAME]: TOKEN_VALUE
    } as Record<string, unknown>;
  }

  tokenProps.queryParameters = {
    ...(tokenProps.queryParameters as Record<string, unknown>),
    // ...(typeof ver !== 'undefined' ? { ver } : {})
  };

  return new CesiumResource({...tokenProps as unknown as CesiumResource});
};

export const getWMTSOptions = (layer: LayerRasterRecordModelType, url: string, capability: CapabilityModelType | undefined): RCesiumWMTSLayerOptions => {
  let style = 'default';
  let format = 'image/jpeg';
  let {tileMatrixSetID, tileMatrixLabels} = {
    tileMatrixSetID: 'newGrids',
    tileMatrixLabels: [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20' ]
  };
  if (capability) {
    const defaultStyle = (capability.style as StyleModelType[]).find((s: StyleModelType) => s.isDefault !== undefined && s.isDefault === 'true')?.value;
    style = defaultStyle !== undefined ? defaultStyle : (get(capability, 'style[0]') as StyleModelType).value as string;
    // TODO: format should be taken from layer record from new Transparent/Opaque field if exists in capabilities, otherwise - take first (format[0])
    format = get(capability, 'format[0]') as string; // (!IMPORTANT) derived from raster implementation: there is only ONE surved tiles format
    const tileMatrixSet = get(capability, 'tileMatrixSet[0]') as TileMatrixSetModelType; // (!IMPORTANT) derived from raster implementation: there is only ONE surved tile matrix set
    if (tileMatrixSet.tileMatrixSetID !== undefined) {
      tileMatrixSetID = tileMatrixSet.tileMatrixSetID;
    }
    if (tileMatrixSet.tileMatrixLabels !== undefined) {
      tileMatrixLabels = tileMatrixSet.tileMatrixLabels;
    }
    url = (capability.url as ResourceUrlModelType[]).find((u: ResourceUrlModelType) => u.format === format)?.template ?? url;
  }
  return {
    url: getTokenResource(url, layer.productVersion as string),
    layer: `${layer.productId as string}-${layer.productVersion as string}`,
    style,
    format,
    tileMatrixSetID,
    // tileMatrixLabels,
    maximumLevel: Math.max(...tileMatrixLabels.map(Number)),
    tilingScheme: new CesiumGeographicTilingScheme()
  };
};