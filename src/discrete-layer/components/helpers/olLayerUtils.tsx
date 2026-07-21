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

type SupportedProtocols = LinkType.WMTS_LAYER | LinkType.XYZ_LAYER;

interface OlLayerInnerParams {
  protocol: SupportedProtocols;
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
    case LinkType.WMTS_LAYER:
      tileComponent = <TileWMTS options={tileOptions as WMTSOptions} />;
      break;
    case LinkType.XYZ_LAYER:
      tileComponent = <TileXYZ options={tileOptions as XYZOptions} />;
      break;
  }

  return <TileLayer options={layerOptions}>{tileComponent}</TileLayer>;
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
          options = getOLSourceOptions(LinkType.WMTS_LAYER, layer);
        }
        if (layer.type === LinkType.XYZ_LAYER) {
          options = getOLSourceOptions(LinkType.XYZ_LAYER, layer);
        }

        if (options) {
          olBaseMap.push(
            <OlLayerInner
              key={layer.id}
              protocol={layer.type as SupportedProtocols}
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
  let protocol: SupportedProtocols | null = null;

  const layerLink = getLayerLink(props.layerRecord);
  if (!layerLink?.url) {
    return undefined;
  }

  if (layerLink.protocol === LinkType.XYZ_LAYER) {
    protocol = LinkType.XYZ_LAYER;
    options = getOLSourceOptions(
      LinkType.XYZ_LAYER,
      {
        id: '',
        opacity: 1,
        type: LinkType.XYZ_LAYER,
        zIndex: 1,
        options: { url: layerLink.url },
      } satisfies IRasterLayer // support XYZ protocol for outer layers like OpenStreetmap etc.
    );
  }

  const isRasterProtocol =
    layerLink.protocol !== undefined &&
    [LinkType.WMTS_LAYER, LinkType.WMTS].includes(layerLink.protocol as LinkType);
  if (isRasterProtocol) {
    const rasterLayerRecord = props.layerOptions as LayerRasterRecordModelType;
    const resolved = normalizeWMTSParams(
      rasterLayerRecord,
      layerLink.url as string,
      props.capability
    );

    protocol = LinkType.WMTS_LAYER;
    options = getOLSourceOptions(LinkType.WMTS_LAYER, {
      id: '',
      opacity: 1,
      type: LinkType.WMTS_LAYER,
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
