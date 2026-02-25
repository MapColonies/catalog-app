import React from 'react';
import { FormattedMessage } from 'react-intl';
import { CircularProgress } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';

export const Loading: React.FC = (): JSX.Element => {
  return (
    <Box className="alignCenter">
      <FormattedMessage id="general.loading.text" />
      <CircularProgress />
    </Box>
  );
};
