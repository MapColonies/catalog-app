import type { ICaptureDimensions } from '@map-colonies/react-components';
import { LinkType } from '../../../../common/models/link-type.enum';

/**
 * Thumbnail size presets for Links Management. This is product-specific behavior for this
 * feature, not a generic Cesium capability — `shared-components`' screenshot API accepts
 * arbitrary width/height and knows nothing about these presets.
 */
export enum CaptureSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

export const THUMBNAIL_CAPTURE_DIMENSIONS: Readonly<Record<CaptureSize, ICaptureDimensions>> = {
  [CaptureSize.SMALL]: { width: 128, height: 128 },
  [CaptureSize.MEDIUM]: { width: 256, height: 256 },
  [CaptureSize.LARGE]: { width: 1024, height: 1024 },
};

export const THUMBNAIL_SIZE_TO_PROTOCOL: Record<CaptureSize, LinkType> = {
  [CaptureSize.SMALL]: LinkType.THUMBNAIL_S,
  [CaptureSize.MEDIUM]: LinkType.THUMBNAIL_M,
  [CaptureSize.LARGE]: LinkType.THUMBNAIL_L,
};

export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => resolve(reader.result as string);
    reader.onerror = (): void =>
      reject(reader.error ?? new Error('blobToDataUrl: failed to read blob'));
    reader.readAsDataURL(blob);
  });
};
