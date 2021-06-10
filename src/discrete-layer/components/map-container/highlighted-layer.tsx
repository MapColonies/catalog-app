import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { CesiumGeojsonLayer, CesiumColor, CesiumConstantProperty } from '@map-colonies/react-components';
import { FeatureCollection } from 'geojson';
import { useStore } from '../../models/RootStore';
import { getLayerFootprint } from '../../models/layerImage';

const FOOTPRINT_BORDER_COLOR = CesiumColor.DODGERBLUE;
const FOOTPRINT_BORDER_WIDTH = 6.0;

export const HighlightedLayer: React.FC = observer(() => {
  const { discreteLayersStore } = useStore();
  const [layersFootprints, setlayersFootprints] = useState<FeatureCollection>();
  useEffect(() => {
    const footprintsCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features: []
    };
    const layer = discreteLayersStore.highlightedLayer;
    if(layer){
      const footprint = getLayerFootprint(layer, false, true);
      footprintsCollection.features.push(footprint);
    }
    setlayersFootprints(footprintsCollection);
  }, [discreteLayersStore.highlightedLayer]);

  return (
    <CesiumGeojsonLayer
      data={layersFootprints}
      onLoad={(geoJsonDataSouce): void => {
        geoJsonDataSouce.entities.values.forEach(item => {
          if(item.polyline) {
            (item.polyline.width as CesiumConstantProperty).setValue(FOOTPRINT_BORDER_WIDTH);
            // typings issue in CESIUM for refference https://github.com/CesiumGS/cesium/issues/8898
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            item.polyline.material = FOOTPRINT_BORDER_COLOR;
          }
          if(item.polygon){
            (item.polygon.outlineColor as CesiumConstantProperty).setValue(FOOTPRINT_BORDER_COLOR);
            // typings issue in CESIUM for refference https://github.com/CesiumGS/cesium/issues/8898
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            item.polygon.material = CesiumColor.fromRandom({alpha: 0.4});
          }
        });
      }}
    />
  );
});
