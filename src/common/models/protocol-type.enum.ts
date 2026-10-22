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

export type ProtocolType = (typeof ProtocolType)[keyof typeof ProtocolType];
