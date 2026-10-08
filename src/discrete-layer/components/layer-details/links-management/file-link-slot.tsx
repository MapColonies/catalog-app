import React, { useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { Hyperlink } from '../../../../common/components/hyperlink/hyperlink';
import { IDraftLink } from '../../../models/discreteLayersStore';
import { LinkStatusBadge } from './link-status-badge';

interface FileLinkSlotProps {
  accept: string;
  draft: IDraftLink | undefined;
  existingUrl: string | undefined;
  showOpenLink: boolean;
  onFileChange: (evt: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveChange: () => void;
}

export const FileLinkSlot: React.FC<FileLinkSlotProps> = ({
  accept,
  draft,
  existingUrl,
  showOpenLink,
  onFileChange,
  onRemoveChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayName = draft?.fileName ?? (existingUrl ? existingUrl.split('/').pop() : undefined);

  return (
    <Box className="linkSlot fileSlot">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hiddenFileInput"
        onChange={onFileChange}
      />
      <Box className="fileSlotInfo">
        {displayName ? (
          <Typography tag="span" className="fileName" dir="ltr" title={displayName}>
            {displayName}
          </Typography>
        ) : (
          <Typography tag="span" className="emptyState">
            <FormattedMessage id="links-management.dialog.empty-state.text" />
          </Typography>
        )}
        {(draft || existingUrl) && <LinkStatusBadge status={draft ? 'changed' : 'saved'} />}
      </Box>
      <Box className="linkSlotActions">
        <Button outlined type="button" onClick={(): void => inputRef.current?.click()}>
          <FormattedMessage id="links-management.dialog.replace-btn.text" />
        </Button>
        {draft && (
          <Button type="button" onClick={onRemoveChange}>
            <FormattedMessage id="links-management.dialog.remove-change-btn.text" />
          </Button>
        )}
        {showOpenLink && existingUrl && !draft && (
          <Hyperlink className="openLink" url={existingUrl}>
            <FormattedMessage id="links-management.dialog.open-btn.text" />
          </Hyperlink>
        )}
      </Box>
    </Box>
  );
};
