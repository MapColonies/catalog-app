import React from 'react';
import {
  IBaseMap,
  IBaseMaps,
  LayerType,
  TileLayer,
  TileWMTS,
  TileXYZ,
} from '@map-colonies/react-components';
import { getOLSourceOptions } from '../../../discrete-layer/components/helpers/olUtils';
import { ProtocolType, toProtocol } from '../../models/protocol-type.enum';
import { LayerOptions, WMTSOptions, XYZOptions } from './layer.config.options-bridging';

interface OlTileLayerParams {
  layerType: LayerType;
  sourceOptions: WMTSOptions | XYZOptions;
  layerOptions?: LayerOptions;
}

const OlBaseMapLayer: React.FC<OlTileLayerParams> = ({
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
    // case ProtocolType.OSM:
    //   tileComponent = <TileOSM options={tileOptions as OSMOptions} />;
    //   break;
    // case ProtocolType.WMS:
    //   tileComponent = <TileWMS options={tileOptions as WMSOptions} />;
    //   break;
  }

  return <TileLayer options={layerOptions}>{tileComponent}</TileLayer>;
};

export const OlBaseMap: React.FC<IBaseMaps> = React.memo((props): JSX.Element => {
  let baseMap = props.maps.find((map: IBaseMap) => map.isForPreview);

  if (!baseMap) {
    baseMap = props.maps.find((map: IBaseMap) => map.isCurrent);
  }

  if (!baseMap) {
    return <></>;
  }

  return (
    <>
      {baseMap.baseRasterLayers.map((layer) => {
        const options = getOLSourceOptions(layer.type, {
          options: layer.options,
        });

        if (!options) {
          return null;
        }

        return (
          <OlBaseMapLayer
            key={layer.id}
            layerType={layer.type}
            sourceOptions={options}
            layerOptions={{ opacity: layer.opacity }}
          />
        );
      })}
    </>
  );
});
