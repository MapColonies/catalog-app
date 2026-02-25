/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';

import './error.css';

interface ErrorProps {
  className: string;
  message: string;
  details?: string;
}

export const Error: React.FC<ErrorProps> = (props) => {
  const { className, message, details } = props;

  return (
    <Box className={className + ' alignCenter'}>
      <Box className="errorTitle">
        <Typography use="headline6" tag="div">
          <FormattedMessage id="general.error.text" />
        </Typography>
      </Box>
      <Box>
        <Typography use="body2" tag="div">
          <FormattedMessage id="general.error.title" />
        </Typography>
      </Box>
      <Box className="errorDescription">
        <Typography tag="div">
          <Typography tag="span">
            <FormattedMessage id="general.error.description" />
          </Typography>
          {message && <Typography tag="span"> {message}</Typography>}
          {!message && (
            <Typography tag="span">
              {' '}
              <FormattedMessage id="general.server.unavailable" />
            </Typography>
          )}
        </Typography>
      </Box>
      {details !== undefined && (
        <Box className="errorDescription">
          <Typography tag="p">{details}</Typography>
        </Box>
      )}
    </Box>
  );
};
