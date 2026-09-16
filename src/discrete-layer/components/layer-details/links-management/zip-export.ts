import JSZip from 'jszip';
import { LinkType } from '../../../../common/models/link-type.enum';
import { getLinkUrl, getTokenParam } from '../../helpers/layersUtils';
import { ILayerImage } from '../../../models/layerImage';
import { CaptureSize, THUMBNAIL_SIZE_TO_PROTOCOL } from './links-management.utils';

const MANIFEST_VERSION = 1;

export interface IResourcesManifest {
  version: number;
  layerId: string;
  exportedAt: string;
  resources: {
    thumbnails?: Partial<Record<CaptureSize, string>>;
    legend?: string;
    documentation?: string;
  };
}

const THUMBNAIL_FILENAMES: Record<CaptureSize, string> = {
  [CaptureSize.SMALL]: 'small.png',
  [CaptureSize.MEDIUM]: 'medium.png',
  [CaptureSize.LARGE]: 'large.png',
};

const resolveFetchableUrl = (rawUrl: string): string => {
  return rawUrl.startsWith('data:') ? rawUrl : `${rawUrl}${getTokenParam()}`;
};

const fetchAsBlob = async (rawUrl: string): Promise<Blob> => {
  const response = await fetch(resolveFetchableUrl(rawUrl));
  if (!response.ok) {
    throw new Error(`Failed to fetch resource for export: ${rawUrl}`);
  }
  return response.blob();
};

const extractFilename = (rawUrl: string, fallback: string): string => {
  if (rawUrl.startsWith('data:')) {
    return fallback;
  }
  const withoutQuery = rawUrl.split('?')[0];
  const name = withoutQuery.split('/').pop();
  return name && name.length > 0 ? name : fallback;
};

export const exportLayerResourcesZip = async (layerRecord: ILayerImage): Promise<Blob> => {
  const zip = new JSZip();
  const links = layerRecord.links ?? [];
  const manifest: IResourcesManifest = {
    version: MANIFEST_VERSION,
    layerId: layerRecord.id,
    exportedAt: new Date().toISOString(),
    resources: {},
  };

  const thumbnails: Partial<Record<CaptureSize, string>> = {};
  const thumbnailsFolder = zip.folder('thumbnails');
  for (const size of [CaptureSize.SMALL, CaptureSize.MEDIUM, CaptureSize.LARGE]) {
    const rawUrl = getLinkUrl(links, THUMBNAIL_SIZE_TO_PROTOCOL[size]);
    if (!rawUrl) continue;
    const blob = await fetchAsBlob(rawUrl);
    const filename = THUMBNAIL_FILENAMES[size];
    thumbnailsFolder?.file(filename, blob);
    thumbnails[size] = filename;
  }
  if (Object.keys(thumbnails).length > 0) {
    manifest.resources.thumbnails = thumbnails;
  }

  const legendUrl = getLinkUrl(links, LinkType.LEGEND_IMG);
  if (legendUrl) {
    const blob = await fetchAsBlob(legendUrl);
    const filename = extractFilename(legendUrl, 'legend.png');
    zip.folder('legend')?.file(filename, blob);
    manifest.resources.legend = filename;
  }

  const documentationUrl = getLinkUrl(links, LinkType.LEGEND_DOC);
  if (documentationUrl) {
    const blob = await fetchAsBlob(documentationUrl);
    const filename = extractFilename(documentationUrl, 'documentation.pdf');
    zip.folder('documentation')?.file(filename, blob);
    manifest.resources.documentation = filename;
  }

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  return zip.generateAsync({ type: 'blob' });
};
