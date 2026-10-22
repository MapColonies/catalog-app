import { getWMTSOptions, getXYZOptions } from '@map-colonies/react-components';
import {
  IOLConfigData,
  WMTSSourceOptions,
  WMTSOptions,
  XYZOptions,
} from '../../../common/components/ol-map/layer.config.options-bridging';
import { ProtocolType } from '../../../common/models/protocol-type.enum';

export const DEFAULT_PROJECTION = 'EPSG:4326';

export const toOlSubdomainTemplate = (url: string): string => {
  return url.includes('{s}') ? url.replace('{s}', '{a-c}') : url;
};

export function getOLSourceOptions(
  protocol: ProtocolType,
  configData: IOLConfigData
): XYZOptions | WMTSOptions | null {
  const layerOptions = configData.options;
  let resOptions = null;
  let url = toOlSubdomainTemplate(layerOptions.url as string);

  switch (protocol) {
    case ProtocolType.XYZ:
      resOptions = getXYZOptions({ url });
      break;

    case ProtocolType.WMTS:
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
