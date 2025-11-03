if (!window._env_) {
  window._env_ = (function (undefined) {
    return {
      LANGUAGE: 'he',
      BACKEND_LOCALE: 'he',
      SERVICE_PROTOCOL: 'SERVICE_PROTOCOL',
      SERVICE_NAME: 'SERVICE_NAME',
      CATALOG_APP_USER_ID: 'catalog-app-{CURRENT_USER}@mapcolonies.net',
      MAP_SERVER: 'MAP_SERVER',
      PUBLISH_POINT: 'PUBLISH_POINT',
      CHANNEL: 1002,
      VERSION: 1,
      REQUEST: 'REQUEST',
      ACTIVE_LAYER: 'ACTIVE_LAYER',
      LOCALE: {
        DATE_FORMAT: 'DD/MM/YYYY HH:mm',
      },
      ACTIVE_LAYER_PROPERTIES: {
        urlPattern:
          'arcgis/rest/services/Demographics/USA_Population_Density/MapServer/WMTS',
        urlPatternParams: {
          service: 'WMTS',
          layers: 'USGSShadedReliefOnly',
          tiled: 'true',
          matrixSet: 'default028mm',
          style: 'default',
          projection: 'EPSG:3857',
          format: 'image/png',
        },
      },
      MAP: {
        center: [34.811, 31.908],
        zoom: 14,
        mapMode2D: 'ROTATE',
        showDebuggerTool: false,
        showActiveLayersTool: true,
        showGeocoderTool: true,
      },
      LOGGER: {
        level: 'warn',
        log2console: false,
        log2httpServer: {
          host: '',
          port: '',
          path: '',
        },
      },
      JOB_STATUS: {
        pollingCycleInterval: 120000,
      },
      DEFAULT_USER: {
        role: 'USER',
      },
      BASE_MAPS: '{ "maps": [ { "id": "1st", "title": "1st Map", "isForPreview": true, "thumbnail": "https://mt1.google.com/vt/lyrs=s&x=6&y=4&z=3", "baseRasterLayers": [ { "id": "GOOGLE_TERRAIN", "type": "XYZ_LAYER", "opacity": 1, "zIndex": 0, "options": { "url": "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", "layers": "", "credit": "GOOGLE" } }, { "id": "INFRARED_RASTER", "type": "WMS_LAYER", "opacity": 0.6, "zIndex": 1, "options": { "url": "https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?", "layers": "goes_conus_ir", "credit": "Infrared data courtesy Iowa Environmental Mesonet", "parameters": { "transparent": "true", "format": "image/png" } } } ] }, { "id": "2nd", "title": "2nd Map", "thumbnail": "https://mt1.google.com/vt/lyrs=s&x=6&y=4&z=3", "baseRasterLayers": [ { "id": "RADAR_RASTER", "type": "WMS_LAYER", "opacity": 0.6, "zIndex": 1, "options": { "url": "https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?", "layers": "nexrad-n0r", "credit": "Radar data courtesy Iowa Environmental Mesonet", "parameters": { "transparent": "true", "format": "image/png" } } }, { "id": "GOOGLE_TERRAIN", "type": "XYZ_LAYER", "opacity": 1, "zIndex": 0, "options": { "url": "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", "layers": "", "credit": "GOOGLE" } }, { "id": "VECTOR_TILES_GPS", "type": "XYZ_LAYER", "opacity": 1, "zIndex": 2, "options": { "url": "https://gps.tile.openstreetmap.org/lines/{z}/{x}/{y}.png", "layers": "", "credit": "openstreetmap" } } ] }, { "id": "3rd", "title": "3rd Map", "isCurrent": true, "thumbnail": "https://a.tile.thunderforest.com/cycle/17/78208/53265.png", "baseRasterLayers": [ { "id": "VECTOR_TILES", "type": "XYZ_LAYER", "opacity": 1, "zIndex": 0, "options": { "url": "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38", "layers": "", "credit": "thunderforest" } }, { "id": "VECTOR_TILES_GPS", "type": "XYZ_LAYER", "opacity": 1, "zIndex": 1, "options": { "url": "https://gps.tile.openstreetmap.org/lines/{z}/{x}/{y}.png", "layers": "", "credit": "openstreetmap" } } ] } ] }',
      DEFAULT_TERRAIN_PROVIDER_URL: 'http://nginx-s3-gateway-URL',
      WEB_TOOLS_URL: 'http://mc-web-tools-URL',
      MODEL_VIEWER_ROUTE: 'simple-catalog-viewer',
      MODEL_VIEWER_TOKEN_VALUE: 'TOKEN',
      RUNNING_MODE: {
        type: 'DEVELOPMENT',
        autocomplete: false,
      },
      NUMBER_OF_CHARACTERS_LIMIT: 18,
      ACCESS_TOKEN: {
        attributeName: 'token',
        injectionType: 'queryParam',
        tokenValue: 'TOKEN'
      },
      SERVED_ENTITY_TYPES: 'RECORD_ALL,RECORD_RASTER,RECORD_3D,RECORD_DEM,RECORD_VECTOR',
      WHATSNEW_URL: 'http://whatsnew-URL',
      SITES_CONFIG: '{"masters": [{ "dns": "http://localhost:3000", "isAlias": false }], "slaves": [{ "dns": "http://localhost:8090", "isAlias": false }], "generics": [{ "dns": "https://catalog.mapcolonies.net", "isAlias": false }]}',
      BFF_PATH: '/graphql',
      SELECTION_MODE_DEFAULT: '',
      SHOW_SELECTION_MODE_SWITCH: true,
      POLYGON_PARTS: {
        featureTypePrefix: 'polygonParts:',
        densityFactor: 0.3,
        geometryErrorsThreshold: 0.05,
        areaThreshold: 5,
        max: {
          WFSFeatures: 500,
          showFootprintZoomLevel: 10,
          perShape: 30000,
          vertices: 30000000,
        }
      },
      WFS: {
        style: '{"color": "#01FF1F", "hover": "#24AEE9", "pointStroke": "#01FF1F"}',
        keyField: 'id',
        max: {
          pageSize: 300,
          zoomLevel: 14,
          cacheSize: 6000,
        }
      },
      GEOCODER: {
        url: 'http://geocoder-URL',
        callbackUrl: 'http://geocoder-callback-URL'
      }
    };
  })(void 0);
}
