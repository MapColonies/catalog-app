import bbox from '@turf/bbox';
import area from '@turf/area';
import {
  CesiumRectangle,
  CesiumResource,
  InjectedAuth,
  RCesiumWMTSLayerOptions,
} from '@map-colonies/react-components';
import { adaptToCesiumWmtsOptions } from '@map-colonies/react-components/bridge';
import CONFIG from '../../../common/config';
import {
  CapabilityModelType,
  LayerMetadataMixedUnion,
  LayerRasterRecordModelType,
} from '../../models';
import { getWMTSConfigOptions } from './layersUtils';

const DEFAULT_RECTANGLE_FACTOR = 0.2;
const EARTH_AREA = 509000000; //whole EARTH surface, in square km

export const generateLayerRectangle = (layer: LayerMetadataMixedUnion): CesiumRectangle => {
  // eslint-disable-next-line
  return CesiumRectangle.fromDegrees(...bbox(layer.footprint)) as CesiumRectangle;
};

export const degreesToCesiumRectangle = ({
  west,
  south,
  east,
  north,
}: ReturnType<typeof generateLayerRectangleDeg>): CesiumRectangle =>
  CesiumRectangle.fromDegrees(west, south, east, north);

export const applyFactor = (rect: CesiumRectangle, factor = DEFAULT_RECTANGLE_FACTOR) => {
  rect.east = rect.east + rect.width * factor;
  rect.west = rect.west - rect.width * factor;
  rect.south = rect.south - rect.height * factor;
  rect.north = rect.north + rect.height * factor;
};

export const generateFactoredLayerRectangle = (
  layer: LayerMetadataMixedUnion,
  factor = DEFAULT_RECTANGLE_FACTOR
): CesiumRectangle => {
  const rectWithBuffers = generateLayerRectangle(layer);
  if (area({ type: 'Feature', properties: {}, geometry: layer.footprint }) / 1000000 > EARTH_AREA) {
    factor = 0;
  }
  applyFactor(rectWithBuffers, factor);
  return rectWithBuffers;
};

export const getInjectedAuth = (): InjectedAuth => {
  // eslint-disable-next-line
  const { INJECTION_TYPE, ATTRIBUTE_NAME, TOKEN_VALUE } = CONFIG.ACCESS_TOKEN as {
    INJECTION_TYPE: string;
    ATTRIBUTE_NAME: string;
    TOKEN_VALUE: string;
  };

  switch (INJECTION_TYPE?.toLowerCase()) {
    case 'header':
      return { headers: { [ATTRIBUTE_NAME]: TOKEN_VALUE } };
    case 'queryparam':
      return { queryParameters: { [ATTRIBUTE_NAME]: TOKEN_VALUE } };
    default:
      return {};
  }
};

export const getTokenResource = (url: string, ver?: string): CesiumResource => {
  return new CesiumResource({ url, ...getInjectedAuth() });
};

/** Layer extent in degrees (the JSON-safe form expected by the react-components options schemas). */
export const generateLayerRectangleDeg = (
  layer: LayerMetadataMixedUnion
): { west: number; south: number; east: number; north: number } => {
  const [west, south, east, north] = bbox(layer.footprint);
  return { west, south, east, north };
};

export const getCesiumWMTSOptions = (
  layer: LayerRasterRecordModelType,
  url: string,
  capability: CapabilityModelType | undefined
): RCesiumWMTSLayerOptions => {
  return adaptToCesiumWmtsOptions(getWMTSConfigOptions(layer, url, capability));
};
