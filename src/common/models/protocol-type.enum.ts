export const ProtocolType = {
  WMS: 'WMS',
  WMTS: 'WMTS',
  XYZ: 'XYZ',
  WCS: 'WCS',
  OSM: 'OSM',
  MAPBOX_STYLE: 'MAPBOX_STYLE',
  BING_MAPS: 'BING_MAPS',
  WFS: 'WFS',
  VECTOR_TILES: 'VECTOR_TILES',
  THREE_D_TILES: '3DTiles',
  COPC: 'COPC',
  TERRAIN_QMESH: 'TERRAIN_QMESH',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ProtocolType = (typeof ProtocolType)[keyof typeof ProtocolType];

/** Protocols of imagery (raster) layers that Cesium can consume: a subset of `ProtocolType`. */
export const ImageryProtocolType = {
  WMS: ProtocolType.WMS,
  WMTS: ProtocolType.WMTS,
  XYZ: ProtocolType.XYZ,
  // WCS: ProtocolType.WCS, //Basically it's an Imagery but for now days used in DEM/TERRAIN area
  OSM: ProtocolType.OSM,
  MAPBOX_STYLE: ProtocolType.MAPBOX_STYLE,
  BING_MAPS: ProtocolType.BING_MAPS,
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ImageryProtocolType = (typeof ImageryProtocolType)[keyof typeof ImageryProtocolType];

export const toProtocol = (val: string | undefined): ProtocolType => val as ProtocolType;
