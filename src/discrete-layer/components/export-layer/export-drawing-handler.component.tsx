import {
  CesiumColor,
  CesiumDrawingsDataSource,
  CesiumRectangle,
  DrawType,
  useCesiumMap,
} from '@map-colonies/react-components';
import bbox from '@turf/bbox';
// import area from '@turf/area';
import { Feature } from 'geojson';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { useStore } from '../../models';
import { applyFactor } from '../helpers/layersUtils';

const DRAWING_MATERIAL_OPACITY = 0.5;
const DRAWING_MATERIAL_COLOR = CesiumColor.CYAN.withAlpha(
  DRAWING_MATERIAL_OPACITY
);

export interface IDrawingState {
  drawing: boolean;
  type: DrawType;
}

const ExportDrawingHandler: React.FC = observer(() => {
  const store = useStore();
  const cesiumViewer = useCesiumMap();
  const { drawing, type } = store.exportStore.drawingState as IDrawingState;

  useEffect(() => {
    return (): void => {
      store.exportStore.resetDrawingState();
    };
  }, []);

  useEffect(() => {
    if (store.exportStore.hasExportPreviewed) {
      const selectedRoi = store.exportStore.geometrySelectionsCollection;
      const features = [...selectedRoi.features];

      // ***********************************************************************************************************
      // ***** Currentlty exported layer footprint not added to calculation of export preview, might be reconsidered
      // ***********************************************************************************************************
      // const MAX_LAYER_AREA_FOR_PREVIEW = 9500000; // ~ 1/50 of whole EARTH surface, in square km
      // const layerFootprint = store.exportStore.layerToExport?.footprint as Geometry;
      // const layerPolygon = { type: 'Feature', properties:{}, geometry: layerFootprint} as Feature;
      // const layerArea = area(layerPolygon) / 1000000;
      // if (layerArea < MAX_LAYER_AREA_FOR_PREVIEW) {
      //   features.push(layerPolygon);
      // }

      const bboxWithLayerToExport = {
        ...selectedRoi,
        features,
      };

      const selectedFeaturesRect = CesiumRectangle.fromDegrees(
        ...bbox(bboxWithLayerToExport)
      ) as CesiumRectangle;
      applyFactor(selectedFeaturesRect);

      cesiumViewer.camera.flyTo({ destination: selectedFeaturesRect });
    }
  }, [store.exportStore.hasExportPreviewed]);

  return (
    <CesiumDrawingsDataSource
      drawings={[]}
      drawState={{
        drawing,
        type,
        handler: (draw): void => {
          store.exportStore.setTempRawSelection(draw.geojson as Feature);
          store.exportStore.resetDrawingState();
        },
      }}
      drawingMaterial={DRAWING_MATERIAL_COLOR}
    />
  );
});

export default ExportDrawingHandler;
