import React from 'react';
import { LayerType, TileLayer, TileWMS, TileWMTS, TileXYZ } from '@map-colonies/react-components';
import {
  LayerOptions,
  WMSOptions,
  WMTSOptions,
  XYZOptions,
} from '@map-colonies/react-components/bridge';
import { ProtocolType, toProtocol } from '../../models/protocol-type.enum';

export interface OlTileLayerParams {
  layerType: LayerType;
  sourceOptions: WMTSOptions | XYZOptions | WMSOptions;
  layerOptions?: LayerOptions;
}

export const OlTileLayer: React.FC<OlTileLayerParams> = ({
  layerType,
  sourceOptions,
  layerOptions,
}): JSX.Element => {
  const tileOptions = { ...sourceOptions, crossOrigin: 'anonymous' };
  let tileComponent: JSX.Element | undefined = undefined;

  switch (toProtocol(layerType)) {
    case ProtocolType.WMTS:
      tileComponent = <TileWMTS options={tileOptions as WMTSOptions} />;
      break;
    case ProtocolType.XYZ:
      tileComponent = <TileXYZ options={tileOptions as XYZOptions} />;
      break;
    case ProtocolType.WMS:
      tileComponent = <TileWMS options={tileOptions as WMSOptions} />;
      break;
    // case ProtocolType.OSM:
    //   tileComponent = <TileOSM options={tileOptions as OSMOptions} />;
    //   break;
  }

  return <TileLayer options={layerOptions}>{tileComponent}</TileLayer>;
};
