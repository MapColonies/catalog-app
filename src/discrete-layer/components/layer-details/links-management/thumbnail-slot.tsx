import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { IconButton, Tooltip, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { CaptureSize, THUMBNAIL_CAPTURE_DIMENSIONS } from './links-management.utils';
import { LinkStatusBadge } from './link-status-badge';

interface ThumbnailSlotProps {
  size: CaptureSize;
  previewUrl: string | undefined;
  hasDraft: boolean;
  hasExisting: boolean;
  selectable: boolean;
  selected: boolean;
  onSelect: (size: CaptureSize) => void;
  onRemoveChange: () => void;
}

export const ThumbnailSlot: React.FC<ThumbnailSlotProps> = ({
  size,
  previewUrl,
  hasDraft,
  hasExisting,
  selectable,
  selected,
  onSelect,
  onRemoveChange,
}) => {
  const intl = useIntl();
  const { width, height } = THUMBNAIL_CAPTURE_DIMENSIONS[size];
  const dimensionsLabel = `${width}×${height}`;
  const removeChangeLabel = intl.formatMessage({
    id: 'links-management.dialog.remove-change-btn.text',
  });

  const content = (
    <>
      <Box className="linkSlotPreview">
        {previewUrl ? (
          <img src={previewUrl} alt={dimensionsLabel} />
        ) : (
          <Typography tag="span" className="emptyState">
            <FormattedMessage id="links-management.dialog.empty-state.text" />
          </Typography>
        )}
      </Box>
      {hasDraft && (
        <Tooltip content={removeChangeLabel}>
          <IconButton
            className="revertButton"
            type="button"
            icon={{ icon: 'undo', size: 'xsmall' }}
            label={removeChangeLabel}
            onClick={(evt: React.MouseEvent): void => {
              evt.stopPropagation();
              evt.preventDefault();
              onRemoveChange();
            }}
          />
        </Tooltip>
      )}
      <Box className="thumbnailSlotFooter">
        <Typography tag="span" className="linkSlotLabel" dir="ltr">
          {dimensionsLabel}
        </Typography>
        {(hasDraft || hasExisting) && <LinkStatusBadge status={hasDraft ? 'changed' : 'saved'} />}
      </Box>
    </>
  );

  if (!selectable) {
    return <Box className="linkSlot thumbnailSlot">{content}</Box>;
  }

  return (
    <Box
      component="label"
      className={`linkSlot thumbnailSlot thumbnailSlotSelectable${
        selected ? ' thumbnailSlotSelected' : ''
      }`}
    >
      <input
        type="radio"
        name="captureSize"
        className="visuallyHidden"
        checked={selected}
        onChange={(): void => onSelect(size)}
      />
      {content}
    </Box>
  );
};
