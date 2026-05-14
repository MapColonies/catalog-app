import { isEmpty } from 'lodash';
import { ILayerImage } from '../../discrete-layer/models/layerImage';

export const DEFAULT_ID = 'DEFAULT_UI_ID';

export const isEmptyLayerRecord = (record?: ILayerImage | null): boolean => {
  if (isEmpty(record)) {
    return true;
  }
  return record?.id === DEFAULT_ID;
};
