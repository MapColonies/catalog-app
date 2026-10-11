import React from 'react';
import { FormattedMessage } from 'react-intl';
import { CollapsibleList, SimpleListItem, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { LinkStatusBadge } from './link-status-badge';

interface LinkSectionProps {
  titleId: string;
  icon: string;
  hasChanges: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const LinkSection: React.FC<LinkSectionProps> = ({
  titleId,
  icon,
  hasChanges,
  defaultOpen = false,
  children,
}) => (
  <CollapsibleList
    className="linkSection"
    defaultOpen={defaultOpen}
    handle={
      <SimpleListItem
        className="linkSectionHandle"
        graphic={{ icon, size: 'small' }}
        metaIcon="chevron_right"
        text={
          <Box className="linkSectionTitle">
            <Typography tag="span" className="linkSectionTitleText">
              <FormattedMessage id={titleId} />
            </Typography>
            {hasChanges && <LinkStatusBadge status="changed" />}
          </Box>
        }
      />
    }
  >
    <Box className="linkSectionBody">{children}</Box>
  </CollapsibleList>
);
