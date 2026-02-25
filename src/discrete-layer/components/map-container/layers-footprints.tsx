/* eslint-disable */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { isObject, get } from 'lodash';
import { Feature, FeatureCollection } from 'geojson';
import {
  CesiumGeojsonLayer,
  CesiumColor,
  CesiumVerticalOrigin,
  CesiumLabelStyle,
  CesiumCartesian2,
  CesiumCartesian3,
  // CesiumBoundingSphere,
  // CesiumEllipsoid,
  CesiumConstantPositionProperty,
  CesiumConstantProperty,
} from '@map-colonies/react-components';
import CONFIG from '../../../common/config';
import { usePrevious } from '../../../common/hooks/previous.hook';
import { useStore } from '../../models/RootStore';
import { getLayerFootprint } from '../../models/layerImage';

const FOOTPRINT_BORDER_WIDTH = 2.0;

function upperLeft(points: CesiumCartesian3[]): CesiumCartesian3 {
  let top = points[0];
  for (let i = 1; i < points.length; i++) {
    const temp = points[i];
    if (temp.y < top.y || (temp.y === top.y && temp.x < top.x)) {
      top = temp;
    }
  }
  return top;
}

function upperRight(points: CesiumCartesian3[]): CesiumCartesian3 {
  let top = points[0];
  for (let i = 1; i < points.length; i++) {
    const temp = points[i];
    if (temp.x < top.x || (temp.x === top.x && temp.y < top.y)) {
      top = temp;
    }
  }
  return top;
}

function getLabelPosition(
  points: CesiumCartesian3[]
): CesiumConstantPositionProperty {
  //**********  https://sandcastle.cesium.com/index.html?src=GeoJSON%20and%20TopoJSON.html
  const center =
    CONFIG.I18N.DEFAULT_LANGUAGE == 'he'
      ? upperRight(points)
      : upperLeft(points);
  // **** Get center of "polygon" points ****
  // const center = CesiumBoundingSphere.fromPoints(points).center;
  // CesiumEllipsoid.WGS84.scaleToGeodeticSurface(center, center);
  return new CesiumConstantPositionProperty(center);
}

export const LayersFootprints: React.FC = observer(() => {
  const { discreteLayersStore } = useStore();
  const [layersFootprints, setlayersFootprints] = useState<FeatureCollection>();

  const prevLayersFootprints = usePrevious<FeatureCollection | undefined>(
    layersFootprints
  );
  const cacheRef = useRef({ type: 'FeatureCollection', features: [] } as
    | FeatureCollection
    | undefined);
  const cacheColorsRef = useRef({} as Record<string, CesiumColor>);

  useEffect(() => {
    if (discreteLayersStore.layersImages) {
      const footprintsCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };
      const footprintsFeaturesArray = discreteLayersStore.layersImages
        .filter((layer) => layer.footprintShown)
        .map((layer) => {
          return getLayerFootprint(layer, false);
        });
      footprintsCollection.features.push(...footprintsFeaturesArray);
      setlayersFootprints(footprintsCollection);
    }
  }, [discreteLayersStore.layersImages]);

  const isSameFeatureCollection = (
    source: FeatureCollection | undefined,
    target: FeatureCollection | undefined
  ): boolean => {
    let res = false;
    if (source && target && source.features.length === target.features.length) {
      let matchesRes = true;
      source.features.forEach((srcFeat: Feature) => {
        const match = target.features.find((targetFeat: Feature) => {
          return (
            get(targetFeat, 'properties.id') === get(srcFeat, 'properties.id')
          );
        });
        matchesRes = matchesRes && isObject(match);
      });
      res = matchesRes;
    }

    return res;
  };

  const getFootprints = (): FeatureCollection | undefined => {
    let cache = cacheRef.current;
    if (isSameFeatureCollection(prevLayersFootprints, layersFootprints)) {
      return cache;
    } else {
      cache = cacheRef.current = layersFootprints;
      return cache;
    }
  };

  const getColor = (
    id: string,
    options?: Record<string, unknown>
  ): CesiumColor => {
    const colorHash = cacheColorsRef.current;
    let color = colorHash[id];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,@typescript-eslint/strict-boolean-expressions
    if (!color) {
      color = CesiumColor.fromRandom(options);
      colorHash[id] = color;
    }
    return color;
  };

  return (
    <CesiumGeojsonLayer
      clampToGround={true}
      data={getFootprints()}
      onLoad={(geoJsonDataSouce): void => {
        geoJsonDataSouce.entities.values.forEach((item) => {
          let positions = null;
          let bckColor = null;
          if (item.polyline) {
            const color = getColor(get(item, 'properties.id'), { alpha: 1 });
            (item.polyline.width as CesiumConstantProperty).setValue(
              FOOTPRINT_BORDER_WIDTH
            );
            // typings issue in CESIUM for reference https://github.com/CesiumGS/cesium/issues/8898
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            item.polyline.material = color;

            positions =
              item.polyline.positions?.getValue() as CesiumCartesian3[];
            bckColor = color;
          }
          if (item.polygon) {
            const color = getColor(get(item, 'properties.id'), {
              blue: 1,
              alpha: 1,
            });

            item.polygon.outlineColor = color;
            item.polygon.material = CesiumColor.fromAlpha(color, 0.1);
            positions = item.polygon.hierarchy.getValue().positions;
            bckColor = color;
          }

          item.position = getLabelPosition(positions);

          const label = {
            text: item.properties.id.getValue().toString().substring(0, 4),
            font: '12px Roboto, Helvetica, Arial, sans-serif',
            fillColor: CesiumColor.WHITE,
            // outlineColor: CesiumColor.WHITE,
            // outlineWidth: 4,
            // style: CesiumLabelStyle.FILL_AND_OUTLINE,
            style: CesiumLabelStyle.FILL,
            verticalOrigin: CesiumVerticalOrigin.BOTTOM,
            pixelOffset: new CesiumCartesian2(0, 8),
            backgroundColor: bckColor,
            showBackground: true,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          };

          item.label = label;
        });
      }}
      // onError={action('onError')}
    />
  );
});
