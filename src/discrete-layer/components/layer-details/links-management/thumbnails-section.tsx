import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, CircularProgress, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { LinkType } from '../../../../common/models/link-type.enum';
import { DraftLinksMap } from '../../../models/discreteLayersStore';
import { ILayerImage } from '../../../models/layerImage';
import { getLinkUrlWithToken } from '../../helpers/layersUtils';
import { CaptureSize, THUMBNAIL_SIZE_TO_PROTOCOL } from './links-management.utils';
import { ThumbnailSlot } from './thumbnail-slot';

const THUMBNAIL_SIZES = [CaptureSize.SMALL, CaptureSize.MEDIUM, CaptureSize.LARGE];

interface ThumbnailsSectionProps {
  layerRecord: ILayerImage | undefined;
  draftLinks: DraftLinksMap;
  isComposingCapture: boolean;
  selectedCaptureSize: CaptureSize;
  isCapturing: boolean;
  onEnterCaptureMode: () => void;
  onCancelCapture: () => void;
  onSelectCaptureSize: (size: CaptureSize) => void;
  onCaptureConfirm: () => void;
  onRemoveChange: (protocol: LinkType) => void;
}

export const ThumbnailsSection: React.FC<ThumbnailsSectionProps> = ({
  layerRecord,
  draftLinks,
  isComposingCapture,
  selectedCaptureSize,
  isCapturing,
  onEnterCaptureMode,
  onCancelCapture,
  onSelectCaptureSize,
  onCaptureConfirm,
  onRemoveChange,
}) => {
  return (
    <>
      {isComposingCapture && (
        <Typography tag="div" className="captureComposeHint">
          <FormattedMessage id="links-management.dialog.capture-hint.text" />
        </Typography>
      )}
      <Box className="thumbnailsRow">
        {THUMBNAIL_SIZES.map((size) => {
          const protocol = THUMBNAIL_SIZE_TO_PROTOCOL[size];
          const draft = draftLinks[protocol];
          const existingUrl = getLinkUrlWithToken(layerRecord?.links ?? [], protocol);
          return (
            <ThumbnailSlot
              key={size}
              size={size}
              previewUrl={draft?.dataUrl ?? existingUrl}
              hasDraft={!!draft}
              hasExisting={!!existingUrl}
              selectable={isComposingCapture}
              selected={selectedCaptureSize === size}
              onSelect={onSelectCaptureSize}
              onRemoveChange={(): void => onRemoveChange(protocol)}
            />
          );
        })}
      </Box>
      {isComposingCapture ? (
        <Box className="linkSlotActions">
          <Button type="button" disabled={isCapturing} onClick={onCancelCapture}>
            <FormattedMessage id="general.cancel-btn.text" />
          </Button>
          <Button raised type="button" disabled={isCapturing} onClick={onCaptureConfirm}>
            {isCapturing ? (
              <CircularProgress className="loading" />
            ) : (
              <FormattedMessage id="links-management.dialog.capture-btn.text" />
            )}
          </Button>
        </Box>
      ) : (
        <Button type="button" onClick={onEnterCaptureMode}>
          <FormattedMessage id="links-management.dialog.capture-thumbnail-btn.text" />
        </Button>
      )}
    </>
  );
};
