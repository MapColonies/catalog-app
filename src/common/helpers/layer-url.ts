/* eslint-disable */
import { get } from 'lodash';
import { LayerMetadataMixedUnion, RecordStatus } from '../../discrete-layer/models';

const getParamsString = (params: { [key: string]: string | boolean | number }): string => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const paramArray = Object.keys(params).map((key: string) => `${key}=${String(params[key])}`);
  return paramArray.join('&');
};

export const isExistLayerURL = (data: LayerMetadataMixedUnion): boolean => {
  return !get(data, 'layerURLMissing');
};

export const isBeingDeleted = (data: LayerMetadataMixedUnion): boolean => {
  return get(data, 'productStatus') === RecordStatus.BEING_DELETED;
};

export const isValidLayerMetadata = (data: LayerMetadataMixedUnion) => {
  return isExistLayerURL(data) && !isBeingDeleted(data);
};
