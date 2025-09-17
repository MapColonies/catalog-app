import { Feature } from 'geojson';
import { get } from 'lodash';
import { Vector } from 'ol/layer';
import { MultiPoint } from 'ol/geom';
import CircleStyle from 'ol/style/Circle';
import { Coordinate } from 'ol/coordinate';
import { Style, Stroke, Fill, Text, Icon } from 'ol/style';
import CONFIG from '../../../../common/config';
import { LayerRasterRecordModelType } from '../../../models';
import { dateFormatter } from '../../../../common/helpers/formatters';
import { IEnumsMapType } from '../../../../common/contexts/enumsMap.context';

export enum FeatureType {
  DEFAULT = 'DEFAULT',
  PP_PERIMETER = 'PP_PERIMETER',
  PP_PERIMETER_MARKER = 'PP_PERIMETER_MARKER',
  SOURCE_EXTENT = 'SOURCE_EXTENT',
  SOURCE_EXTENT_MARKER = 'SOURCE_EXTENT_MARKER',
  EXISTING_PP = 'EXISTING_PP',
  SELECTED_FILL = 'SELECTED_FILL',
  SELECTED_MARKER = 'SELECTED_MARKER',
  ILLEGAL_PP = 'ILLEGAL_PP',
}

export const PPMapStyles = new Map<FeatureType, Style | undefined>([
  // @ts-ignore
  [FeatureType.DEFAULT, new Vector().getStyleFunction()()[0]],
  [FeatureType.PP_PERIMETER, new Style({
    stroke: new Stroke({
      width: 4,
      color: "#000000"
    }),
  })
  ],
  [FeatureType.PP_PERIMETER_MARKER, new Style({
    image: new Icon({
      scale: 0.2,
      anchor: [0.5, 1],
      src: 'assets/img/map-marker.gif'
    })
  })
  ],
  [FeatureType.SOURCE_EXTENT, new Style({
    stroke: new Stroke({
      width: 4,
      color: "#7F00FF"
    }),
  })
  ],
  [FeatureType.SOURCE_EXTENT_MARKER, new Style({
    image: new Icon({
      scale: 0.2,
      anchor: [0.5, 1],
      src: 'assets/img/map-marker.gif'
    })
  })
  ],
  [FeatureType.EXISTING_PP, new Style({
    stroke: new Stroke({
      width: 2,
      color: CONFIG.CONTEXT_MENUS.MAP.POLYGON_PARTS_FEATURE_CONFIG.outlineColor
    }),
    fill: new Fill({
      color: CONFIG.CONTEXT_MENUS.MAP.POLYGON_PARTS_FEATURE_CONFIG.color
    })
  })
  ],
  [FeatureType.SELECTED_FILL,
  new Style({
    stroke: new Stroke({
      width: 2,
      color: "#ff0000"
    }),
    fill: new Fill({
      color: "#aa2727"
    })

  }),
  ],
  [FeatureType.SELECTED_MARKER,
  new Style({
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({
        color: '#FFA032', //GC_WARNING_HIGH
      }),
    }),
    geometry: function (feature) {
      // return the coordinates of the inner and outer rings of the polygon
      //@ts-ignore
      const coordinates = feature?.getGeometry()?.getCoordinates().reduce( 
        (accumulator: Array<Coordinate>, currentValue: Array<Coordinate>) => [...accumulator, ...currentValue],
        []
      );
      return new MultiPoint(coordinates);
    }
  })
  ],
  [FeatureType.ILLEGAL_PP, new Style({
    stroke: new Stroke({
      width: 2,
      color: "#e91e63"
    }),
    fill: new Fill({
      color: "#e91e6385"
    })
  })
  ]
])

export const getWFSFeatureTypeName = (layerRecord: LayerRasterRecordModelType | null, enums: IEnumsMapType) => {
  // Naming convension of polygon parts feature typeName
  // polygonParts:{productId}-{productType}
  return layerRecord ?
    `${CONFIG.POLYGON_PARTS.FEATURE_TYPE_PREFIX}${layerRecord.productId}-${enums[layerRecord.productType as string].realValue}` :
    'SHOULD_BE_CALCULATED_FROM_UPDATED_LAYER';
}

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

export const getText = (feature: Feature, resolution: number, featureConfig: Record<string, string>, ZOOM_LEVELS_TABLE: Record<string, number>, defaultText?: string) => {
  const type = get(feature.properties, 'text') ?? featureConfig.text;
  const maxResolution = parseInt(featureConfig.maxreso);

  let featureResolution = get(feature.properties, 'resolutionDegree');
  
  let zoomLevel = Object.values(ZOOM_LEVELS_TABLE)
    .map((res) => res.toString())
    .findIndex(val => val === get(feature.properties, 'resolutionDegree')?.toString());

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
  } else if (
    type === 'wrap' &&
    (!featureConfig.placement || featureConfig.placement !== 'line')
  ) {
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
    // outline: '#ffffff',
    outlineWidth: '3',
    maxreso: '1200',
  },
};

export const createTextStyle = (feature: Feature, resolution: number, featureConfig: Record<string, string>, ZOOM_LEVELS_TABLE: Record<string, number>, defaultText?: string) => {
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
  const fillColor = featureConfig.color;
  const outlineColor = featureConfig.outline;
  const outlineWidth = parseInt(featureConfig.outlineWidth, 10);

  return new Text({
    textAlign: align === '' ? undefined : align,
    textBaseline: baseline,
    font: font,
    text: getText(feature, resolution, featureConfig, ZOOM_LEVELS_TABLE, defaultText),
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