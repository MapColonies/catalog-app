import type {
  CesiumRectangle,
  CesiumViewer,
  IBaseMap,
  IBaseMaps,
  ICaptureDimensions,
} from '@map-colonies/react-components';
import { LinkType } from '../../../../common/models/link-type.enum';
import { RecordType } from '../../../models/RecordTypeEnum';
import { ILayerImage } from '../../../models/layerImage';
import { generateFactoredLayerRectangle } from '../../helpers/cesiumUtils';
import NO_BASE_MAP_THUMBNAIL from './no-basemap-thumbnail.svg';

export enum CaptureSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

export const THUMBNAIL_CAPTURE_DIMENSIONS: Readonly<Record<CaptureSize, ICaptureDimensions>> = {
  [CaptureSize.SMALL]: { width: 128, height: 128 },
  [CaptureSize.MEDIUM]: { width: 256, height: 256 },
  [CaptureSize.LARGE]: { width: 512, height: 512 },
};

export const THUMBNAIL_SIZE_TO_PROTOCOL: Record<CaptureSize, LinkType> = {
  [CaptureSize.SMALL]: LinkType.THUMBNAIL_S,
  [CaptureSize.MEDIUM]: LinkType.THUMBNAIL_M,
  [CaptureSize.LARGE]: LinkType.THUMBNAIL_L,
};

export const computeInitialFlyToTarget = (layer: ILayerImage): CesiumRectangle | undefined => {
  if (layer.type === RecordType.RECORD_3D) {
    return undefined;
  }
  try {
    return generateFactoredLayerRectangle(layer);
  } catch (err) {
    console.error('[links-management] failed to compute the preview fly-to target', err);
    return undefined;
  }
};

export const flyPreviewCameraTo = (
  mapViewer: Pick<CesiumViewer, 'camera'>,
  target: CesiumRectangle
): void => {
  try {
    mapViewer.camera.flyTo({ destination: target });
  } catch (err) {
    console.error(
      '[links-management] animated fly-to failed, falling back to an instant view',
      err
    );
    try {
      mapViewer.camera.setView({ destination: target });
    } catch (fallbackErr) {
      console.error('[links-management] failed to frame the preview on the layer', fallbackErr);
    }
  }
};

export const NO_BASE_MAP_ID = '__links-management-no-basemap__';

export const buildPreviewBaseMaps = (
  baseMaps: IBaseMaps | undefined,
  noBaseMapTitle: string
): IBaseMaps | undefined => {
  if (!baseMaps) {
    return undefined;
  }
  const noBaseMapOption: IBaseMap = {
    id: NO_BASE_MAP_ID,
    title: noBaseMapTitle,
    isCurrent: true,
    baseRasterLayers: [],
    thumbnail: NO_BASE_MAP_THUMBNAIL,
  };
  return {
    ...baseMaps,
    maps: [noBaseMapOption, ...baseMaps.maps.map((map) => ({ ...map, isCurrent: false }))],
  };
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
