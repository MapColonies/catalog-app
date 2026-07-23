import { getWMTSOptions, getXYZOptions } from '@map-colonies/react-components';
import { LinkType } from '../../../common/models/link-type.enum';
import {
  IOLConfigData,
  WMTSSourceOptions,
  WMTSOptions,
  XYZOptions,
} from '../../../common/components/ol-layer/layer.config.options';

export const DEFAULT_PROJECTION = 'EPSG:4326';

export const toOlSubdomainTemplate = (url: string): string => {
  return url.includes('{s}') ? url.replace('{s}', '{a-c}') : url;
};

export function getOLSourceOptions(
  protocol: LinkType,
  configData: IOLConfigData
): XYZOptions | WMTSOptions | null {
  const layerOptions = configData.options;
  let resOptions = null;
  let url = toOlSubdomainTemplate(layerOptions.url as string);

  switch (protocol) {
    case LinkType.XYZ_LAYER:
      resOptions = getXYZOptions({ url });
      break;

    case LinkType.WMTS_LAYER:
      {
        const wmtsSourceOptions = layerOptions as WMTSSourceOptions;
        resOptions = getWMTSOptions({
          url,
          layer: wmtsSourceOptions.layer ?? '',
          matrixSet: wmtsSourceOptions.tileMatrixSetID,
          format: wmtsSourceOptions.format ?? '',
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
