import { LinkType } from '../../models/link-type.enum';

export const isWMTSProtocol = (linkType?: string) =>
  linkType === LinkType.WMTS_LAYER || linkType === LinkType.WMTS;

export const isXYZProtocol = (linkType?: string) => linkType === LinkType.XYZ_LAYER;
