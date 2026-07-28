import { LayerType, TileLayer, TileWMTS, TileXYZ } from '@map-colonies/react-components';
import {
  isWMTSProtocol,
  isXYZProtocol,
} from '../../../discrete-layer/components/helpers/layersUtils';
import { LayerOptions, WMTSOptions, XYZOptions } from './layer.config.options';

interface OlTileLayerParams {
  layerType: LayerType;
  sourceOptions: WMTSOptions | XYZOptions;
  layerOptions?: LayerOptions;
}

export const OlTileLayer: React.FC<OlTileLayerParams> = ({
  layerType,
  sourceOptions,
  layerOptions,
}): JSX.Element => {
  const tileOptions = { ...sourceOptions, crossOrigin: 'anonymous' };
  let tileComponent: JSX.Element | undefined = undefined;

  switch (true) {
    case isWMTSProtocol(layerType):
      tileComponent = <TileWMTS options={tileOptions as WMTSOptions} />;
      break;
    case isXYZProtocol(layerType):
      tileComponent = <TileXYZ options={tileOptions as XYZOptions} />;
      break;
    // case isOSMProtocol(layerType):
    //   tileComponent = <TileWMTS options={tileOptions as WMTSOptions} />;
    //   break;
    // case isWMSProtocol(layerType):
    //   tileComponent = <TileXYZ options={tileOptions as XYZOptions} />;
    //   break;
  }

  return <TileLayer options={layerOptions}>{tileComponent}</TileLayer>;
};
