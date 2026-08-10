import React from 'react';
import { useIntl } from 'react-intl';
import { Icon, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { emphasizeByHTML } from '../../../common/helpers/formatters';

interface DialogDisclaimerProps {
  actionId: string;
}

export const DialogDisclaimer: React.FC<DialogDisclaimerProps> = ({ actionId }) => {
  const intl = useIntl();

  const content = intl.formatMessage(
    { id: 'action.dialog.disclaimer' },
    { action: emphasizeByHTML(`${intl.formatMessage({ id: actionId })}`) }
  );

  return (
    <Box className="disclaimer">
      <Icon className="icon" icon={{ icon: 'info', size: 'xsmall' }} />
      <Typography tag="div" dangerouslySetInnerHTML={{ __html: content }}></Typography>
    </Box>
  );
};
