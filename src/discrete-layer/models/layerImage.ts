/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Feature, FeatureCollection, Geometry, Polygon } from 'geojson';
import polygonToLine from '@turf/polygon-to-line';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import convex from '@turf/convex';
import { shrinkExtremeCoordinatesInOuterRing } from '../../common/utils/geo.tools';
import { LayerMetadataMixedUnion } from './LayerMetadataMixedModelSelector';

export type ILayerImage = LayerMetadataMixedUnion;

export const getLayerFootprint = (layer: ILayerImage, isBbox: boolean, isPolylined = false, isConvexHull = false) : Feature | FeatureCollection => {
  if (layer.footprint === undefined) {
    return {
      type: 'Feature',
      // @ts-ignore
      geometry: null
    };
  }

  if (isBbox) {
    let geometry: Geometry = layer.footprint as Geometry;
    switch (geometry.type) {
      // case 'Polygon':
      //   geometry = (polygonToLine(geometry) as Feature).geometry;
      //   break;
      case 'MultiPolygon':
        //get bbox of feature, then convert it to polygon and finally get linestring of polygon
        geometry = (bboxPolygon(bbox(geometry)) as Feature).geometry;
        break;
      default:
        break;
    }

    if (isPolylined) {
      geometry = (polygonToLine(geometry as Polygon) as Feature).geometry;
    }
    
    return {
      type: 'Feature',
      geometry: { 
        ...geometry,
      },
      properties: {
        id: layer.id,
        name: layer.productName,
        description: layer.description,
      }
    };
  } else {
    let geometry: Geometry = shrinkExtremeCoordinatesInOuterRing(layer.footprint as Geometry, 0.999);
    if (isConvexHull) {
      // @ts-ignore
      geometry = isPolylined ? (polygonToLine(convex(geometry)) as Feature).geometry : (convex(geometry) as Feature).geometry;
      return {
        type: 'Feature',
        geometry: { 
          ...geometry,
        },
        properties: {
          id: layer.id,
          name: layer.productName,
          description: layer.description,
        },
      };
    } else {
      if (isPolylined) {
        return {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ...polygonToLine(geometry),
          properties: {
            id: layer.id,
            name: layer.productName,
            description: layer.description,
          },
        } as Feature
      } else {
        return {
          type: 'Feature',
          geometry: { 
            ...geometry,
          },
          properties: {
            id: layer.id,
            name: layer.productName,
            description: layer.description,
          },
        };
      }
    }
  }
}
