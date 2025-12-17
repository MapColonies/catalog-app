import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, CircularProgressBar } from '@map-colonies/react-components';
import { IconButton } from '@map-colonies/react-core';
import { Skeleton } from '../../../../common/components/skeleton/skeleton';
import { Status } from '../../../models';
import { StatusText } from './status-text';

import './progress.css';

interface ProgressProps {
  titleId: string;
  show: boolean;
  percentage: number | undefined;
  status: Status | undefined;
  reason: string | undefined;
  isFailed: boolean;
  isValid: boolean;
}

export const Progress: React.FC<ProgressProps> = ({ titleId, show, percentage, status, reason, isFailed, isValid }) => {
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
      <Box className="title bold center">
        <FormattedMessage id={titleId} />
      </Box>
      <Box className="center">
        <Box className="progressBar">
          {
            show ? (
              <CircularProgressBar
                value={percentage ?? 0}
                strokeWidth={6}
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
                  <StatusText status={status} reason={reason} />
                </Box>
                <Box className={`percentage bold`}>
                  {`${percentage ?? 0}%`}
                </Box>
              </CircularProgressBar>
            ) : (
              <Skeleton 
                circle 
                width={150}
                height={150}
              />
            )
          }
        </Box>
      </Box>
    </Box>
  );
};
