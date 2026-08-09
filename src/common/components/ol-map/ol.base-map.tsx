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
import {
  isWMTSProtocol,
  isXYZProtocol,
} from '../../../discrete-layer/components/helpers/layersUtils';
import { LinkType } from '../../models/link-type.enum';
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
        const options = getOLSourceOptions(layer.type as unknown as LinkType, {
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
