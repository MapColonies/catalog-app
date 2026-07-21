import { get, isEmpty } from 'lodash';
import { Feature } from 'geojson';
import { Options as WMTSOptions } from 'ol/source/WMTS';
import { Options as XYZOptions } from 'ol/source/XYZ';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import booleanContains from '@turf/boolean-contains';
import { LinkType } from '../../../common/models/link-type.enum';
import CONFIG from '../../../common/config';
import { ResourceUrlModelType } from '../../models/ResourceUrlModel';
import { ILayerImage } from '../../models/layerImage';
import {
  CapabilityModelType,
  LayerMetadataMixedUnion,
  LayerRasterRecordModelType,
  LinkModelType,
  StyleModelType,
  TileMatrixSetModelType,
} from '../../models';
import {
  getWMTSOptions,
  getXYZOptions,
  IRasterLayer,
  RCesiumWMTSLayerOptions,
} from '@map-colonies/react-components';

export const isPolygonContainedInLayer = (
  polygon: Feature,
  layer: LayerMetadataMixedUnion
): boolean => {
  const layerFootprintBBox = bbox(layer.footprint);
  const layerFootprintBBoxPolygon = bboxPolygon(layerFootprintBBox);
  return booleanContains(layerFootprintBBoxPolygon, polygon);
};

export const getLinksArrWithTokens = (links: LinkModelType[]): LinkModelType[] => {
  const linksWithTokens = links.map((link) => {
    return {
      ...link,
      url: getLinkUrlWithToken([link]),
    };
  });
  return linksWithTokens;
};

export const findLayerLink = (layer: ILayerImage): LinkModelType | undefined => {
  let wmtsLayer = layer.links?.find((link: LinkModelType) =>
    [LinkType.WMTS_LAYER as string].includes(link.protocol as string)
  ) as LinkModelType | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (wmtsLayer === undefined) {
    wmtsLayer = layer.links?.find((link: LinkModelType) =>
      [LinkType.WMTS as string].includes(link.protocol as string)
    ) as LinkModelType | undefined;
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
  const { INJECTION_TYPE, ATTRIBUTE_NAME, TOKEN_VALUE } = CONFIG.ACCESS_TOKEN as {
    INJECTION_TYPE: string;
    ATTRIBUTE_NAME: string;
    TOKEN_VALUE: string;
  };
  if (INJECTION_TYPE && INJECTION_TYPE.toLowerCase() === 'queryparam') {
    return `?${ATTRIBUTE_NAME}=${TOKEN_VALUE}`;
  }
  return '';
};

export const getLinkUrl = (links: LinkModelType[], protocol: string): string | undefined => {
  return links.find((link: LinkModelType) => link.protocol === protocol)?.url;
};

export const getLinkUrlWithToken = (
  links: LinkModelType[],
  protocol?: string
): string | undefined => {
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

export interface WMTSSourceOptions {
  url: string;
  layer: string;
  style: string;
  format: string;
  tileMatrixSetID: string;
  tileMatrixLabels: string[];
}

export const normalizeWMTSParams = (
  layer: LayerRasterRecordModelType,
  url: string,
  capability?: CapabilityModelType
): WMTSSourceOptions => {
  let style = 'default';
  let format = 'image/jpeg';
  let { tileMatrixSetID, tileMatrixLabels } = {
    tileMatrixSetID: 'newGrids',
    tileMatrixLabels: [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
    ],
  };
  if (capability) {
    const defaultStyle = (capability.style as StyleModelType[]).find(
      (s: StyleModelType) => s.isDefault !== undefined && s.isDefault === 'true'
    )?.value;
    style =
      defaultStyle !== undefined
        ? defaultStyle
        : ((get(capability, 'style[0]') as StyleModelType).value as string);
    // TODO: format should be taken from layer record from new Transparent/Opaque field if exists in capabilities, otherwise - take first (format[0])
    format = get(capability, 'format[0]') as string; // (!IMPORTANT) derived from raster implementation: there is only ONE surved tiles format
    const tileMatrixSet = get(capability, 'tileMatrixSet[0]') as TileMatrixSetModelType; // (!IMPORTANT) derived from raster implementation: there is only ONE surved tile matrix set
    if (tileMatrixSet.tileMatrixSetID !== undefined) {
      tileMatrixSetID = tileMatrixSet.tileMatrixSetID;
    }
    if (tileMatrixSet.tileMatrixLabels !== undefined) {
      tileMatrixLabels = tileMatrixSet.tileMatrixLabels;
    }
    url =
      (capability.url as ResourceUrlModelType[]).find(
        (u: ResourceUrlModelType) => u.format === format
      )?.template ?? url;
  }
  return {
    url,
    layer: `${layer.productId as string}-${layer.productVersion as string}`,
    style,
    format,
    tileMatrixSetID,
    tileMatrixLabels,
  };
};

export const DEFAULT_PROJECTION = 'EPSG:4326';

export const toOlSubdomainTemplate = (url: string): string => {
  return url.includes('{s}') ? url.replace('{s}', '{a-c}') : url;
};

export function getOLSourceOptions(
  protocol: LinkType.WMTS_LAYER | LinkType.XYZ_LAYER,
  rasterLayer: IRasterLayer
): XYZOptions | WMTSOptions | null {
  const layerOptions = rasterLayer.options;
  let resOptions = null;
  let url = toOlSubdomainTemplate(layerOptions.url as string);

  switch (protocol) {
    case LinkType.XYZ_LAYER:
      resOptions = getXYZOptions({ url });
      break;

    case LinkType.WMTS_LAYER:
      {
        const wmtsSourceOptions = layerOptions as RCesiumWMTSLayerOptions;
        resOptions = getWMTSOptions({
          url,
          layer: wmtsSourceOptions.layer ?? '',
          matrixSet: wmtsSourceOptions.tileMatrixSetID as string,
          format: wmtsSourceOptions.format as string,
          projection: DEFAULT_PROJECTION, // Should be taken from map-server capabilities (MAPCO-3780)
          style: wmtsSourceOptions.style ?? '',
        });
      }
      break;

    default:
      resOptions = null;
  }

  return resOptions;
}
