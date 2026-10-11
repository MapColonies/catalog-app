import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Typography } from '@map-colonies/react-core';

export type LinkStatus = 'changed' | 'saved';

interface LinkStatusBadgeProps {
  status: LinkStatus;
}

export const LinkStatusBadge: React.FC<LinkStatusBadgeProps> = ({ status }) => (
  <Typography tag="span" className={`linkStatus linkStatus--${status}`}>
    <FormattedMessage id={`links-management.dialog.${status}.text`} />
  </Typography>
);
