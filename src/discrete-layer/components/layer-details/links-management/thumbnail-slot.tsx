import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { CaptureSize, THUMBNAIL_CAPTURE_DIMENSIONS } from './links-management.utils';

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
  const { width, height } = THUMBNAIL_CAPTURE_DIMENSIONS[size];

  const content = (
    <>
      <Box className="linkSlotPreview">
        {previewUrl ? (
          <img src={previewUrl} alt={size} />
        ) : (
          <Typography tag="span" className="emptyState">
            <FormattedMessage id="links-management.dialog.empty-state.text" />
          </Typography>
        )}
      </Box>
      <Typography tag="div" className="linkSlotLabel">
        {`${size} (${width}×${height})`}
      </Typography>
      {(hasDraft || hasExisting) && (
        <Typography tag="div" className={hasDraft ? 'statusChanged' : 'statusSaved'}>
          <FormattedMessage
            id={
              hasDraft
                ? 'links-management.dialog.changed.text'
                : 'links-management.dialog.saved.text'
            }
          />
        </Typography>
      )}
      {hasDraft && (
        <Box className="linkSlotActions">
          <Button
            type="button"
            onClick={(evt: React.MouseEvent): void => {
              evt.stopPropagation();
              onRemoveChange();
            }}
          >
            <FormattedMessage id="links-management.dialog.remove-change-btn.text" />
          </Button>
        </Box>
      )}
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
