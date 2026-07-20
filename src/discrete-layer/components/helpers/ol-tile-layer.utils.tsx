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
import { Options as LayerOptions } from 'ol/layer/Base';
import { LinkType } from '../../../common/models/link-type.enum';
import { CapabilityModelType, LayerRasterRecordModelType, LinkModelType } from '../../models';
import { getLayerLink, getLinkUrlWithToken, resolveWmtsCapabilityParams } from './layersUtils';

export const DEFAULT_PROJECTION = 'EPSG:4326';

interface OlTileLayerInnerParams {
  key: string;
  protocol: LinkType.WMTS_LAYER | LinkType.XYZ_LAYER;
  sourceOptions: WMTSOptions | XYZOptions;
  layerOptions?: LayerOptions;
}

type SourceOptions =
  | {
      protocol: LinkType.XYZ_LAYER;
      url: string;
    }
  | {
      protocol: LinkType.WMTS_LAYER;
      url: string;
      layer: string;
      matrixSet: string;
      format: string;
      style: string;
    };

const getSourceOptions = (options: SourceOptions): XYZOptions | WMTSOptions | null => {
  switch (options.protocol) {
    case LinkType.XYZ_LAYER:
      return getXYZOptions({
        url: options.url,
      });

    case LinkType.WMTS_LAYER:
      return getWMTSOptions({
        url: options.url,
        layer: options.layer,
        matrixSet: options.matrixSet,
        format: options.format,
        projection: DEFAULT_PROJECTION, // Should be taken from map-server capabilities (MAPCO-3780)
        style: options.style,
      });

    default:
      return null;
  }
};

const OlTileLayerInner: React.FC<OlTileLayerInnerParams> = ({
  key,
  protocol,
  sourceOptions,
  layerOptions,
}): JSX.Element => {
  const tileOptions = { ...sourceOptions, crossOrigin: 'anonymous' };
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
        let options: XYZOptions | WMTSOptions | null = null;

        if (layer.type === LinkType.WMTS_LAYER) {
          options = getSourceOptions({
            protocol: LinkType.WMTS_LAYER,
            url: layer.options.url as string,
            layer: get(layer.options, 'layer') ?? '',
            matrixSet: get(layer.options, 'tileMatrixSetID') as string,
            format: get(layer.options, 'format'),
            style: get(layer.options, 'style'),
          });
        }
        if (layer.type === LinkType.XYZ_LAYER) {
          options = getSourceOptions({
            protocol: LinkType.XYZ_LAYER,
            url: layer.options.url as string,
          });
        }
        if (options) {
          olBaseMap.push(
            <OlTileLayerInner
              key={layer.id}
              protocol={layer.type as LinkType.WMTS_LAYER | LinkType.XYZ_LAYER}
              sourceOptions={options}
              layerOptions={{ opacity: layer.opacity }}
            />
          );
        }
      });
    }
    return olBaseMap;
  }, [baseMaps]);
};

interface OlTileLayerProps {
  layerRecord: LayerRasterRecordModelType;
  capability?: CapabilityModelType;
  layerOptions?: LayerOptions;
}

export const OlTileLayer: React.FC<OlTileLayerProps> = (props) => {
  let options: XYZOptions | WMTSOptions | null = null;
  let protocol: LinkType.WMTS_LAYER | LinkType.XYZ_LAYER | null = null;

  const layerLink = getLayerLink(props.layerRecord);
  if (!layerLink?.url) {
    return undefined;
  }

  if (layerLink.protocol === LinkType.XYZ_LAYER) {
    protocol = LinkType.XYZ_LAYER;
    options = getSourceOptions({
      protocol: LinkType.XYZ_LAYER,
      url: layerLink.url, // support XYZ protocol for outer layers like OpenStreetmap etc.
    });
  }

  if (layerLink.protocol === LinkType.WMTS_LAYER || layerLink.protocol === LinkType.WMTS) {
    const resolved = resolveWmtsCapabilityParams(
      props.layerRecord,
      layerLink.url as string,
      props.capability
    );

    protocol = LinkType.WMTS_LAYER;
    options = getSourceOptions({
      protocol: LinkType.WMTS_LAYER,
      url: getLinkUrlWithToken([{ ...layerLink, url: resolved.url } as LinkModelType]) as string,
      layer: resolved.layer,
      matrixSet: resolved.tileMatrixSetID,
      format: resolved.format,
      style: resolved.style,
    });
  }

  if (!options || !protocol) {
    return;
  }

  return (
    <OlTileLayerInner
      key={props.layerRecord.id}
      protocol={protocol}
      sourceOptions={options}
      layerOptions={props.layerOptions}
    />
  );
};
