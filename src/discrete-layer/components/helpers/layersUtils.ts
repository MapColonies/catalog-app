import { get, isEmpty } from 'lodash';
import { Feature } from 'geojson';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import booleanContains from '@turf/boolean-contains';
import { IRasterLayer } from '@map-colonies/react-components';
import { adaptCapabilityToWmtsOptions } from '@map-colonies/react-components/bridge';
import type { WmtsOptions } from '@map-colonies/react-components/schemas';
import CONFIG from '../../../common/config';
import { omitDeep } from '../../../common/helpers/object';
import { ProtocolType, toProtocol } from '../../../common/models/protocol-type.enum';
import { ILayerImage } from '../../models/layerImage';
import {
  CapabilityModelType,
  LayerMetadataMixedUnion,
  LayerRasterRecordModelType,
  LinkModelType,
} from '../../models';
import { generateLayerRectangleDeg } from './cesiumUtils';

export const isWMTSProtocol = (protocol?: string): boolean => protocol === ProtocolType.WMTS;

export const isXYZProtocol = (protocol?: string): boolean => protocol === ProtocolType.XYZ;

export const hasWFSLink = (data: Record<string, unknown>): boolean => {
  return (
    (data.links as Array<Record<string, unknown>> | undefined)?.some(
      (link) => link.protocol === ProtocolType.WFS
    ) ?? false
  );
};

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
  return layer.links?.find((link: LinkModelType) => link.protocol === ProtocolType.WMTS) as
    | LinkModelType
    | undefined;
};

export const getLayerLink = (layer: ILayerImage): LinkModelType => {
  let layerLink = findLayerLink(layer);
  if (layerLink === undefined) {
    layerLink = get(layer, 'links[0]') as LinkModelType;
  }
  return layerLink;
};

export const isLayerURLMissing = (
  layer: ILayerImage,
  capabilities: CapabilityModelType[] = []
): boolean => {
  const layerLink = getLayerLink(layer);
  const hasCapabilities = capabilities.some((capability) => capability.id === layerLink.name);
  return !hasCapabilities && layerLink.protocol === ProtocolType.WMTS;
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

export const getWMTSConfigOptions = (capability: CapabilityModelType): WmtsOptions =>
  adaptCapabilityToWmtsOptions(
    capability as unknown as Parameters<typeof adaptCapabilityToWmtsOptions>[0]
  );

type RasterLayerHydrationProps = Pick<
  IRasterLayer,
  'opacity' | 'zIndex' | 'show' | 'shouldBeUsedInModelDraping'
>;

export const buildRasterLayerFromRecord = (
  record: LayerRasterRecordModelType,
  capability: CapabilityModelType | null | undefined,
  layerProps: RasterLayerHydrationProps
): IRasterLayer | undefined => {
  const cleanRecord = omitDeep(record, ['__typename']);
  const link = getLayerLink(cleanRecord);
  if (link?.url === undefined) {
    return undefined;
  }

  const base = { id: cleanRecord.id, show: true, ...layerProps };
  const rectangle = generateLayerRectangleDeg(cleanRecord);

  switch (toProtocol(link.protocol)) {
    case ProtocolType.WMTS:
      // Without the capability the tile matrix set is unknown: the layer url must not be used instead
      return !capability
        ? undefined
        : {
            ...base,
            type: ProtocolType.WMTS,
            options: { ...getWMTSConfigOptions(capability), rectangle },
          };

    case ProtocolType.WMS:
      return {
        ...base,
        type: ProtocolType.WMS,
        options: { url: link.url, layers: cleanRecord.productId as string, rectangle },
      };

    case ProtocolType.XYZ:
      return { ...base, type: ProtocolType.XYZ, options: { url: link.url, rectangle } };

    default:
      return undefined;
  }
};
