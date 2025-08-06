if (!window._env_) {
  window._env_ = (function (undefined) {
    return {
      LANGUAGE: 'he',
      BACKEND_LOCALE: 'he',
      MAP_SERVER: 'MAP_SERVER',
      PUBLISH_POINT: 'PUBLISH_POINT',
      CHANNEL: 1002,
      VERSION: 1,
      REQUEST: 'REQUEST',
      SERVICE_PROTOCOL: 'SERVICE_PROTOCOL',
      SERVICE_NAME: 'SERVICE_NAME',
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
        debugPanel: '{"wfs":{}}',
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
        pollingCycleInterval: 60000,
      },
      DEFAULT_USER: {
        role: 'USER',
      },
      BASE_MAPS: '{"maps":[{"id":"1st","title":"1st Map Title","thumbnail":"https://nsw.digitaltwin.terria.io/build/3456d1802ab2ef330ae2732387726771.png","baseRasterLayers":[{"id":"GOOGLE_TERRAIN","type":"XYZ_LAYER","opacity":1,"zIndex":0,"options":{"url":"https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}","layers":"","credit":"GOOGLE"}},{"id":"INFRARED_RASTER","type":"WMS_LAYER","opacity":0.6,"zIndex":1,"options":{"url":"https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?","layers":"goes_conus_ir","credit":"Infrared data courtesy Iowa Environmental Mesonet","parameters":{"transparent":"true","format":"image/png"}}}],"baseVectorLayers":[]},{"id":"2nd","title":"2nd Map Title","thumbnail":"https://nsw.digitaltwin.terria.io/build/efa2f6c408eb790753a9b5fb2f3dc678.png","baseRasterLayers":[{"id":"RADAR_RASTER","type":"WMS_LAYER","opacity":0.6,"zIndex":1,"options":{"url":"https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?","layers":"nexrad-n0r","credit":"Radar data courtesy Iowa Environmental Mesonet","parameters":{"transparent":"true","format":"image/png"}}},{"id":"GOOGLE_TERRAIN","type":"XYZ_LAYER","opacity":1,"zIndex":0,"options":{"url":"https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}","layers":"","credit":"GOOGLE"}},{"id":"VECTOR_TILES_GPS","type":"XYZ_LAYER","opacity":1,"zIndex":2,"options":{"url":"https://gps.tile.openstreetmap.org/lines/{z}/{x}/{y}.png","layers":"","credit":"openstreetmap"}}],"baseVectorLayers":[]},{"id":"3rd","title":"3rd Map Title","isCurrent":true,"thumbnail":"https://nsw.digitaltwin.terria.io/build/d8b97d3e38a0d43e5a06dea9aae17a3e.png","baseRasterLayers":[{"id":"VECTOR_TILES","type":"XYZ_LAYER","opacity":1,"zIndex":0,"options":{"url":"https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=6170aad10dfd42a38d4d8c709a536f38","layers":"","credit":"thunderforest"}},{"id":"VECTOR_TILES_GPS_1","type":"XYZ_LAYER","opacity":1,"zIndex":1,"options":{"url":"https://gps.tile.openstreetmap.org/lines/{z}/{x}/{y}.png","layers":"","credit":"openstreetmap"}}],"baseVectorLayers":[]},{"id":"4th","title":"4th MapProxy","isCurrent":false,"thumbnail":"","baseRasterLayers":[{"id":"AZURE_RASTER_WMTS_FULL_IL","type":"WMTS_LAYER","opacity":1,"zIndex":0,"options":{"url":"http://map-raster.apps.v0h0bdx6.eastus.aroapp.io/wmts/full_il/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png","format":"image/png","layer":"full_il","style":"default","tileMatrixSetID":"newGrids"}},{"id":"AZURE_RASTER_WMTS_BLUEMARBEL_IL","type":"WMTS_LAYER","opacity":1,"zIndex":0,"options":{"url":"http://map-raster.apps.v0h0bdx6.eastus.aroapp.io/wmts/bluemarble_il/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png","layer":"bluemarble_il","style":"default","format":"image/png","tileMatrixSetID":"newGrids"}}],"baseVectorLayers":[]}]}',
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
      SERVED_ENTITY_TYPES: 'RECORD_ALL,RECORD_RASTER,RECORD_3D,RECORD_DEM',
      WHATSNEW_URL: 'http://whatsnew-URL',
      SITES_CONFIG: '{"masters": [{ "dns": "http://localhost:3000", "isAlias": false }], "slaves": [{ "dns": "http://localhost:8090", "isAlias": false }], "generics": [{ "dns": "https://catalog.mapcolonies.net", "isAlias": false }]}',
      BFF_PATH: '/graphql',
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
        max: {
          pageSize: 300,
          zoomLevel: 14,
          cacheSize: 6000,
        }
      }
    };
  })(void 0);
}
