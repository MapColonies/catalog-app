import { LayerType, TileLayer, TileWMTS, TileXYZ } from '@map-colonies/react-components';
import {
  isWMTSProtocol,
  isXYZProtocol,
} from '../../../discrete-layer/components/helpers/layersUtils';
import { LayerOptions, WMTSOptions, XYZOptions } from './layer.config.options-bridging';

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
    //   tileComponent = <TileOSM options={tileOptions as OSMOptions} />;
    //   break;
    // case isWMSProtocol(layerType):
    //   tileComponent = <TileWMS options={tileOptions as WMSOptions} />;
    //   break;
  }

  return <TileLayer options={layerOptions}>{tileComponent}</TileLayer>;
};
