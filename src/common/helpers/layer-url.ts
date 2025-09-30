/* eslint-disable */
import { get } from 'lodash';
import { LayerMetadataMixedUnion } from '../../discrete-layer/models';
import CONFIG from '../config';

const getParamsString = (params: {[key: string]: string | boolean | number}) : string  => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const paramArray = Object.keys(params).map((key: string) => `${key}=${String(params[key])}`);
  return paramArray.join('&');
};

const fullUrls : {[key : string] : string} = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'WMS_LAYER': `${CONFIG.WMS_LAYER.URL}?${getParamsString(CONFIG.WMS_LAYER.PARAMS)}`,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'WMTS_LAYER': CONFIG.WMTS_LAYER.URL,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'XYZ_LAYER': CONFIG.XYZ_LAYER.URL,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'OSM_LAYER': CONFIG.OSM_LAYER.URL
};

export const getLayerUrl = () : string => {
  const activeLayer = CONFIG.ACTIVE_LAYER as string;
  return fullUrls[activeLayer];
};

export const isExistLayerURL = (data: LayerMetadataMixedUnion): boolean => {
  return !get(data, 'layerURLMissing');
};

export const isBeingDeleted = (data: any): boolean => {
  return get(data, 'isBeingDeleted');
};
