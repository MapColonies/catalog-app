import { get } from 'lodash';
import { RecordStatus } from '../../discrete-layer/models';
import { DEFAULT_ID } from '../../discrete-layer/components/layer-details/entity.dialog';
import CONFIG from '../config';

const STATUS = 'productStatus';
const ID = 'id';
const POLYGON_PARTS_SHOWN = 'polygonPartsShown';
const POLYGON_PARTS_SHOWN_COLOR = CONFIG.CONTEXT_MENUS.MAP.POLYGON_PARTS_FEATURE_CONFIG.outlineColor;
const UNPUBLISHED_COLOR = 'var(--mdc-theme-gc-warning-high)';
const ERROR_COLOR = 'var(--mdc-theme-gc-error-high)';

export const existStatus = (data: Record<string, unknown>): boolean => {
  return STATUS in data;
};

export const existPolygonParts = (data: Record<string, unknown>): boolean => {
  return POLYGON_PARTS_SHOWN in data;
};

export const isUnpublished = (data: Record<string, unknown>): boolean => {
  return get(data, STATUS) === RecordStatus.UNPUBLISHED && get(data, ID) !== DEFAULT_ID;
};

export const isPolygonPartsShown = (data: Record<string, unknown>): boolean => {
  return get(data, POLYGON_PARTS_SHOWN) === true;
};

export const isUnpublishedValue = (value: string): boolean => {
  return value === RecordStatus.UNPUBLISHED;
};

export const getTextStyle = (
  data: Record<string, unknown>, 
  colorProperty: 'color' | 'backgroundColor'
): Record<string, unknown> | undefined => {
  if (data.layerURLMissing) {
    return { [colorProperty]: ERROR_COLOR };
  }
  if (existStatus(data) && isUnpublished(data)) {
    return { [colorProperty]: UNPUBLISHED_COLOR };
  }
  return undefined;
};

export const getIconStyle = (
  data: Record<string, unknown>, 
  colorProperty: 'color' | 'backgroundColor'
): Record<string, unknown> | undefined => {
  let resStyle = undefined;
  if (data.layerURLMissing) {
    return { [colorProperty]: ERROR_COLOR };
  }
  if (existStatus(data) && isUnpublished(data)) {
    resStyle = { [colorProperty]: UNPUBLISHED_COLOR };
  }
  if (existPolygonParts(data) && isPolygonPartsShown(data)) {
    const hasWFSLink = (data.links as Array<Record<string, unknown>>)?.some(link => link.protocol === 'WFS')

    if (hasWFSLink) {
      resStyle = { [colorProperty]: POLYGON_PARTS_SHOWN_COLOR };
    } else {
      resStyle = { opacity: 0.5 };
    }
  }
  if (existPolygonParts(data) && !isPolygonPartsShown(data)) {
    const hasWFSLink = (data.links as Array<Record<string, unknown>>)?.some(link => link.protocol === 'WFS')

    if (!hasWFSLink) {
      resStyle = {
        ...resStyle,
        opacity: 0.5
      };
    }
  }

  return resStyle;
};
