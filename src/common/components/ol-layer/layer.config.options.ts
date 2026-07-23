import type {
  RCesiumWMTSLayerOptions,
  RCesiumWMSLayerOptions,
  RCesiumXYZLayerOptions,
  RCesiumOSMLayerOptions,
} from '@map-colonies/react-components';

export type WMTSSourceOptions = RCesiumWMTSLayerOptions;
export type WMSSourceOptions = RCesiumWMSLayerOptions;
export type XYZSourceOptions = RCesiumXYZLayerOptions;
export type OSMSourceOptions = RCesiumOSMLayerOptions;

export interface IOLConfigData {
  options: WMTSSourceOptions | WMSSourceOptions | XYZSourceOptions | OSMSourceOptions;
}

export type { Options as WMTSOptions } from 'ol/source/WMTS';
export type { Options as XYZOptions } from 'ol/source/XYZ';
export type { Options as LayerOptions } from 'ol/layer/Base';
