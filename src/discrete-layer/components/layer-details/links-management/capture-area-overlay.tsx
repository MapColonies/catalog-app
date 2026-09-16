import React, { useEffect, useState } from 'react';
import { Typography } from '@map-colonies/react-core';
import {
  Box,
  calculateCenteredCropRegion,
  ICaptureDimensions,
} from '@map-colonies/react-components';

import './capture-area-overlay.css';

interface CaptureAreaOverlayProps {
  containerRef: React.RefObject<HTMLElement>;
  targetDimensions: ICaptureDimensions;
}

interface ISize {
  width: number;
  height: number;
}

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

  const canvas = containerRef.current?.querySelector('canvas');
  const pixelRatio = canvas && canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : 1;

  const region = calculateCenteredCropRegion(
    containerSize.width,
    containerSize.height,
    targetDimensions.width / pixelRatio,
    targetDimensions.height / pixelRatio
  );

  const { x: left, y: top, width, height } = region;

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
