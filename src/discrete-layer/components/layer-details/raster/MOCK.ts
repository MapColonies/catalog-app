import { Feature, GeoJsonProperties, Geometry, MultiPolygon, Polygon } from 'geojson';
import area from '@turf/area';
import difference from '@turf/difference';
import { Fill, Stroke, Style } from 'ol/style';

export enum RevertOverlayZIndex {
  EXISTING = 21,
  BACKUP = 22,
  CHANGES_AREA = 23,
}

export const EXISTING_COLOR = '#22C55E';
export const BACKUP_COLOR = '#3B82F6';
export const CHANGES_ADDED_COLOR = '#FF7F00'; // #FF3401
export const CHANGES_REMOVED_COLOR = '#C62828';

const strokeAndFillStyle = (color: string): Style =>
  new Style({
    stroke: new Stroke({ width: 3, color }),
    fill: new Fill({ color: `${color}33` }),
  });

export const EXISTING_STYLE = strokeAndFillStyle(EXISTING_COLOR);
export const BACKUP_STYLE = strokeAndFillStyle(BACKUP_COLOR);
export const CHANGES_ADDED_STYLE = strokeAndFillStyle(CHANGES_ADDED_COLOR);
export const CHANGES_REMOVED_STYLE = strokeAndFillStyle(CHANGES_REMOVED_COLOR);

const SQUARE_METERS_PER_SQUARE_KM = 1_000_000;

type PolygonalGeometry = Polygon | MultiPolygon;

const isPolygonal = (geometry: Geometry | undefined | null): geometry is PolygonalGeometry =>
  geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon';

const toFeature = (geometry: PolygonalGeometry): Feature<PolygonalGeometry> => ({
  type: 'Feature',
  geometry,
  properties: null as GeoJsonProperties,
});

export interface ChangesArea {
  added: Feature<PolygonalGeometry> | null;
  removed: Feature<PolygonalGeometry> | null;
  areaSquareKm: number;
}

const EMPTY_CHANGES_AREA: ChangesArea = { added: null, removed: null, areaSquareKm: 0 };

export const buildChangesArea = (
  existingFootprint: Geometry | undefined | null,
  backupOuterPerimeter: Geometry | undefined | null
): ChangesArea => {
  if (!isPolygonal(existingFootprint) || !isPolygonal(backupOuterPerimeter)) {
    return EMPTY_CHANGES_AREA;
  }

  const existingFeature = toFeature(existingFootprint);
  const backupFeature = toFeature(backupOuterPerimeter);

  const added = difference(backupFeature, existingFeature);
  const removed = difference(existingFeature, backupFeature);

  const areaSquareMeters = (added ? area(added) : 0) + (removed ? area(removed) : 0);

  return {
    added,
    removed,
    areaSquareKm: areaSquareMeters / SQUARE_METERS_PER_SQUARE_KM,
  };
};
