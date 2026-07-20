import bbox from '@turf/bbox';
import area from '@turf/area';
import {
  CesiumGeographicTilingScheme,
  CesiumRectangle,
  CesiumResource,
  RCesiumWMTSLayerOptions,
} from '@map-colonies/react-components';
import CONFIG from '../../../common/config';
import {
  CapabilityModelType,
  LayerMetadataMixedUnion,
  LayerRasterRecordModelType,
} from '../../models';
import { resolveWmtsCapabilityParams } from './layersUtils';

const DEFAULT_RECTANGLE_FACTOR = 0.2;
const EARTH_AREA = 509000000; //whole EARTH surface, in square km

export const generateLayerRectangle = (layer: LayerMetadataMixedUnion): CesiumRectangle => {
  // eslint-disable-next-line
  return CesiumRectangle.fromDegrees(...bbox(layer.footprint)) as CesiumRectangle;
};

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

export const getTokenResource = (url: string, ver?: string): CesiumResource => {
  const tokenProps: Record<string, unknown> = { url };

  // eslint-disable-next-line
  const { INJECTION_TYPE, ATTRIBUTE_NAME, TOKEN_VALUE } = CONFIG.ACCESS_TOKEN as {
    INJECTION_TYPE: string;
    ATTRIBUTE_NAME: string;
    TOKEN_VALUE: string;
  };

  if (INJECTION_TYPE && INJECTION_TYPE.toLowerCase() === 'header') {
    tokenProps.headers = {
      [ATTRIBUTE_NAME]: TOKEN_VALUE,
    } as Record<string, unknown>;
  } else if (INJECTION_TYPE && INJECTION_TYPE.toLowerCase() === 'queryparam') {
    tokenProps.queryParameters = {
      [ATTRIBUTE_NAME]: TOKEN_VALUE,
    } as Record<string, unknown>;
  }

  tokenProps.queryParameters = {
    ...(tokenProps.queryParameters as Record<string, unknown>),
    // ...(typeof ver !== 'undefined' ? { ver } : {})
  };

  return new CesiumResource({ ...(tokenProps as unknown as CesiumResource) });
};

export const getCesiumWMTSOptions = (
  layer: LayerRasterRecordModelType,
  url: string,
  capability: CapabilityModelType | undefined
): RCesiumWMTSLayerOptions => {
  const resolved = resolveWmtsCapabilityParams(layer, url, capability);
  return {
    url: getTokenResource(resolved.url, layer.productVersion as string),
    layer: resolved.layer,
    style: resolved.style,
    format: resolved.format,
    tileMatrixSetID: resolved.tileMatrixSetID,
    // tileMatrixLabels: resolved.tileMatrixLabels,
    maximumLevel: Math.max(...resolved.tileMatrixLabels.map(Number)),
    tilingScheme: new CesiumGeographicTilingScheme(),
  };
};
