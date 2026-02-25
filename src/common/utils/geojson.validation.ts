import bolleanValid from '@turf/boolean-valid';
// import kinks from '@turf/kinks';
import booleanPointOnLine from '@turf/boolean-point-on-line';
import { lineString } from '@turf/helpers';
import { Geometry, Position } from 'geojson';
import { geoCustomChecks } from './geo.tools';
const gpsi = require('geojson-polygon-self-intersections');

export type severityLevel =
  | 'TRACE'
  | 'DEBUG'
  | 'INFO'
  | 'WARN'
  | 'ERROR'
  | 'FATAL';
export type geoJSONValidation = {
  valid: boolean;
  severity_level: severityLevel;
  reason: string;
};
export const EMPTY_JSON_STRING_VALUE = '{}';

const INTERSECTION_TOLLERANCE = 1e-11; // 0.01mm
const MAX_VERTECES = 300;
const LINEARING_MIN_POSITIONS = 4;

const hasTooManyVerteces = (geom: Geometry): boolean => {
  let totalVertices = 0;
  if (isValidGeometryType(geom)) {
    //@ts-ignore
    const polygons =
      geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;

    polygons.forEach((polygon: Position[][]) => {
      polygon.forEach((ring) => {
        totalVertices += ring.length;
      });
    });
  }
  return totalVertices >= MAX_VERTECES;
};

// export const hasSelfIntersections = (json: Geometry): boolean => {
//   return kinks(json as any).features.length > 0;
// }

export const hasSelfIntersections = (json: Geometry): boolean => {
  //@ts-ignore
  const filterFunc = (
    isect,
    ring0,
    edge0,
    start0,
    end0,
    frac0,
    ring1,
    edge1,
    start1,
    end1,
    frac1,
    unique
  ) => {
    const firstLine = lineString([start0, end0]);
    const secondLine = lineString([start1, end1]);
    const isPointOnFirstLine = booleanPointOnLine(isect, firstLine, {
      epsilon: INTERSECTION_TOLLERANCE,
    });
    const isPointOnSecondLine = booleanPointOnLine(isect, secondLine, {
      epsilon: INTERSECTION_TOLLERANCE,
    });

    if (isPointOnFirstLine && isPointOnSecondLine) {
      console.log('Intersection point(by gpsi): ', isect);
      return {
        isect,
        ring0,
        edge0,
        start0,
        end0,
        frac0,
        ring1,
        edge1,
        start1,
        end1,
        frac1,
        unique,
      };
    }

    return undefined;
  };

  const isects = gpsi(
    {
      type: 'Feature',
      geometry: json,
    },
    filterFunc
  );

  const isectsLength = isects.filter((obj: any) => obj !== undefined).length;

  return isectsLength > 0;
};

const isValidGeometryType = (json: Geometry): boolean => {
  return json.type === 'Polygon' || json.type === 'MultiPolygon';
};

const isAllGeometryLinearRingsValid = (geom: Geometry): geoJSONValidation => {
  if (isValidGeometryType(geom)) {
    //@ts-ignore
    const polygons =
      geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;

    for (const polygon of polygons) {
      for (const ring of polygon as Position[][]) {
        if (ring.length < LINEARING_MIN_POSITIONS) {
          return {
            valid: false,
            severity_level: 'ERROR',
            reason: 'geo_json-geometry-not-enough-points',
          };
        }
        if (
          ring[0][0] !== ring[ring.length - 1][0] ||
          ring[0][1] !== ring[ring.length - 1][1]
        ) {
          return {
            valid: false,
            severity_level: 'ERROR',
            reason: 'geo_json-geometry-not-closed-linear_ring',
          };
        }
      }
    }

    return {
      valid: true,
      severity_level: 'INFO',
      reason: '',
    };
  } else {
    return {
      valid: false,
      severity_level: 'ERROR',
      reason: 'geo_json-geometry-not-supported',
    };
  }
};

// Validate coordinates within the WGS84 range (-180 to 180 for longitude, -90 to 90 for latitude)
const isValidWGS84Coordinates = (geom: Geometry) => {
  const validatePolygonCoordinates = (coordinates: Position[][]) => {
    for (const ring of coordinates) {
      for (const coordinate of ring) {
        const [longitude, latitude] = coordinate;
        if (
          isNaN(longitude) ||
          isNaN(latitude) ||
          longitude < -180 ||
          longitude > 180 ||
          latitude < -90 ||
          latitude > 90
        ) {
          return false;
        }
      }
    }
    return true;
  };

  if (geom && geom.type) {
    if (geom.type === 'Polygon') {
      if (!validatePolygonCoordinates(geom.coordinates)) {
        return false;
      }
    } else if (geom.type === 'MultiPolygon') {
      for (const polygonCoordinates of geom.coordinates) {
        if (!validatePolygonCoordinates(polygonCoordinates)) {
          return false;
        }
      }
    }
  }

  return true;
};

export const validateGeoJSONString = (
  jsonValue: string,
  geoCustomChecks?: geoCustomChecks
): geoJSONValidation => {
  const res = {
    valid:
      jsonValue !== undefined &&
      jsonValue !== EMPTY_JSON_STRING_VALUE &&
      jsonValue !== '',
    severity_level: 'INFO',
    reason: '',
  } as geoJSONValidation;

  try {
    if (res.valid) {
      const geoJson = JSON.parse(jsonValue);
      if (!bolleanValid(geoJson)) {
        return {
          valid: false,
          severity_level: 'ERROR',
          reason: 'not-geo_json',
        };
      }
      if (!isValidGeometryType(geoJson)) {
        return {
          valid: false,
          severity_level: 'ERROR',
          reason: 'geo_json-geometry-not-supported',
        };
      }
      if (!isValidWGS84Coordinates(geoJson)) {
        return {
          valid: false,
          severity_level: 'ERROR',
          reason: 'geo_json-geometry-coordinates-not-wgs84',
        };
      }
      const linearRingsCheck = isAllGeometryLinearRingsValid(geoJson);
      if (linearRingsCheck.severity_level !== 'INFO') {
        return linearRingsCheck;
      }
      if (hasTooManyVerteces(geoJson)) {
        return {
          valid: true,
          severity_level: 'WARN',
          reason: 'geo_json-too_many_verteces',
        };
      }
      if (hasSelfIntersections(geoJson)) {
        return {
          valid: false,
          severity_level: 'ERROR',
          reason: 'geo_json-has_self_intersections',
        };
      }

      let validationArr: geoJSONValidation[] =
        [] as unknown as geoJSONValidation[];

      if (geoCustomChecks) {
        validationArr = geoCustomChecks.validationFunc
          .map((func) => func(geoJson, geoCustomChecks.validationFuncArgs))
          .filter((u) => u !== undefined) as geoJSONValidation[];
      }

      if (validationArr && validationArr.length) {
        return validationArr[0];
      }
    }
  } catch (e) {
    return {
      valid: false,
      severity_level: 'ERROR',
      reason: 'not-json',
    };
  }
  return res;
};
