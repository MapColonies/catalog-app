// @ts-nocheck
import {
  CesiumCartesian3,
  CesiumCartographic,
  CesiumColor,
  CesiumConstantProperty,
  CesiumGeojsonLayer,
  CesiumMath,
} from '@map-colonies/react-components';
import center from '@turf/center';
import { points } from '@turf/helpers';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useStore } from '../../models';
import ExportLayerHighLightSelection from './export-layer.highlight-selection';
import useGetEntityLabelForDomain from './hooks/useGetEntityLabelForDomain';

const SELECTION_POLYGON_OUTLINE_COLOR = '#22ABDD';
const SELECTION_POLYGON_OPACITY = 0.5;
const SELECTION_POLYGON_LINE_WIDTH = 2;

const ExportPolygonsRenderer: React.FC = observer(() => {
  const store = useStore();
  const exportGeometrySelections = store.exportStore.geometrySelectionsCollection;
  const getEntityLabel = useGetEntityLabelForDomain();

  return (
    <>
      <CesiumGeojsonLayer
        clampToGround={true}
        data={exportGeometrySelections}
        onLoad={(geoJsonDataSource): void => {
          geoJsonDataSource.entities.values.forEach((item, i) => {
            if (item.polygon) {
              (item.polygon.outlineColor as CesiumConstantProperty).setValue(
                CesiumColor.fromCssColorString(SELECTION_POLYGON_OUTLINE_COLOR)
              );
              (item.polygon.outlineWidth as CesiumConstantProperty).setValue(
                SELECTION_POLYGON_LINE_WIDTH
              );

              item.polygon.material = CesiumColor.CYAN.withAlpha(SELECTION_POLYGON_OPACITY);

              const centerInDegrees = center(
                points(
                  (
                    (item.polygon.hierarchy.getValue() as Record<string, unknown>)
                      .positions as CesiumCartesian3[]
                  ).map((pos) => {
                    const cartographicPos = CesiumCartographic.fromCartesian(pos);
                    return [
                      CesiumMath.toDegrees(cartographicPos.latitude),
                      CesiumMath.toDegrees(cartographicPos.longitude),
                    ];
                  })
                )
              ).geometry.coordinates;

              item.position = CesiumCartesian3.fromDegrees(centerInDegrees[1], centerInDegrees[0]); // [lon, lat]

              const label = {
                // eslint-disable-next-line
                text: getEntityLabel(item),
                font: '16px Roboto, Helvetica, Arial, sans-serif',
                fillColor: CesiumColor.WHITE,
                outlineColor: CesiumColor.BLACK,
                outlineWidth: 2,
                showBackground: true,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              };

              item.label = label;
            }
          });
        }}
      />

      <ExportLayerHighLightSelection />
    </>
  );
});

export default ExportPolygonsRenderer;
