import { useMemo } from 'react';
import { get } from 'lodash';
import {
  getWMTSOptions,
  getXYZOptions,
  IBaseMap,
  IBaseMaps,
  TileLayer,
  TileWMTS,
  TileXYZ,
} from '@map-colonies/react-components';
import { Options as WMTSOptions } from 'ol/source/WMTS';
import { Options as XYZOptions } from 'ol/source/XYZ';
import { LinkType } from '../../models/link-type.enum';

export const DEFAULT_PROJECTION = 'EPSG:4326';

interface BuildOlTileLayerParams {
  key: string;
  protocol: LinkType.WMTS_LAYER | LinkType.XYZ_LAYER;
  options: WMTSOptions | XYZOptions;
  layerOptions?: Record<string, unknown>;
}

export const OlTileLayer: React.FC<BuildOlTileLayerParams> = ({
  key,
  protocol,
  options,
  layerOptions,
}): JSX.Element => {
  const tileOptions = { ...options, crossOrigin: 'anonymous' };
  let tileComponent: JSX.Element | undefined = undefined;

  switch (protocol) {
    case LinkType.WMTS_LAYER:
      tileComponent = <TileWMTS options={tileOptions as WMTSOptions} />;
      break;
    case LinkType.XYZ_LAYER:
      tileComponent = <TileXYZ options={tileOptions as XYZOptions} />;
      break;
  }

  return (
    <TileLayer key={key} options={layerOptions}>
      {tileComponent}
    </TileLayer>
  );
};

export const usePreviewBaseMapTiles = (baseMaps: IBaseMaps | undefined): JSX.Element[] => {
  return useMemo(() => {
    const olBaseMap: JSX.Element[] = [];
    let baseMap = baseMaps?.maps.find((map: IBaseMap) => map.isForPreview);
    if (!baseMap) {
      baseMap = baseMaps?.maps.find((map: IBaseMap) => map.isCurrent);
    }
    if (baseMap) {
      baseMap.baseRasterLayers.forEach((layer) => {
        let protocol: LinkType.WMTS_LAYER | LinkType.XYZ_LAYER | undefined;
        let options;

        if (layer.type === LinkType.WMTS_LAYER) {
          protocol = LinkType.WMTS_LAYER;
          options = getWMTSOptions({
            url: layer.options.url as string,
            layer: '',
            matrixSet: get(layer.options, 'tileMatrixSetID') as string,
            format: get(layer.options, 'format'),
            projection: DEFAULT_PROJECTION, // Should be taken from map-server capabilities (MAPCO-3780)
            style: get(layer.options, 'style'),
          });
        }
        if (layer.type === LinkType.XYZ_LAYER) {
          protocol = LinkType.XYZ_LAYER;
          options = getXYZOptions({
            url: layer.options.url as string,
          });
        }
        if (protocol && options) {
          olBaseMap.push(
            <OlTileLayer
              key={layer.id}
              protocol={protocol}
              options={options}
              layerOptions={{ opacity: layer.opacity }}
            />
          );
        }
      });
    }
    return olBaseMap;
  }, []);
};
