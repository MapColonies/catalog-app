import { CesiumGeographicTilingScheme, Proj } from '@map-colonies/react-components';
import { IRasterLayer } from '@map-colonies/react-components/dist/cesium-map/layers-manager';
import { IBaseMaps, IBaseMap } from '@map-colonies/react-components/dist/cesium-map/map';
import { LinkType } from '../models/link-type.enum';
import { IRasterIngestionFilesStructureConfig } from '../models/raster-ingestion-files-structure';

/*eslint-disable */
const LANGUAGE = (window as any)._env_.LANGUAGE as string;
const BACKEND_LOCALE = (window as any)._env_.BACKEND_LOCALE as string;
const SERVICE_PROTOCOL = (window as any)._env_.SERVICE_PROTOCOL;
const SERVICE_NAME = (window as any)._env_.SERVICE_NAME;
const CATALOG_APP_USER_ID = (window as any)._env_.CATALOG_APP_USER_ID;
const MAP_SERVER = (window as any)._env_.MAP_SERVER;
const PUBLISH_POINT = (window as any)._env_.PUBLISH_POINT;
const CHANNEL = (window as any)._env_.CHANNEL;
const VERSION = (window as any)._env_.VERSION;
const REQUEST = (window as any)._env_.REQUEST;
const ACTIVE_LAYER = (window as any)._env_.ACTIVE_LAYER;
const ACTIVE_LAYER_PROPERTIES = (window as any)._env_.ACTIVE_LAYER_PROPERTIES;
const MAP = (window as any)._env_.MAP;
const JOB_STATUS = (window as any)._env_.JOB_STATUS;
const DEFAULT_USER = (window as any)._env_.DEFAULT_USER;
const BASE_MAPS = JSON.parse((window as any)._env_.BASE_MAPS);
const DEFAULT_TERRAIN_PROVIDER_URL = (window as any)._env_.DEFAULT_TERRAIN_PROVIDER_URL;
const WEB_TOOLS_URL = (window as any)._env_.WEB_TOOLS_URL;
const MODEL_VIEWER_ROUTE = (window as any)._env_.MODEL_VIEWER_ROUTE;
const MODEL_VIEWER_TOKEN_VALUE = (window as any)._env_.MODEL_VIEWER_TOKEN_VALUE;
const RUNNING_MODE = (window as any)._env_.RUNNING_MODE;
const NUMBER_OF_CHARACTERS_LIMIT = (window as any)._env_.NUMBER_OF_CHARACTERS_LIMIT;
const ACCESS_TOKEN = (window as any)._env_.ACCESS_TOKEN;
const SERVED_ENTITY_TYPES = (window as any)._env_.SERVED_ENTITY_TYPES;
const PROJECT_VERSION = (window as any)._env_.PROJECT_VERSION;
const WHATSNEW_URL = (window as any)._env_.WHATSNEW_URL;
const SITES_CONFIG = JSON.parse((window as any)._env_.SITES_CONFIG);
const BFF_PATH = (window as any)._env_.BFF_PATH;
const SELECTION_MODE = (window as any)._env_.SELECTION_MODE;
const POLYGON_PARTS = {
  ...(window as any)._env_.POLYGON_PARTS,
  highResolutionColor: '#01FF1F',
  mediumResolutionColor: '#fbff01',
  lowResolutionColor: '#ff3401',
  hoverColor: '#24AEE9',
  billBoardStrokeColor: '#FFFF00'
};
const WFS = (window as any)._env_.WFS;
const GEOCODER = (window as any)._env_.GEOCODER;
const RASTER_INGESTION_FILES_STRUCTURE = JSON.parse((window as any)._env_.RASTER_INGESTION_FILES_STRUCTURE);

const enrichBaseMaps = (baseMaps: IBaseMaps): IBaseMaps => {
  return {
    maps: baseMaps.maps.map((baseMap: IBaseMap) => {
      return {
        ...baseMap,
        thumbnail: baseMap.thumbnail && ACCESS_TOKEN.injectionType?.toLowerCase() === 'queryparam' ? `${baseMap.thumbnail}?${ACCESS_TOKEN.attributeName}=${ACCESS_TOKEN.tokenValue}` : baseMap.thumbnail,
        baseRasterLayers: (baseMap.baseRasterLayers as IRasterLayer[]).map((rasterLayer) => {
          return {
            ...rasterLayer,
            options: {
              ...rasterLayer.options,
              tilingScheme: (rasterLayer.type === LinkType.WMTS_LAYER) ? new CesiumGeographicTilingScheme() : undefined
            }
          };
        })
      }
    })
  }
};

const systemJobsPriorityOptions =
  // Priority is an integer
  // Normal/default value is: 1000
  // It can be lower
  [
    {
      label: 'system-status.job-priority-highest',
      value: '2000',
      icon: 'Priority-Highest-Monochrome',
      iconcolor: 'var(--mdc-theme-gc-priority-highest)',
    },
    {
      label: 'system-status.job-priority-high',
      value: '1500',
      icon: 'Priority-High-Monochrome',
      iconcolor: 'var(--mdc-theme-gc-priority-high)',
    },
    {
      label: 'system-status.job-priority-normal',
      value: '1000',
      icon: 'Priority-Normal-Monochrome',
      iconcolor: 'var(--mdc-theme-gc-priority-normal)',
    },
    {
      label: 'system-status.job-priority-low',
      value: '500',
      icon: 'Priority-Low-Monochrome',
      iconcolor: 'var(--mdc-theme-gc-priority-low)',
    },
    {
      label: 'system-status.job-priority-lowest',
      value: '0',
      icon: 'Priority-Lowest-Monochrome',
      iconcolor: 'var(--mdc-theme-gc-priority-lowest)',
    },
  ];

const DATE_FORMAT = 'DD/MM/YYYY';
const DATE_FNS_FORMAT = 'dd/MM/yyyy';

const APP_CONFIG = {
  SERVICE_PROTOCOL: SERVICE_PROTOCOL,
  SERVICE_NAME: SERVICE_NAME,
  CATALOG_APP_USER_ID: CATALOG_APP_USER_ID,
  LOCALE: {
    DATE_FORMAT: DATE_FORMAT,
    DATE_TIME_FORMAT: `${DATE_FORMAT} HH:mm`,
    DATE_FNS_FORMAT: DATE_FNS_FORMAT,
    DATE_FNS_TIME_FORMAT: `${DATE_FNS_FORMAT} hh:mm`,
    DATE_FNS_HUMAN_READABLE_DATE: "PPPP",
    DATE_FNS_HUMAN_READABLE_DATE_TIME: "PPPPp",
  },
  I18N: {
    DEFAULT_LANGUAGE: LANGUAGE,
  },
  DEFAULT_BACKEND_LOCALE: BACKEND_LOCALE,
  BOUNDARIES: {
    MAX_X_KM: 100,
    MAX_Y_KM: 100,
  },
  EXPORT: {
    AVG_TILE_SIZE_MB: 0.02,
    MIN_ZOOM: 1,
    MAX_ZOOM: 21,
  },
  MAP: {
    PROJECTION: Proj.WGS84,
    CENTER: MAP.center as [number, number],
    ZOOM: MAP.zoom as number,
    MAPMODE2D: MAP.mapMode2D,
    USE_OPTIMIZED_TILE_REQUESTS: MAP.useOptimizedTileRequests as boolean,
    SHOW_DEBUGGER_TOOL: MAP.showDebuggerTool,
    SHOW_ACTIVE_LAYERS_TOOL: MAP.showActiveLayersTool,
    SHOW_GEOCODER_TOOL: MAP.showGeocoderTool
  },
  ACTIVE_LAYER: ACTIVE_LAYER, // | 'WMTS_LAYER' | 'WMS_LAYER' | 'XYZ_LAYER' | 'OSM_LAYER'
  ACTIVE_LAYER_PROPERTIES: ACTIVE_LAYER_PROPERTIES,
  THREE_D_LAYER: {
    MAXIMUM_SCREEN_SPACE_ERROR: 5,
    CULL_REQUESTS_WHILE_MOVING_MULTIPLIER: 120
  },
  WMTS_LAYER: {
    ATTRIBUTIONS:
      'Tiles © <a href="http://basemap.nationalmap.gov">basemap</a>',
    URL: `${MAP_SERVER}/${ACTIVE_LAYER_PROPERTIES.urlPattern}`,
    LAYER: `${PUBLISH_POINT}`,
    STYLE: `${ACTIVE_LAYER_PROPERTIES.urlPatternParams.style}`,
    PROJECTION: `${ACTIVE_LAYER_PROPERTIES.urlPatternParams.projection}`,
    FORMAT: `${ACTIVE_LAYER_PROPERTIES.urlPatternParams.format}`,
    MATRIX_SET: `${ACTIVE_LAYER_PROPERTIES.urlPatternParams.matrixSet}`,
    MAXIMUM_LEVEL: 19,
  },
  WMS_LAYER: {
    ATTRIBUTIONS: `Tiles © <a href="${MAP_SERVER}">GEE</a>`,
    URL: `${ACTIVE_LAYER_PROPERTIES.urlPattern}`,
    PARAMS: { ...ACTIVE_LAYER_PROPERTIES.urlPatternParams },
    SERVERTYPE: 'geoserver',
    TRANSITION: 0.5,
  },
  XYZ_LAYER: {
    ATTRIBUTIONS: `Tiles © <a href="${MAP_SERVER}">GEE</a>`,
    URL: `${MAP_SERVER}/${PUBLISH_POINT}/query?request=${REQUEST}&channel=${CHANNEL}&version=${VERSION}&x={x}&y={y}&z={z}`,
  },
  OSM_LAYER: {
    URL: `https://a.tile.openstreetmap.org/`,
  },
  JOB_STATUS: {
    POLLING_CYCLE_INTERVAL: JOB_STATUS.pollingCycleInterval as number
  },
  DEFAULT_USER: {
    ROLE: DEFAULT_USER.role
  },
  BASE_MAPS: enrichBaseMaps(BASE_MAPS),
  DEFAULT_TERRAIN_PROVIDER_URL: DEFAULT_TERRAIN_PROVIDER_URL,
  WEB_TOOLS_URL: WEB_TOOLS_URL,
  MODEL_VIEWER_ROUTE: MODEL_VIEWER_ROUTE,
  MODEL_VIEWER_TOKEN_VALUE: MODEL_VIEWER_TOKEN_VALUE,
  RUNNING_MODE: {
    TYPE: RUNNING_MODE.type,
    AUTOCOMPLETE: RUNNING_MODE.autocomplete,
    START_RECORD: 1,
    END_RECORD: 1000
  },
  SYSTEM_JOBS_PRIORITY_OPTIONS: systemJobsPriorityOptions,
  NUMBER_OF_CHARACTERS_LIMIT: NUMBER_OF_CHARACTERS_LIMIT as number,
  ACCESS_TOKEN: {
    ATTRIBUTE_NAME: ACCESS_TOKEN.attributeName,
    INJECTION_TYPE: ACCESS_TOKEN.injectionType,
    TOKEN_VALUE: ACCESS_TOKEN.tokenValue
  },
  SERVED_ENTITY_TYPES : (SERVED_ENTITY_TYPES as string).split(','),
  JOB_MANAGER_END_OF_TIME: 21, // Days
  MINIMUM_SUPPORTED_BROWSER_VERSION: 84,
  PROJECT_VERSION: PROJECT_VERSION,
  CONTEXT_MENUS: {
    MAP: {
      MAX_ACTIVE_LAYERS_TO_PRESENT: 5,
      POLYGON_PARTS_FEATURE_CONFIG: {
        color: `${POLYGON_PARTS.highResolutionColor}50`, //'#00ff0030',//'#BF40BF',
        outlineColor: POLYGON_PARTS.highResolutionColor, //'#00FF00',
        outlineWidth: 8
      }
    }
  },
  WHATSNEW_URL: WHATSNEW_URL,
  SITES_CONFIG: SITES_CONFIG,
  BFF_PATH: BFF_PATH,
  SELECTION_MODE: SELECTION_MODE,
  POLYGON_PARTS: {
    STYLE: {
      highResolutionColor: POLYGON_PARTS.highResolutionColor,
      mediumResolutionColor: POLYGON_PARTS.mediumResolutionColor,
      lowResolutionColor: POLYGON_PARTS.lowResolutionColor,
      hoverColor: POLYGON_PARTS.hoverColor,
      billBoardStrokeColor: POLYGON_PARTS.billBoardStrokeColor
    },
    FEATURE_TYPE_PREFIX: POLYGON_PARTS.featureTypePrefix,
    DENSITY_FACTOR: POLYGON_PARTS.densityFactor,
    GEOMETRY_ERRORS_THRESHOLD: POLYGON_PARTS.geometryErrorsThreshold,
    AREA_THRESHOLD: POLYGON_PARTS.areaThreshold,
    MAX: {
      WFS_FEATURES: POLYGON_PARTS.max.WFSFeatures,
      SHOW_FOOTPRINT_ZOOM_LEVEL: POLYGON_PARTS.max.showFootprintZoomLevel,
      PER_SHAPE: POLYGON_PARTS.max.perShape,
      VERTICES: POLYGON_PARTS.max.vertices,
    }
  },
  WFS: {
    STYLE: JSON.parse(WFS.style),
    KEY_FIELD: WFS.keyField,
    MAX: {
      PAGE_SIZE: WFS.max.pageSize,
      ZOOM_LEVEL: WFS.max.zoomLevel,
      CACHE_SIZE: WFS.max.cacheSize,
    }
  },
  GEOCODER: {
    URL: GEOCODER.url,
    CALLBACK_URL: GEOCODER.callbackUrl,
    RESULTS_LIMIT: 6
  },
  RASTER_INGESTION_FILES_STRUCTURE: {
    ...RASTER_INGESTION_FILES_STRUCTURE as IRasterIngestionFilesStructureConfig
  }
};

export default APP_CONFIG;
