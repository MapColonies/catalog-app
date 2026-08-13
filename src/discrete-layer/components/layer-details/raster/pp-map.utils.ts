import { Feature } from 'geojson';
import { get } from 'lodash';
import { Style, Stroke, Fill, Text, Icon } from 'ol/style';
import CONFIG from '../../../../common/config';
import { IEnumsMapType } from '../../../../common/contexts/enumsMap.context';
import { dateFormatter } from '../../../../common/helpers/formatters';
import { LayerRasterRecordModelType } from '../../../models/LayerRasterRecordModel';
import { FeatureType } from './feature-type.enum';

export const EXCEEDED_PROPERTY_NAME = 'res_exceed';
export const EXCEEDED_PROPERTY_VALUE = 'true';

export const START_RASTER_LAYER_ZINDEX = 10;
export enum VectorLayerZIndex {
  EXISTING = 20,
  LOW_RESOLUTION = 30,
  EXCEEDED = 40,
  SELECTED = 50,
  BACKUP = 60,
  CHANGED_AREA = 70,
}

export interface IStyleByProp {
  style: Style;
  backgroundImage?: string;
  prop?: string;
  values?: {
    value: string | number | boolean;
    style: Style;
  }[];
}

function createHatchPatternGISStyle(color: string, opacity = 0.45): CanvasPattern {
  const size = 20;
  const lineWidth = 1.5;

  const canvas = document.createElement('canvas');

  // Higher resolution helps keep diagonal lines crisp.
  const dpr = window.devicePixelRatio || 1;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const ctx = canvas.getContext('2d')!;

  // Draw in CSS-pixel coordinates.
  ctx.scale(dpr, dpr);

  // Transparent background.
  ctx.clearRect(0, 0, size, size);

  // Hatch configuration.
  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  // Straight 45° diagonal lines.
  ctx.beginPath();

  // Main diagonal.
  ctx.moveTo(0, size);
  ctx.lineTo(size, 0);

  // Continuation to the left.
  ctx.moveTo(-size, size);
  ctx.lineTo(0, 0);

  // Continuation to the right.
  ctx.moveTo(size, size);
  ctx.lineTo(size * 2, 0);

  ctx.stroke();

  // Reset state before creating the pattern.
  ctx.globalAlpha = 1;

  const pattern = ctx.createPattern(canvas, 'repeat');

  if (!pattern) {
    throw new Error('Failed to create hatch pattern');
  }

  return pattern;
}

function createHatchPattern(
  color: string,
  opacity: number
): {
  pattern: CanvasPattern;
  backgroundImage: string;
} {
  const canvas = document.createElement('canvas');
  const size = 16;

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 2;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  // Straight 45° diagonal hatch
  ctx.beginPath();

  ctx.moveTo(0, size);
  ctx.lineTo(size, 0);

  ctx.moveTo(-size, size);
  ctx.lineTo(0, 0);

  ctx.moveTo(size, size);
  ctx.lineTo(2 * size, 0);

  ctx.stroke();

  const pattern = ctx.createPattern(canvas, 'repeat')!;

  return {
    pattern,
    backgroundImage: `url(${canvas.toDataURL('image/png')})`,
  };
}

const FILL_OPACITY = '66';
const SOURCE_EXTENT = '#7F00FF';
const PP_PERIMETER_COLOR = '#000000';
const LOW_RESOLUTION_COLOR = '#FF7F00';
const CHANGED_AREA_ADDED_COLOR = '#ef4444';
const CHANGED_AREA_OVERLAPPED_COLOR = '#FF7F00';
const BACKUP_COLOR = '#3b82f6';
const hatchChangedAreaAdded = createHatchPattern(CHANGED_AREA_ADDED_COLOR, 0.45);
const hatchChangedAreaOverlapped = createHatchPattern(CHANGED_AREA_OVERLAPPED_COLOR, 0.45);
export const PPMapStyles = new Map<FeatureType, IStyleByProp>([
  [
    FeatureType.SOURCE_EXTENT,
    {
      style: new Style({
        stroke: new Stroke({
          width: 4,
          color: SOURCE_EXTENT,
        }),
      }),
    },
  ],
  [
    FeatureType.SOURCE_EXTENT_MARKER,
    {
      style: new Style({
        image: new Icon({
          scale: 0.2,
          anchor: [0.5, 1],
          src: 'assets/img/map-marker.gif',
        }),
      }),
    },
  ],
  [
    FeatureType.PP_PERIMETER,
    {
      style: new Style({
        stroke: new Stroke({
          width: 4,
          color: PP_PERIMETER_COLOR,
        }),
      }),
    },
  ],
  [
    FeatureType.PP_PERIMETER_MARKER,
    {
      style: new Style({
        image: new Icon({
          scale: 0.2,
          anchor: [0.5, 1],
          src: 'assets/img/map-marker.gif',
        }),
      }),
    },
  ],
  [
    FeatureType.EXISTING_PP,
    {
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: CONFIG.CONTEXT_MENUS.MAP.POLYGON_PARTS_FEATURE_CONFIG.outlineColor,
        }),
        fill: new Fill({
          color: CONFIG.CONTEXT_MENUS.MAP.POLYGON_PARTS_FEATURE_CONFIG.color,
        }),
      }),
    },
  ],
  [
    FeatureType.EXISTING_PP_FOOTPRINT_MARKER,
    {
      style: new Style({
        image: new Icon({
          scale: 0.2,
          anchor: [0.5, 1],
          src: 'assets/img/map-marker.gif',
        }),
      }),
    },
  ],
  [
    FeatureType.LOW_RESOLUTION_PP,
    {
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: LOW_RESOLUTION_COLOR,
        }),
        fill: new Fill({
          color: LOW_RESOLUTION_COLOR + FILL_OPACITY,
        }),
      }),
      prop: EXCEEDED_PROPERTY_NAME,
      values: [
        {
          value: EXCEEDED_PROPERTY_VALUE,
          style: new Style({
            stroke: new Stroke({
              width: 2,
              color: CONFIG.POLYGON_PARTS.STYLE.lowResolutionColor,
            }),
            fill: new Fill({
              color: CONFIG.POLYGON_PARTS.STYLE.lowResolutionColor + FILL_OPACITY,
            }),
          }),
        },
      ],
    },
  ],
  [
    FeatureType.BACKUP_PP,
    {
      style: new Style({
        fill: new Fill({
          color: hatchChangedAreaAdded.pattern,
        }),
        stroke: new Stroke({
          color: CHANGED_AREA_ADDED_COLOR,
          width: 2,
          color: BACKUP_PP_COLOR,
          lineDash: [10, 5],
        }),
        fill: new Fill({
          color: BACKUP_PP_COLOR + FILL_OPACITY,
        }),
      }),
      backgroundImage: hatchChangedAreaAdded.backgroundImage,
    },
  ],
  [
    FeatureType.CHANGED_AREA_OVERLAPPED_PP,
    {
      style: new Style({
        fill: new Fill({
          color: hatchChangedAreaOverlapped.pattern,
        }),
        stroke: new Stroke({
          color: CHANGED_AREA_OVERLAPPED_COLOR,
          width: 2,
        }),
      }),
      backgroundImage: hatchChangedAreaOverlapped.backgroundImage,
    },
  ],
  [
    FeatureType.CHANGED_AREA_ADDED_PP,
    {
      style: new Style({
        fill: new Fill({
          color: createHatchPattern('#EF4444', 0.45), //Alternative function createHatchPatternGISStyle()
        }),
        stroke: new Stroke({
          color: '#EF4444',
          width: 2,
          color: BACKUP_COLOR,
          lineDash: [10, 5],
        }),
        fill: new Fill({
          color: BACKUP_COLOR + FILL_OPACITY,
        }),
      }),
    },
  ],
]);

const getColor = (color: unknown): string | undefined => {
  if (!color || typeof color !== 'string') {
    return undefined;
  }

  return color;
};

export function getCSSFromOlStyle(OLStyleConf: IStyleByProp | undefined): React.CSSProperties {
  if (!OLStyleConf) {
    return {};
  }

  const style = OLStyleConf.style;
  const image = OLStyleConf.backgroundImage;
  const stroke = style.getStroke();
  const fill = style.getFill();

  const css: React.CSSProperties = {};

  // Border
  if (stroke) {
    const strokeColor = getColor(stroke.getColor());
    const width = stroke.getWidth() ?? 1;
    const lineDash = stroke.getLineDash();

    if (strokeColor) {
      if (lineDash?.length) {
        // CSS cannot represent arbitrary lineDash values directly.
        // Approximate OpenLayers lineDash with a dashed border.
        css.border = `${width}px dashed ${strokeColor}`;
      } else {
        css.border = `${width}px solid ${strokeColor}`;
      }
    }
  }

  // Background
  if (image) {
    css.backgroundImage = image;
    css.backgroundSize = 8;
    css.backgroundRepeat = 'repeat';
  } else if (fill) {
    const fillColor = getColor(fill.getColor());

    if (fillColor) {
      css.backgroundColor = fillColor;
    }
  }

  return css;
}

export const getStyleByFeatureType = (feature?: Feature): Style | undefined => {
  const defaultStyle = PPMapStyles.get(FeatureType.EXISTING_PP)?.style;
  if (!feature) {
    return defaultStyle;
  }
  const featureType = get(feature.properties, '_featureType');
  const styleByProp = featureType ? PPMapStyles.get(featureType) : undefined;
  if (!styleByProp) {
    return defaultStyle;
  }
  const baseStyle = styleByProp.style ?? defaultStyle;
  if (!styleByProp.prop || !styleByProp.values || styleByProp.values.length === 0) {
    return baseStyle;
  }
  const propValue = get(feature.properties, styleByProp.prop);
  const matchedStyle = styleByProp.values.find((entry) => entry.value === propValue)?.style;
  return matchedStyle ?? baseStyle;
};

export const getWFSFeatureTypeName = (
  layerRecord: LayerRasterRecordModelType | null,
  enums: IEnumsMapType
) => {
  // Naming convention of polygon parts feature typeName
  // polygonParts:{productId}-{productType}
  return layerRecord
    ? `${CONFIG.POLYGON_PARTS.FEATURE_TYPE_PREFIX}${layerRecord.productId}-${
        enums[layerRecord.productType as string].realValue
      }`
    : 'SHOULD_BE_CALCULATED_FROM_UPDATED_LAYER';
};

// Inspired by https://openlayers.org/en/latest/examples/vector-labels.html
const stringDivider = (str: string, width: number, spaceReplacer: string): string => {
  if (str.length > width) {
    let p = width;
    while (p > 0 && str[p] !== ' ' && str[p] !== '-') {
      p--;
    }
    if (p > 0) {
      let left;
      if (str.substring(p, p + 1) === '-') {
        left = str.substring(0, p + 1);
      } else {
        left = str.substring(0, p);
      }
      const right = str.substring(p + 1);
      return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
    }
  }
  return str;
};

export const getText = (
  feature: Feature,
  resolution: number,
  featureConfig: Record<string, string>,
  ZOOM_LEVELS_TABLE: Record<string, number>,
  defaultText?: string
) => {
  const type = get(feature.properties, 'text') ?? featureConfig.text;
  const maxResolution = parseInt(featureConfig.maxreso);

  let featureResolution = get(feature.properties, 'resolutionDegree');

  let zoomLevel = Object.values(ZOOM_LEVELS_TABLE)
    .map((res) => res.toString())
    .findIndex((val) => val === get(feature.properties, 'resolutionDegree')?.toString());

  if (typeof featureResolution == 'string' && featureResolution?.includes('(')) {
    featureResolution = featureResolution.split(/[()]/)[1];
    zoomLevel = parseFloat(featureResolution);
  }
  const ingestionDateUTC = dateFormatter(get(feature.properties, 'imagingTimeEndUTC'), false);
  const updatedInVersion = get(feature.properties, 'productVersion');

  let text = defaultText ?? '';

  if (zoomLevel > -1) {
    text = `${ingestionDateUTC}\n\nv${updatedInVersion} (${zoomLevel})`;
  }

  if (resolution > maxResolution) {
    text = '';
  } else if (type === 'hide') {
    text = '';
  } else if (type === 'shorten') {
    text = text.substring(12);
  } else if (type === 'wrap' && (!featureConfig.placement || featureConfig.placement !== 'line')) {
    text = stringDivider(text, 16, '\n');
  }

  return text;
};

export const FEATURE_LABEL_CONFIG = {
  // points: {
  // },
  // lines: {
  // },
  polygons: {
    text: 'normal',
    align: 'center',
    baseline: 'middle',
    rotation: '0',
    font: 'Roboto',
    weight: 'bold',
    placement: 'point',
    maxangle: '0.7853981633974483',
    overflow: 'false',
    size: '10px',
    height: '1',
    offsetX: '0',
    offsetY: '0',
    color: '#00ff00',
    outlineWidth: '3',
    maxreso: '1200',
  },
};

export const createTextStyle = (
  feature: Feature,
  resolution: number,
  featureConfig: Record<string, string>,
  ZOOM_LEVELS_TABLE: Record<string, number>,
  defaultText?: string
) => {
  const align = featureConfig.align;
  const baseline = featureConfig.baseline;
  const size = featureConfig.size;
  const height = featureConfig.height;
  const offsetX = parseInt(featureConfig.offsetX, 10);
  const offsetY = parseInt(featureConfig.offsetY, 10);
  const weight = featureConfig.weight;
  const placement = featureConfig.placement ? featureConfig.placement : undefined;
  const maxAngle = featureConfig.maxangle ? parseFloat(featureConfig.maxangle) : undefined;
  const overflow = featureConfig.overflow ? featureConfig.overflow === 'true' : undefined;
  const rotation = parseFloat(featureConfig.rotation);
  const font = weight + ' ' + size + '/' + height + ' ' + featureConfig.font;
  const fillColor = getStyleByFeatureType(feature)?.getStroke()?.getColor() ?? featureConfig.color;
  const outlineColor = featureConfig.outline;
  const outlineWidth = parseInt(featureConfig.outlineWidth, 10);

  return new Text({
    textAlign: align === '' ? undefined : align,
    textBaseline: baseline,
    font: font,
    text:
      feature.properties?._featureTitle ??
      getText(feature, resolution, featureConfig, ZOOM_LEVELS_TABLE, defaultText),
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({ color: outlineColor, width: outlineWidth }),
    offsetX: offsetX,
    offsetY: offsetY,
    placement: placement,
    maxAngle: maxAngle,
    overflow: overflow,
    rotation: rotation,
  });
};
