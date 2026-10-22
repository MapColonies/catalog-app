import { ProtocolType } from './protocol-type.enum';

export const LinkType = {
  WMTS_KVP: 'WMTS_KVP',
  WMTS_BASE: 'WMTS_BASE',
  WMS_BASE: 'WMS_BASE',
  DOWNLOAD: 'DOWNLOAD',
  THUMBNAIL_S: 'THUMBNAIL_S',
  THUMBNAIL_M: 'THUMBNAIL_M',
  THUMBNAIL_L: 'THUMBNAIL_L',
  LEGEND_DOC: 'LEGEND_DOC',
  LEGEND_IMG: 'LEGEND_IMG',
  LEGEND: 'LEGEND',
  WMTS: ProtocolType.WMTS,
  WMS: ProtocolType.WMS,
  WFS: ProtocolType.WFS,
  COPC: ProtocolType.COPC,
  THREE_D_TILES: ProtocolType.THREE_D_TILES,
  TERRAIN_QMESH: ProtocolType.TERRAIN_QMESH,
  WCS: ProtocolType.WCS,
  VECTOR_TILES: ProtocolType.VECTOR_TILES,
  XYZ: ProtocolType.XYZ,
  OSM: ProtocolType.OSM,
  MAPBOX_STYLE: ProtocolType.MAPBOX_STYLE,
  BING_MAPS: ProtocolType.BING_MAPS,
} as const;

export type LinkType = (typeof LinkType)[keyof typeof LinkType];
