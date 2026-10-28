import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, ICaptureDimensions } from '@map-colonies/react-components';
import { Button, CircularProgress, Typography } from '@map-colonies/react-core';
import { ThumbnailCaptureState } from './use-thumbnail-capture.hook';
import { THUMBNAIL_128_DIMENSIONS } from './thumbnail-capture.utils';

import './thumbnail-capture.css';

interface ThumbnailCaptureProps {
  thumbnailUrl: string | undefined;
  capture: ThumbnailCaptureState;
  dimensions?: Readonly<ICaptureDimensions>;
}

export const ThumbnailCapture: React.FC<ThumbnailCaptureProps> = ({
  thumbnailUrl,
  capture,
  dimensions = THUMBNAIL_128_DIMENSIONS,
}) => {
  const {
    isPreviewing,
    isCapturing,
    isPreviewLoading,
    startPreview,
    cancelPreview,
    captureThumbnail,
  } = capture;
  const { width, height } = dimensions;
  const dimensionsLabel = `${width}×${height}`;

  return (
    <Box className="thumbnailCapture">
      <Box className="thumbnailCapturePreview" style={{ width, height }}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={dimensionsLabel} />
        ) : (
          <Typography tag="span" className="thumbnailCaptureEmpty">
            <FormattedMessage id="thumbnail-capture.empty" />
          </Typography>
        )}
      </Box>
      <Typography tag="span" className="thumbnailCaptureLabel" dir="ltr">
        {dimensionsLabel}
      </Typography>
      {isPreviewing ? (
        <Box className="thumbnailCaptureActions">
          <Button type="button" disabled={isCapturing || isPreviewLoading} onClick={cancelPreview}>
            <FormattedMessage id="general.cancel-btn.text" />
          </Button>
          <Button
            raised
            type="button"
            disabled={isCapturing || isPreviewLoading}
            onClick={(): void => void captureThumbnail()}
          >
            {isCapturing ? (
              <CircularProgress className="loading" />
            ) : (
              <FormattedMessage id="thumbnail-capture.capture-btn.text" />
            )}
          </Button>
        </Box>
      ) : (
        <Box className="thumbnailCaptureActions">
          <Button outlined type="button" onClick={startPreview}>
            <FormattedMessage id="thumbnail-capture.take" />
          </Button>
        </Box>
      )}
    </Box>
  );
};
