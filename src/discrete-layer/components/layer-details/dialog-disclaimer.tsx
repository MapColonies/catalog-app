import React from 'react';
import { Icon, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';

interface DialogDisclaimerProps {
  content: string;
}

export const DialogDisclaimer: React.FC<DialogDisclaimerProps> = ({ content }) => (
  <Box className="disclaimer">
    <Icon className="icon" icon={{ icon: 'info', size: 'xsmall' }} />
    <Typography tag="div" dangerouslySetInnerHTML={{ __html: content }}></Typography>
  </Box>
);
