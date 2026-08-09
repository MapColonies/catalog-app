import React, { CSSProperties, useMemo } from 'react';
import { Feature } from 'geojson';
import { Mode } from '../../../common/models/mode.enum';
import { FlyTo } from '../../../common/components/ol-map/fly-to';
import { ILayerImage } from '../../models/layerImage';
import { useStore } from '../../models';
import { OlLayerRecordTile } from '../map-container/ol.layer-record.tile';
import { START_RASTER_LAYER_ZINDEX } from './raster/pp-map.utils';
import { GeoFeaturesPresentorComponent } from './raster/pp-map';

interface ActionMapProps {
  layerRecord: ILayerImage;
  style?: CSSProperties;
  defaultShowBaseMap?: boolean;
  toggleBaseMap?: boolean;
  children?: JSX.Element | null;
}

export const ActionMap: React.FC<ActionMapProps> = ({
  layerRecord,
  style,
  defaultShowBaseMap = false,
  toggleBaseMap = true,
  children,
}) => {
  const store = useStore();

  const flyToFeature = useMemo(() => {
    return {
      type: 'Feature',
      properties: {},
      geometry: layerRecord.footprint,
    } as Feature;
  }, [layerRecord.footprint]);

  const layerCapability = store.discreteLayersStore.getLayerCapability(layerRecord);
  const layerOptions = useMemo(() => {
    return {
      extent: layerRecord.footprint?.bbox,
      zIndex: START_RASTER_LAYER_ZINDEX,
    };
  }, [layerRecord.footprint?.bbox]);

  return (
    <GeoFeaturesPresentorComponent
      layerRecord={layerRecord}
      mode={Mode.DELETE}
      style={{ height: 'var(--map-height)', position: 'relative', direction: 'ltr', ...style }}
      defaultShowBaseMap={defaultShowBaseMap}
      toggleBaseMap={toggleBaseMap}
    >
      <>
        <OlLayerRecordTile
          layerRecord={layerRecord}
          capability={layerCapability}
          layerOptions={layerOptions}
        />
        <FlyTo feature={flyToFeature} flyOnce={true}></FlyTo>
        {children}
      </>
    </GeoFeaturesPresentorComponent>
  );
};
