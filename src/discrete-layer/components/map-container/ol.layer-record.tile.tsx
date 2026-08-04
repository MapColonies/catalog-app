import React from 'react';
import { LinkType } from '../../../common/models/link-type.enum';
import {
  LayerOptions,
  WMTSOptions,
  XYZOptions,
} from '../../../common/components/ol-map/layer.config.options-bridging';
import { OlTileLayer } from '../../../common/components/ol-map/ol.tile-layer';
import {
  CapabilityModelType,
  LayerMetadataMixedUnion,
  LayerRasterRecordModelType,
  LinkModelType,
} from '../../models';
import {
  getLayerLink,
  getLinkUrlWithToken,
  getWMTSConfigOptions,
  isWMTSProtocol,
  isXYZProtocol,
} from '../helpers/layersUtils';
import { getOLSourceOptions } from '../helpers/olUtils';

interface OlLayerRecordTileProps {
  layerRecord: LayerMetadataMixedUnion;
  capability?: CapabilityModelType;
  layerOptions?: LayerOptions;
}

export const OlLayerRecordTile: React.FC<OlLayerRecordTileProps> = React.memo((props) => {
  let options: XYZOptions | WMTSOptions | null = null;
  let linkType: LinkType | null = null;

  const layerLink = getLayerLink(props.layerRecord);
  if (!layerLink?.url) {
    return undefined;
  }

  if (isXYZProtocol(layerLink.protocol)) {
    linkType = LinkType.XYZ_LAYER;
    options = getOLSourceOptions(LinkType.XYZ_LAYER, {
      options: { url: layerLink.url },
    });
  }

  if (isWMTSProtocol(layerLink.protocol)) {
    const resolved = getWMTSConfigOptions(
      props.layerOptions as LayerRasterRecordModelType,
      layerLink.url as string,
      props.capability
    );

    linkType = LinkType.WMTS_LAYER;
    options = getOLSourceOptions(LinkType.WMTS_LAYER, {
      options: {
        ...resolved,
        url: getLinkUrlWithToken([{ ...layerLink, url: resolved.url } as LinkModelType]) as string,
      },
    });
  }

  if (!options || !linkType) {
    return;
  }

  return (
    <OlTileLayer layerType={linkType} sourceOptions={options} layerOptions={props.layerOptions} />
  );
});
