/* eslint-disable @typescript-eslint/naming-convention */
import { LinkType } from '../../common/models/link-type.enum';

interface IValidation {
  errorMsgCode: string;
  fileSize?: number;
}

export interface ILink {
  linkAction: 'copy' | 'link';
  editable?: boolean;
  validation?: IValidation[];
  fileTypes?: string;
  isMulti?: boolean;
}

export const links: Partial<Record<LinkType, ILink>> = {
  [LinkType.WMTS_BASE]: { linkAction: 'copy' },
  [LinkType.WMTS_KVP]: { linkAction: 'copy' },
  [LinkType.WMS_BASE]: { linkAction: 'copy' },
  [LinkType.XYZ]: { linkAction: 'copy' },
  [LinkType.THREE_D_TILES]: { linkAction: 'copy' },
  [LinkType.TERRAIN_QMESH]: { linkAction: 'copy' },
  [LinkType.WMTS]: { linkAction: 'copy' },
  [LinkType.WMS]: { linkAction: 'copy' },
  [LinkType.WCS]: { linkAction: 'copy' },
  [LinkType.THUMBNAIL_S]: {
    linkAction: 'link',
    editable: true,
    validation: [
      {
        errorMsgCode: 'validation-field.links.fileSize',
        fileSize: 128
      }
    ],
    fileTypes: '.png'
  },
  [LinkType.THUMBNAIL_M]: {
    linkAction: 'link',
    editable: true,
    validation: [
      {
        errorMsgCode: 'validation-field.links.fileSize',
        fileSize: 400
      }
    ],
    fileTypes: '.png'
  },
  [LinkType.THUMBNAIL_L]: {
    linkAction: 'link',
    editable: true,
    validation: [
      {
        errorMsgCode: 'validation-field.links.fileSize',
        fileSize: 600
      }
    ],
    fileTypes: '.png'
  },
  [LinkType.LEGEND_DOC]: {
    linkAction: 'link',
    editable: true,
    fileTypes: '.pdf'
  },
  [LinkType.LEGEND_IMG]: {
    linkAction: 'link',
    editable: true,
    fileTypes: '.png,.bmp,.jpeg,.jpg'
  },
  [LinkType.LEGEND]: {
    linkAction: 'link',
    editable: true,
    fileTypes: '.json'
  },
};
