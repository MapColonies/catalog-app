/* eslint-disable @typescript-eslint/ban-ts-comment */
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
import React from 'react';

const SELECTION_POLYGON_OUTLINE_COLOR = '#8a3e00';
const SELECTION_POLYGON_LINE_WIDTH = 2;

const HIGHLIGHT_OUTLINE_WIDTH = 5;
const SELECTION_OUTLINE_COLOR = CesiumColor.DODGERBLUE;

const UTMGridDataSource: React.FC = () => {
  return (
    <>
      <CesiumGeojsonLayer
        // TODO: Change the data source path.
        data={'./assets/data/utmzone.geojson'}
        onLoad={(geoJsonDataSource): void => {
          geoJsonDataSource.entities.values.forEach((item) => {
            let centerInDegrees;

            if (item.polyline) {
              (item.polyline.clampToGround as CesiumConstantProperty).setValue(
                true
              );
              (item.polyline.width as CesiumConstantProperty).setValue(
                HIGHLIGHT_OUTLINE_WIDTH
              );

              // @ts-ignore
              item.polyline.material = SELECTION_OUTLINE_COLOR;

              centerInDegrees = center(
                points(
                  // @ts-ignore
                  (
                    item.polyline.positions.getValue() as Record<
                      string,
                      unknown
                    >
                  ).map((pos) => {
                    const cartographicPos =
                      CesiumCartographic.fromCartesian(pos);
                    return [
                      CesiumMath.toDegrees(cartographicPos.latitude),
                      CesiumMath.toDegrees(cartographicPos.longitude),
                    ];
                  })
                )
              ).geometry.coordinates;
            }

            if (item.polygon) {
              // @ts-ignore
              (item.polygon.outlineColor as CesiumConstantProperty).setValue(
                CesiumColor.fromCssColorString(SELECTION_POLYGON_OUTLINE_COLOR)
              );
              (item.polygon.outlineWidth as CesiumConstantProperty).setValue(
                SELECTION_POLYGON_LINE_WIDTH
              );

              // @ts-ignore
              item.polygon.material = CesiumColor.TRANSPARENT;

              centerInDegrees = center(
                points(
                  // @ts-ignore
                  (
                    (
                      item.polygon.hierarchy.getValue() as Record<
                        string,
                        unknown
                      >
                    ).positions as CesiumCartesian3[]
                  ).map((pos) => {
                    const cartographicPos =
                      CesiumCartographic.fromCartesian(pos);
                    return [
                      CesiumMath.toDegrees(cartographicPos.latitude),
                      CesiumMath.toDegrees(cartographicPos.longitude),
                    ];
                  })
                )
              ).geometry.coordinates;
            }

            // @ts-ignore
            item.position = CesiumCartesian3.fromDegrees(
              centerInDegrees[1],
              centerInDegrees[0]
            ); // [lon, lat]

            const label = {
              // eslint-disable-next-line
              text: item.properties?.ZONE.getValue().toString() as string,
              font: '24px bold Roboto, Helvetica, Arial, sans-serif',
              fillColor: CesiumColor.fromCssColorString('#ea00ff'),
              outlineColor: CesiumColor.WHITE,
              outlineWidth: 2,
              showBackground: false,
              heightReference: 1,
              // disableDepthTestDistance: Number.POSITIVE_INFINITY,
            };

            // @ts-ignore
            item.label = label;
          });
        }}
      />
    </>
  );
};

export default UTMGridDataSource;
