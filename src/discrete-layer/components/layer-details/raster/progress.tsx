import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, CircularProgressBar } from '@map-colonies/react-components';
import { IconButton, Typography } from '@map-colonies/react-core';
import { Status } from '../../../models';
import { Curtain } from './curtain/curtain.component';

import './progress.css';

interface ProgressProps {
  titleId: string;
  show: boolean;
  percentage: number | undefined;
  status: Status | undefined;
  isFailed: boolean;
  isValid: boolean;
}

export const Progress: React.FC<ProgressProps> = ({ titleId, show, percentage, status, isFailed, isValid }) => {
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

  const getClass = (isFailed: boolean, isValid: boolean): string => (
    isFailed
      ? 'error'
      : !isValid
        ? 'warning'
        : 'success'
  );

  const getStyles = (isFailed: boolean, isValid: boolean) => {
    const color = isFailed
      ? 'var(--mdc-theme-gc-error-high)'
      : !isValid
        ? 'var(--mdc-theme-gc-warning-high)'
        : 'var(--mdc-theme-gc-success)';
    return {
      textColor: color || 'var(--mdc-theme-gc-success)',
      pathColor: color || 'var(--mdc-theme-gc-success)',
      trailColor: 'var(--mdc-theme-gc-selection-background)'
    };
  };

  return (
    <Box className="progress">
      <Box className="title bold">
        <FormattedMessage id={titleId} />
      </Box>
      <Box className="center">
        <Box className="progressBar">
          {
            show ? (
              <CircularProgressBar
                value={percentage ?? 0}
                styles={getStyles(isFailed, isValid)}
              >
                {
                  (isFailed || !isValid) &&
                  <IconButton
                    className={`icon mc-icon-Status-Warnings ${getClass(isFailed, isValid)}`}
                    onClick={(e): void => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                }
                {
                  !(isFailed || !isValid) && status === Status.Completed &&
                  <IconButton
                    className={`icon mc-icon-Ok ${getClass(isFailed, isValid)}`}
                    onClick={(e): void => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                }
                {
                  !(isFailed || !isValid) && status !== Status.Completed &&
                  <Box className="spacer" />
                }
                <Box className={`text bold ${getClass(isFailed, isValid)}`}>
                  <FormattedMessage id={`system-status.job.status_translation.${status}`} />
                  {
                    status === Status.InProgress &&
                    <Typography tag="span" className="dots">{dots}</Typography>
                  }
                </Box>
                <Box className={`percentage bold ${getClass(isFailed, isValid)}`}>
                  {`${percentage ?? 0}%`}
                </Box>
              </CircularProgressBar>
            ) : (
              <Box className="curtainContainer">
                <Curtain showProgress={true} />
              </Box>
            )
          }
        </Box>
      </Box>
    </Box>
  );
};
