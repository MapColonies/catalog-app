import { truncate } from 'lodash';
import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { Tooltip, Typography } from '@map-colonies/react-core';
import { Status } from '../../../models';
import { Copy } from '../../../../common/components/copy';

import './status-text.css';

const FAILURE_REASON_MAX_LENGTH = 80;

interface StatusTextProps {
  status: Status | undefined;
  reason: string | undefined;
}

export const StatusText: React.FC<StatusTextProps> = ({ status, reason }) => {
  const [dots, setDots] = useState<string>('');

  useEffect(() => {
    let interval: NodeJS.Timer;
    if (status === Status.InProgress) {
      interval = setInterval(() => {
        setDots(prevDots => (prevDots.length < 3 ? prevDots + '.' : ''));
      }, 500);
    } else {
      setDots('');
    }
    return () => {
      clearInterval(interval);
    };
  }, [status]);

  return (
    <Box display="flex" alignItems="center">
      {
        reason ? (
          <Tooltip content={truncate(reason, { length: FAILURE_REASON_MAX_LENGTH })}>
            <Box className="cursorText">
              <FormattedMessage id={`system-status.job.status_translation.${status}`} />
            </Box>
          </Tooltip>
        ) : (
          <Box className="cursorDefault">
            <FormattedMessage id={`system-status.job.status_translation.${status}`} />
            {
              status === Status.InProgress &&
              <Typography tag="span" className="dots">{dots}</Typography>
            }
          </Box>
        )
      }
      {
        status === Status.Failed && reason &&
        <Box>
          <Copy value = {reason} iconStyle = {{ fontSize: `20px` }}/>
        </Box>
      }
    </Box>
  );
};
