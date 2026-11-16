import React from 'react';
import { useMap } from '@map-colonies/react-components';
import {
  adaptToOlLayerExtent,
  adaptToOlOptions,
  LayerOptions,
} from '@map-colonies/react-components/bridge';
import { OlTileLayer } from '../../../common/components/ol-map/ol.tile-layer';
import {
  CapabilityModelType,
  LayerMetadataMixedUnion,
  LayerRasterRecordModelType,
} from '../../models';
import { buildRasterLayerFromRecord } from '../helpers/basemapLayerUtils';
import { getInjectedAuth } from '../helpers/cesiumUtils';

interface OlLayerProps {
  layerRecord: LayerMetadataMixedUnion;
  capability?: CapabilityModelType;
  layerOptions?: LayerOptions;
}

export const OlLayer: React.FC<OlLayerProps> = React.memo((props) => {
  const viewProjection = useMap().getView().getProjection().getCode();

  const rasterLayer = buildRasterLayerFromRecord(
    props.layerRecord as LayerRasterRecordModelType,
    props.capability,
    { id: props.layerRecord.id, opacity: 1, zIndex: 0 }
  );
  const sourceOptions =
    rasterLayer && adaptToOlOptions(rasterLayer.type, rasterLayer.options, getInjectedAuth());

  if (!rasterLayer || !sourceOptions) {
    return null;
  }

  return (
    <OlTileLayer
      layerType={rasterLayer.type}
      sourceOptions={sourceOptions}
      layerOptions={{
        ...props.layerOptions,
        extent: adaptToOlLayerExtent(rasterLayer.options, viewProjection),
      }}
    />
  );
});
