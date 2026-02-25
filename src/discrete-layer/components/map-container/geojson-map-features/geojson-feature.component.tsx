import { useState, useEffect } from 'react';
import {
  CesiumMath,
  CesiumGeojsonLayer,
  CesiumConstantProperty,
  CesiumColor,
} from '@map-colonies/react-components';
import { polygonToLine } from '@turf/polygon-to-line';
import { Feature, LineString, Polygon, MultiLineString } from 'geojson';
import {
  useHeightFromTerrain,
  IPosition,
} from '../../../../common/hooks/useHeightFromTerrain';
import { IFeatureConfig } from '../../../views/components/data-fetchers/wfs-features-fetcher.component';
import { is2dArray } from '../../../../common/helpers/array';

interface FeatureConfig extends IFeatureConfig {}

export interface GeojsonFeatureProps {
  feature: Feature<LineString | MultiLineString | Polygon>;
  featureConfig?: FeatureConfig;
  isPolylined?: boolean;
}

export const GeojsonFeature: React.FC<GeojsonFeatureProps> = ({
  feature,
  featureConfig,
  isPolylined = false,
}) => {
  const [featureWithHeight, setFeatureWithHeight] =
    useState<Feature<LineString | MultiLineString | Polygon>>();
  const [transformedFeature, setTransformedFeature] =
    useState<Feature<LineString | MultiLineString | Polygon>>();
  const { setCoordinates, newPositions } = useHeightFromTerrain();

  useEffect(() => {
    if (isPolylined && feature.geometry.type === 'Polygon') {
      /* Polyline features fixes cesium bug with polygon visualization, Also allows us to clamp it to ground (Using terrain). */
      setTransformedFeature(
        polygonToLine(feature.geometry) as Feature<LineString | MultiLineString>
      );
    } else {
      setTransformedFeature(feature);
    }
  }, [feature]);

  useEffect(() => {
    if (transformedFeature) {
      switch (transformedFeature.geometry.type) {
        case 'LineString': {
          const posArr: IPosition[] =
            transformedFeature.geometry.coordinates.map((coord) => ({
              longitude: coord[0],
              latitude: coord[1],
            }));
          setCoordinates(posArr);
          break;
        }
        case 'MultiLineString':
        case 'Polygon': {
          const posArr: IPosition[][] =
            transformedFeature.geometry.coordinates.map((ring: any) =>
              ring.map((coord: any) => ({
                longitude: coord[0],
                latitude: coord[1],
              }))
            );
          setCoordinates(posArr);
          break;
        }
        default:
          break;
      }
    }
  }, [transformedFeature]);

  useEffect(() => {
    if (newPositions && transformedFeature) {
      // @ts-ignore
      const is2dArr = is2dArray(newPositions);

      const newCoordinates = is2dArr
        ? newPositions.map((ring: any) =>
            ring.map((coord: any) => [
              CesiumMath.toDegrees(coord.longitude),
              CesiumMath.toDegrees(coord.latitude),
              coord.height,
            ])
          )
        : newPositions.map((coord: any) => [
            CesiumMath.toDegrees(coord.longitude),
            CesiumMath.toDegrees(coord.latitude),
            coord.height,
          ]);

      setFeatureWithHeight({
        ...transformedFeature,
        // @ts-ignore
        geometry: {
          ...transformedFeature.geometry,
          coordinates: newCoordinates,
        },
      });
    }
  }, [newPositions, transformedFeature]);

  if (!featureWithHeight) return null;

  return (
    <CesiumGeojsonLayer
      clampToGround={true}
      key={featureWithHeight.id}
      data={featureWithHeight.geometry}
      onLoad={(geoJsonDataSource): void => {
        const featureFillColor = featureConfig?.color;
        const featureOutlineColor = featureConfig?.outlineColor;
        const lineWidth = featureConfig?.outlineWidth;

        geoJsonDataSource.entities.values.forEach((item) => {
          if (item.polyline) {
            // @ts-ignore
            item.polyline.material =
              CesiumColor.fromCssColorString(featureFillColor);
            (item.polyline.width as CesiumConstantProperty).setValue(lineWidth);
            (item.polyline.clampToGround as CesiumConstantProperty).setValue(
              true
            );
          }

          if (item.polygon) {
            // @ts-ignore
            (item.polygon.outlineColor as CesiumConstantProperty).setValue(
              CesiumColor.fromCssColorString(featureOutlineColor)
            );
            // @ts-ignore
            item.polygon.material =
              CesiumColor.fromCssColorString(featureFillColor);
            (item.polygon.outline as CesiumConstantProperty).setValue(true);
          }
        });
      }}
    />
  );
};
