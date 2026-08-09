import { BBox, Feature, Polygon } from 'geojson';
import bboxPolygon from '@turf/bbox-polygon';
import intersect from '@turf/intersect';
import difference from '@turf/difference';
import { Style, Stroke, Fill } from 'ol/style';

const FALLBACK_BBOX: BBox = [34.75, 31.95, 34.85, 32.05];
const OVERLAP_RATIO = 0.35;

const GREEN = '#00A651';
const BLUE = '#0074D9';
const ORANGE = '#FF7F00';
const RED = '#D0021B';
const FILL_ALPHA = '33'; // ~20% opacity

const styleOf = (color: string): Style =>
  new Style({
    stroke: new Stroke({ color, width: 2 }),
    fill: new Fill({ color: color + FILL_ALPHA }),
  });

export const EXISTING_COLOR = GREEN;
export const BACKUP_COLOR = BLUE;
export const CHANGES_ADDED_COLOR = ORANGE;
export const CHANGES_REMOVED_COLOR = RED;

export const EXISTING_STYLE = styleOf(GREEN);
export const BACKUP_STYLE = styleOf(BLUE);
export const CHANGES_ADDED_STYLE = styleOf(ORANGE);
export const CHANGES_REMOVED_STYLE = styleOf(RED);

export interface RevertOverlayFeatures {
  existing: Feature<Polygon>;
  backup: Feature<Polygon>;
  changesAdded: Feature<Polygon> | null;
  changesRemoved: Feature<Polygon> | null;
}

export const buildRevertOverlayFeatures = (bbox?: BBox): RevertOverlayFeatures => {
  const [minX, minY, maxX, maxY] = bbox ?? FALLBACK_BBOX;
  const width = maxX - minX;
  const height = maxY - minY;
  const offsetX = width * OVERLAP_RATIO;
  const offsetY = height * OVERLAP_RATIO;

  const existing = bboxPolygon([minX, minY, maxX - offsetX, maxY - offsetY]) as Feature<Polygon>;
  const backup = bboxPolygon([minX + offsetX, minY + offsetY, maxX, maxY]) as Feature<Polygon>;

  const changesAdded = intersect(existing, backup) as Feature<Polygon> | null;
  const changesRemoved = difference(backup, existing) as Feature<Polygon> | null;

  return { existing, backup, changesAdded, changesRemoved };
};
