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

export const DEFAULT_PROJECTION = 'EPSG:4326';

interface BuildOlTileLayerParams {
  key: string;
  kind: 'WMTS' | 'XYZ';
  options: WMTSOptions | XYZOptions;
  layerOptions?: Record<string, unknown>;
}

export const buildOlTileLayer = ({
  key,
  kind,
  options,
  layerOptions,
}: BuildOlTileLayerParams): JSX.Element => {
  const tileOptions = { ...options, crossOrigin: 'anonymous' };
  return (
    <TileLayer key={key} options={layerOptions}>
      {kind === 'WMTS' ? (
        <TileWMTS options={tileOptions as WMTSOptions} />
      ) : (
        <TileXYZ options={tileOptions as XYZOptions} />
      )}
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
        if (layer.type === 'WMTS_LAYER') {
          const wmtsOptions = getWMTSOptions({
            url: layer.options.url as string,
            layer: '',
            matrixSet: get(layer.options, 'tileMatrixSetID') as string,
            format: get(layer.options, 'format'),
            projection: DEFAULT_PROJECTION, // Should be taken from map-server capabilities (MAPCO-3780)
            style: get(layer.options, 'style'),
          });
          olBaseMap.push(
            buildOlTileLayer({
              key: layer.id,
              kind: 'WMTS',
              options: wmtsOptions,
              layerOptions: { opacity: layer.opacity },
            })
          );
        }
        if (layer.type === 'XYZ_LAYER') {
          const xyzOptions = getXYZOptions({
            url: layer.options.url as string,
          });
          olBaseMap.push(
            buildOlTileLayer({
              key: layer.id,
              kind: 'XYZ',
              options: xyzOptions,
              layerOptions: { opacity: layer.opacity },
            })
          );
        }
      });
    }
    return olBaseMap;
  }, []);
};
