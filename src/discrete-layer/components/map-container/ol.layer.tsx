import React from 'react';
import { TileLayer, TileWMTS, TileXYZ } from '@map-colonies/react-components';
import { ProtocolType, toProtocol } from '../../../common/models/protocol-type.enum';
import {
  LayerOptions,
  WMTSOptions,
  XYZOptions,
} from '../../../common/components/ol-map/layer.config.options-bridging';
import {
  CapabilityModelType,
  LayerMetadataMixedUnion,
  LayerRasterRecordModelType,
  LinkModelType,
} from '../../models';
import { getLayerLink, getLinkUrlWithToken, getWMTSConfigOptions } from '../helpers/layersUtils';
import { getOLSourceOptions } from '../helpers/olUtils';

interface OlLayerProps {
  layerRecord: LayerMetadataMixedUnion;
  capability?: CapabilityModelType;
  layerOptions?: LayerOptions;
}

export const OlLayer: React.FC<OlLayerProps> = React.memo((props) => {
  let options: XYZOptions | WMTSOptions | null = null;
  let tileComponent: JSX.Element | undefined = undefined;

  const layerLink = getLayerLink(props.layerRecord);
  if (!layerLink?.url) {
    return undefined;
  }

  switch (toProtocol(layerLink.protocol)) {
    case ProtocolType.XYZ:
      options = getOLSourceOptions(ProtocolType.XYZ, {
        options: { url: layerLink.url },
      });
      tileComponent = (
        <TileXYZ options={{ ...(options as XYZOptions), crossOrigin: 'anonymous' }} />
      );
      break;

    case ProtocolType.WMTS: {
      const resolved = getWMTSConfigOptions(
        props.layerOptions as LayerRasterRecordModelType,
        layerLink.url as string,
        props.capability
      );

      options = getOLSourceOptions(ProtocolType.WMTS, {
        options: {
          ...resolved,
          url: getLinkUrlWithToken([
            { ...layerLink, url: resolved.url } as LinkModelType,
          ]) as string,
        },
      });
      tileComponent = (
        <TileWMTS options={{ ...(options as WMTSOptions), crossOrigin: 'anonymous' }} />
      );
      break;
    }
  }

  if (!options || !tileComponent) {
    return;
  }

  return <TileLayer options={props.layerOptions}>{tileComponent}</TileLayer>;
});
