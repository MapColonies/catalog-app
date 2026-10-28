import { useCallback, useEffect, useState } from 'react';
import type { CesiumViewer, ICaptureDimensions } from '@map-colonies/react-components';
import { blobToDataUrl } from './thumbnail-capture.utils';

interface UseThumbnailCaptureOptions {
  mapViewer: CesiumViewer;
  dimensions: ICaptureDimensions;
  onCaptured: (dataUrl: string) => void;
}

export interface ThumbnailCaptureState {
  isPreviewing: boolean;
  isCapturing: boolean;
  isPreviewLoading: boolean;
  startPreview: () => void;
  cancelPreview: () => void;
  captureThumbnail: () => Promise<void>;
}

export const useThumbnailCapture = ({
  mapViewer,
  dimensions,
  onCaptured,
}: UseThumbnailCaptureOptions): ThumbnailCaptureState => {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { width, height } = dimensions;

  useEffect(() => {
    if (!isPreviewing || !mapViewer.screenshot) {
      return undefined;
    }
    const { screenshot } = mapViewer;
    screenshot.startCapturePreview({ width, height });
    const removeListener = screenshot.onLoadingChange(setIsPreviewLoading);
    return (): void => {
      removeListener();
      screenshot.stopCapturePreview();
      setIsPreviewLoading(false);
    };
  }, [mapViewer, isPreviewing, width, height]);

  const startPreview = useCallback((): void => setIsPreviewing(true), []);
  const cancelPreview = useCallback((): void => setIsPreviewing(false), []);

  const captureThumbnail = useCallback(async (): Promise<void> => {
    if (!mapViewer.screenshot) {
      return;
    }
    setIsCapturing(true);
    try {
      const blob = await mapViewer.screenshot.capture({ width, height, waitForTiles: true });
      onCaptured(await blobToDataUrl(blob));
      setIsPreviewing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCapturing(false);
    }
  }, [mapViewer, width, height, onCaptured]);

  return {
    isPreviewing,
    isPreviewLoading,
    isCapturing,
    startPreview,
    cancelPreview,
    captureThumbnail,
  };
};
