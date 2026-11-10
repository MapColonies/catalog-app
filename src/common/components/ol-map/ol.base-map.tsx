import React from 'react';
import {
  LayerType,
  TileLayer,
  TileWMTS,
  TileXYZ,
  adaptToOlOptions,
  LayerOptions,
  WMTSOptions,
  XYZOptions,
} from '@map-colonies/react-components';
import { ProtocolType, toProtocol } from '../../models/protocol-type.enum';
import { BasemapOutput } from '../../../discrete-layer/components/basemaps/XXXbasemapMockXXX';
import { buildRasterLayerFromBasemapLayer } from '../../../discrete-layer/components/helpers/basemapLayerUtils';

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

interface OlBaseMapProps {
  basemaps: BasemapOutput[];
}

export const OlBaseMap: React.FC<OlBaseMapProps> = React.memo(({ basemaps }): JSX.Element => {
  const basemap =
    basemaps.find((item) => item.isForPreview) ?? basemaps.find((item) => item.isCurrent);

  if (!basemap) {
    return <></>;
  }

  return (
    <>
      {basemap.layers
        .slice()
        .sort((curr, next) => curr.order - next.order)
        .map((basemapLayer) => {
          // The only place the basemap layer is converted to the map layer format, right before the OL source is built
          const layer = buildRasterLayerFromBasemapLayer(basemapLayer);
          const options = layer && adaptToOlOptions(layer.type, layer.options);

          if (!layer || !options) {
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
