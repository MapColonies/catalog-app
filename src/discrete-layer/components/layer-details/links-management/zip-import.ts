import JSZip from 'jszip';
import { LinkType } from '../../../../common/models/link-type.enum';
import { CaptureSize, THUMBNAIL_SIZE_TO_PROTOCOL } from './links-management.utils';
import { IResourcesManifest } from './zip-export';

export type ZipImportErrorCode =
  | 'invalid-zip'
  | 'empty-archive'
  | 'too-many-entries'
  | 'unsafe-path'
  | 'missing-manifest'
  | 'invalid-manifest-json'
  | 'unsupported-manifest-version'
  | 'invalid-manifest'
  | 'missing-referenced-asset'
  | 'archive-too-large';

export class ZipImportError extends Error {
  public readonly code: ZipImportErrorCode;

  public constructor(code: ZipImportErrorCode) {
    super(`zip-import: ${code}`);
    this.code = code;
  }
}

export interface IImportedResource {
  protocol: LinkType;
  dataUrl: string;
  fileName?: string;
}

const SUPPORTED_MANIFEST_VERSION = 1;
const MAX_ENTRIES = 50;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB safety cap against oversized/zip-bomb archives
const ALLOWED_PREFIXES = ['thumbnails/', 'legend/', 'documentation/'];

/** Rejects path traversal (`..`) and absolute/drive-letter paths — treat archive entries as untrusted. */
const isSafeEntryPath = (path: string): boolean => {
  if (path.includes('..')) return false;
  if (path.startsWith('/') || path.startsWith('\\') || /^[a-zA-Z]:/.test(path)) return false;
  return ALLOWED_PREFIXES.some((prefix) => path === 'manifest.json' || path.startsWith(prefix));
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => resolve(reader.result as string);
    reader.onerror = (): void =>
      reject(reader.error ?? new Error('zip-import: failed to read archive entry'));
    reader.readAsDataURL(blob);
  });
};

const readReferencedAsset = async (
  zip: JSZip,
  path: string,
  totalBytesRef: { value: number }
): Promise<Blob> => {
  if (!isSafeEntryPath(path)) {
    throw new ZipImportError('unsafe-path');
  }
  const entry = zip.file(path);
  if (!entry) {
    throw new ZipImportError('missing-referenced-asset');
  }
  const blob = await entry.async('blob');
  totalBytesRef.value += blob.size;
  if (totalBytesRef.value > MAX_TOTAL_BYTES) {
    throw new ZipImportError('archive-too-large');
  }
  return blob;
};

export const parseLayerResourcesZip = async (
  archiveBuffer: ArrayBuffer
): Promise<IImportedResource[]> => {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(archiveBuffer);
  } catch {
    throw new ZipImportError('invalid-zip');
  }

  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  if (entries.length === 0) {
    throw new ZipImportError('empty-archive');
  }
  if (entries.length > MAX_ENTRIES) {
    throw new ZipImportError('too-many-entries');
  }
  for (const entry of entries) {
    if (!isSafeEntryPath(entry.name)) {
      throw new ZipImportError('unsafe-path');
    }
  }

  const manifestEntry = zip.file('manifest.json');
  if (!manifestEntry) {
    throw new ZipImportError('missing-manifest');
  }

  const totalBytesRef = { value: 0 };
  const manifestText = await manifestEntry.async('string');
  totalBytesRef.value += manifestText.length;

  let manifest: IResourcesManifest;
  try {
    manifest = JSON.parse(manifestText) as IResourcesManifest;
  } catch {
    throw new ZipImportError('invalid-manifest-json');
  }
  if (manifest.version !== SUPPORTED_MANIFEST_VERSION) {
    throw new ZipImportError('unsupported-manifest-version');
  }
  if (!manifest.resources || typeof manifest.resources !== 'object') {
    throw new ZipImportError('invalid-manifest');
  }

  const results: IImportedResource[] = [];

  const thumbnails = manifest.resources.thumbnails ?? {};
  for (const size of Object.keys(thumbnails) as CaptureSize[]) {
    const filename = thumbnails[size];
    if (!filename) continue;
    const blob = await readReferencedAsset(zip, `thumbnails/${filename}`, totalBytesRef);
    const dataUrl = await blobToDataUrl(blob);
    results.push({ protocol: THUMBNAIL_SIZE_TO_PROTOCOL[size], dataUrl, fileName: filename });
  }

  if (manifest.resources.legend) {
    const blob = await readReferencedAsset(
      zip,
      `legend/${manifest.resources.legend}`,
      totalBytesRef
    );
    const dataUrl = await blobToDataUrl(blob);
    results.push({ protocol: LinkType.LEGEND_IMG, dataUrl, fileName: manifest.resources.legend });
  }

  if (manifest.resources.documentation) {
    const blob = await readReferencedAsset(
      zip,
      `documentation/${manifest.resources.documentation}`,
      totalBytesRef
    );
    const dataUrl = await blobToDataUrl(blob);
    results.push({
      protocol: LinkType.LEGEND_DOC,
      dataUrl,
      fileName: manifest.resources.documentation,
    });
  }

  return results;
};
