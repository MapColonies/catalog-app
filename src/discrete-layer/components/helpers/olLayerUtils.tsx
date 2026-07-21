import { useMemo } from 'react';
import {
  IBaseMap,
  IBaseMaps,
  IRasterLayer,
  TileLayer,
  TileWMTS,
  TileXYZ,
} from '@map-colonies/react-components';
import { Options as WMTSOptions } from 'ol/source/WMTS';
import { Options as XYZOptions } from 'ol/source/XYZ';
import { Options as LayerOptions } from 'ol/layer/Base';
import { LinkType } from '../../../common/models/link-type.enum';
import {
  CapabilityModelType,
  LayerMetadataMixedUnion,
  LayerRasterRecordModelType,
  LinkModelType,
} from '../../models';
import {
  getLayerLink,
  getLinkUrlWithToken,
  getOLSourceOptions,
  normalizeWMTSParams,
} from './layersUtils';

export const DEFAULT_PROJECTION = 'EPSG:4326';

const SupportedProtocols = {
  WMTS_LAYER: LinkType.WMTS_LAYER,
  WMTS: LinkType.WMTS,
  XYZ_LAYER: LinkType.XYZ_LAYER,
} as const;
type SupportedProtocol = (typeof SupportedProtocols)[keyof typeof SupportedProtocols];

interface OlLayerInnerParams {
  protocol: SupportedProtocol;
  sourceOptions: WMTSOptions | XYZOptions;
  layerOptions?: LayerOptions;
}

const OlLayerInner: React.FC<OlLayerInnerParams> = ({
  protocol,
  sourceOptions,
  layerOptions,
}): JSX.Element => {
  const tileOptions = { ...sourceOptions, crossOrigin: 'anonymous' };
  let tileComponent: JSX.Element | undefined = undefined;

  switch (protocol) {
    case SupportedProtocols.WMTS_LAYER:
      tileComponent = <TileWMTS options={tileOptions as WMTSOptions} />;
      break;
    case SupportedProtocols.XYZ_LAYER:
      tileComponent = <TileXYZ options={tileOptions as XYZOptions} />;
      break;
  }

  return <TileLayer options={layerOptions}>{tileComponent}</TileLayer>;
};

const isWMTSProtocol = (protocol?: string) =>
  protocol === LinkType.WMTS_LAYER || protocol === LinkType.WMTS;

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

        switch (layer.type) {
          case SupportedProtocols.WMTS_LAYER:
            options = getOLSourceOptions(SupportedProtocols.WMTS_LAYER, layer);
            break;

          case SupportedProtocols.XYZ_LAYER:
            options = getOLSourceOptions(SupportedProtocols.XYZ_LAYER, layer);
            break;
        }

        if (options) {
          olBaseMap.push(
            <OlLayerInner
              key={layer.id}
              protocol={layer.type as SupportedProtocol}
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

interface OlLayerProps {
  layerRecord: LayerMetadataMixedUnion;
  capability?: CapabilityModelType;
  layerOptions?: LayerOptions;
}

export const OlLayer: React.FC<OlLayerProps> = (props) => {
  let options: XYZOptions | WMTSOptions | null = null;
  let protocol: SupportedProtocol | null = null;

  const layerLink = getLayerLink(props.layerRecord);
  if (!layerLink?.url) {
    return undefined;
  }

  if (layerLink.protocol === SupportedProtocols.XYZ_LAYER) {
    protocol = SupportedProtocols.XYZ_LAYER;
    options = getOLSourceOptions(
      SupportedProtocols.XYZ_LAYER,
      {
        id: '',
        opacity: 1,
        type: SupportedProtocols.XYZ_LAYER,
        zIndex: 1,
        options: { url: layerLink.url },
      } satisfies IRasterLayer // support XYZ protocol for outer layers like OpenStreetmap etc.
    );
  }

  if (isWMTSProtocol(layerLink.protocol)) {
    const resolved = normalizeWMTSParams(
      props.layerOptions as LayerRasterRecordModelType,
      layerLink.url as string,
      props.capability
    );

    protocol = SupportedProtocols.WMTS_LAYER;
    options = getOLSourceOptions(SupportedProtocols.WMTS_LAYER, {
      id: '',
      opacity: 1,
      type: SupportedProtocols.WMTS_LAYER,
      zIndex: 1,
      options: {
        ...resolved,
        url: getLinkUrlWithToken([{ ...layerLink, url: resolved.url } as LinkModelType]) as string,
      },
    } satisfies IRasterLayer);
  }

  if (!options || !protocol) {
    return;
  }

  return (
    <OlLayerInner protocol={protocol} sourceOptions={options} layerOptions={props.layerOptions} />
  );
};
