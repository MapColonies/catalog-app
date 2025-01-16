import { topology } from 'topojson-server';
import { feature } from 'topojson-client';
import bbox from "@turf/bbox";
import bboxPolygon from "@turf/bbox-polygon";
import booleanContains from "@turf/boolean-contains";
import { AllGeoJSON, Properties, FeatureCollection } from "@turf/helpers";
import mask from "@turf/mask";
import polygonToLine from "@turf/polygon-to-line";
import simplify from "@turf/simplify";
import * as turf from '@turf/turf';
import { Feature, MultiPolygon, Polygon, Position, Geometry } from "geojson";
import { PolygonPartRecordModelType } from "../../discrete-layer/models";

export const ZERO_MERIDIAN = 0;
export const ANTI_MERIDIAN = 180;
const checkPolygon = (coordinates: Position[][], meridian: number) => {
    for (const ring of coordinates) {
        for (let i = 0; i < ring.length - 1; i++) {
            const start = ring[i];
            const end = ring[i + 1];

            // Check if one point is on one side of the meridian and the other point is on the other side
            if ((start[0] < meridian && end[0] > meridian) || (start[0] > meridian && end[0] < meridian)) {
                return true;
            }
        }
    }
    return false;
}

export const crossesMeridian = (geometry: Polygon | MultiPolygon, meridian: number) => {
    const type = geometry.type;

    if (type === 'Polygon') {
        return checkPolygon(geometry.coordinates, meridian);
    } else if (type === 'MultiPolygon') {
        for (const polygon of geometry.coordinates) {
            if (checkPolygon(polygon, meridian)) {
                return true;
            }
        }
    }
    return false;
}

/*
****** Current solution is using TURF MASK

There is 2 alternatives to get perimeter(outlined feature)
1. Use TURF DISSOLVE and COMBINE (inspired by https://codesandbox.io/p/sandbox/beautiful-morning-iy8xj)
        turf.combine(turf.dissolve(collection));

2. Use TURF UNIN and CONVEX
        const unitedPolygon: Feature = features.reduce((acc, curr) => {
            const currUnion = union(acc,curr);
            return currUnion;
        }, features[0]);
        const convexHullFromUnion: Feature = convex(unitedPolygon.geometry);
*/
const QUANTIZATION_TOLERANCE = 1e6;
const SIMPLIFY_TOLERANCE =  0.0001; // maximum allowed deviation(degrees) of simplified points from the original geometry
// 0.0001 works good for geometries from ~200m(linear dimensions) 
// but for a large geometries number of vertices might be relatively big and not so relevant for UI 
export const getOutlinedFeature = (features: Feature<Polygon | MultiPolygon, Properties>[]) => {
    const masked = mask({
        type: 'FeatureCollection',
        features: applyTopology(features, QUANTIZATION_TOLERANCE)
    });
    // Remove whole world geometry
    masked.geometry.coordinates = masked.geometry.coordinates.slice(1);
    
    return simplify(
        polygonToLine(masked), 
        {tolerance: SIMPLIFY_TOLERANCE, highQuality: false}
    );
}

export const applyTopology = (features: Feature<Polygon | MultiPolygon, Properties>[], quantization: number): Feature<Polygon | MultiPolygon, Properties>[]  => {
    const polygons: Record<string,Geometry> = {};
    features.forEach((feat, idx) => {
        polygons[idx] = {
            ...feat.geometry
        } as unknown as Geometry;
    });

    const pp_topology = topology(polygons, quantization );
    const ret_features: Feature<Polygon | MultiPolygon, Properties>[] = [];

    Object.entries(polygons).forEach(([key, val]) => {
      const topo_feat = feature(pp_topology, pp_topology.objects[key]);
      ret_features.push(topo_feat as never);
    });

    return ret_features;
}

export const isGeometryPolygon =  (geometry: Geometry) => geometry ? geometry.type === 'Polygon' : true;

export const polygonVertexDensityFactor = (polygon: Feature, tolerance: number): number => {
    const vertices_org = explode(polygon as AllGeoJSON).features.map(f => f.geometry.coordinates);
    const vertices_simpl = explode(turf.simplify(
            polygon as AllGeoJSON, 
            {tolerance, highQuality: false}
        ))
        .features.map(f => f.geometry.coordinates);
    console.log("simple vs org vertices count:", vertices_org.length, "to:", vertices_simpl.length, `(${vertices_simpl.length/vertices_org.length})`);

    return vertices_simpl.length/vertices_org.length;
}

export const isPolygonContainsPolygon = (polygon: Feature, polygonToCheck: Feature): boolean => {
    const polygonBBox = bbox(polygon);
    const polygonBBoxPolygon = bboxPolygon(polygonBBox);

    const polygonToCheckBBox = bbox(polygonToCheck);
    const polygonToCheckBBoxPolygon = bboxPolygon(polygonToCheckBBox);
    return booleanContains(polygonBBoxPolygon, polygonToCheckBBoxPolygon);
};

export const getFirstPoint = (geojson: Geometry): Position => {
    // @ts-ignore
    const { type, coordinates } = geojson;
  
    switch (type) {
      case "Point":
        return coordinates;
  
      case "LineString":
      case "MultiPoint":
        return coordinates[0];
  
      case "Polygon":
      case "MultiLineString":
        return coordinates[0][0];
  
      case "MultiPolygon":
        return coordinates[0][0][0];
  
      default:
        throw new Error("Unsupported GeoJSON geometry type");
    }
}

export const explode = (geometry: AllGeoJSON) => {
    return turf.explode(geometry)
}

export const area = (geometry: AllGeoJSON) => {
    return turf.area(geometry as unknown as  Feature<any> | FeatureCollection<any> | turf.helpers.Geometry);
}

// Function to detect small holes in Polygon and MultiPolygon
export const countSmallHoles = (feature:  Feature<any>, threshold: number) => {
  let ret = 0;
  const featureGeometry = feature.geometry ?? feature;
  const type = featureGeometry.type;

  if (type === 'Polygon') {
    ret = countPolygonHoles(featureGeometry.coordinates, threshold);
  } else if (type === 'MultiPolygon') {
    featureGeometry.coordinates.forEach((polygon: Position[][]) => {
      ret += countPolygonHoles(polygon, threshold);
    });
  } else {
    console.log('Feature is not a Polygon or MultiPolygon.');
  }

  if(ret > 0){
    console.log('Feature has holes', ret);
  }
  return ret;
}

const countPolygonHoles = (coordinates: Position[][], threshold: number): number => {
  let ret = 0;
  const [outerRing, ...holes] = coordinates;
  holes.forEach((hole) => {
    const holePolygon = turf.polygon([hole]);
    const holeArea = turf.area(holePolygon);
    if (holeArea <= threshold) {
      ret++;
    }
  });
  return ret;
}

export const getGapsByConvexHull = (polygonsData: {
    [x: string]: PolygonPartRecordModelType;
}) => {
    const polygonsCoordinates = Object.values(polygonsData).map(
        (poly: PolygonPartRecordModelType) => poly.footprint.coordinates);
    const turfPolygons = polygonsCoordinates.map(
        (coordinate) => turf.polygon(coordinate));
    const polygonsCollection = turf.featureCollection(turfPolygons);
    // @ts-ignore
    const mergedPolygons = polygonsCollection.features.reduce((acc, curr) => {
        return acc ? turf.union(acc, curr) : curr;
    }, null);
    const convexHull = turf.convex(polygonsCollection);
    return convexHull? turf.difference(convexHull, mergedPolygons): null;
};

