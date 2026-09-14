import React, { useEffect, useState } from 'react';
import { Typography } from '@map-colonies/react-core';
import { Box, calculateCoverCropRegion, ICaptureDimensions } from '@map-colonies/react-components';

import './capture-area-overlay.css';

interface CaptureAreaOverlayProps {
  containerRef: React.RefObject<HTMLElement>;
  targetDimensions: ICaptureDimensions;
}

interface ISize {
  width: number;
  height: number;
}

/**
 * Shows, on top of the live preview map, exactly the region a `capture({width,height})` call for
 * `targetDimensions` would crop — using the same {@link calculateCoverCropRegion} the actual
 * capture uses, so this can never visually drift from the real output. Purely decorative DOM: it
 * never touches Cesium, and `pointer-events: none` throughout keeps the map fully interactive.
 */
export const CaptureAreaOverlay: React.FC<CaptureAreaOverlayProps> = ({
  containerRef,
  targetDimensions,
}) => {
  const [containerSize, setContainerSize] = useState<ISize | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = (): void => {
      setContainerSize({ width: element.clientWidth, height: element.clientHeight });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  if (!containerSize || containerSize.width === 0 || containerSize.height === 0) {
    return null;
  }

  const containerAspect = containerSize.width / containerSize.height;
  const targetAspect = targetDimensions.width / targetDimensions.height;
  const region = calculateCoverCropRegion(containerAspect, targetAspect);

  const left = region.x * containerSize.width;
  const top = region.y * containerSize.height;
  const width = region.width * containerSize.width;
  const height = region.height * containerSize.height;

  return (
    <Box className="captureAreaOverlay">
      <Box className="captureAreaDim" style={{ left: 0, top: 0, right: 0, height: top }} />
      <Box className="captureAreaDim" style={{ left: 0, top: top + height, right: 0, bottom: 0 }} />
      <Box className="captureAreaDim" style={{ left: 0, top, width: left, height }} />
      <Box className="captureAreaDim" style={{ left: left + width, top, right: 0, height }} />
      <Box className="captureAreaRect" style={{ left, top, width, height }}>
        <Typography tag="span" className="captureAreaLabel">
          {`${targetDimensions.width}×${targetDimensions.height}`}
        </Typography>
      </Box>
    </Box>
  );
};
