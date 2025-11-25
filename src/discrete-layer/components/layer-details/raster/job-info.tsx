import React, { Fragment, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, CircularProgressBar } from '@map-colonies/react-components';
import { IconButton, Typography } from '@map-colonies/react-core';
import { Status } from '../../../models';
import { Curtain } from './curtain/curtain.component';
import { isTaskFailed, isTaskValid } from './state-machine/helpers';
import { Aggregation, IJob } from './state-machine/types';

import './job-info.css';

interface JobInfoProps {
  job: IJob | undefined;
}

export const JobInfo: React.FC<JobInfoProps> = ({ job }) => {
  const [dots, setDots] = useState<string>('');

  useEffect(() => {
    let interval: NodeJS.Timer;
    if (job?.taskStatus === Status.InProgress) {
      interval = setInterval(() => {
        setDots(prevDots => {
          const newDots = prevDots.length < 3 ? prevDots + '.' : '';
          return newDots;
        });
      }, 500);
    } else {
      setDots('');
    }
    return () => {
      clearInterval(interval);
    };
  }, [job?.taskStatus]);

  if (!job) {
    return null;
  }

  const isFailed = isTaskFailed(job);
  const isValid = isTaskValid(job);

  const color = isFailed
    ? 'var(--mdc-theme-gc-error-high)'
    : !isValid
      ? 'var(--mdc-theme-gc-warning-high)'
      : 'var(--mdc-theme-gc-success)';

  const status = isFailed
    ? 'error'
    : !isValid
      ? 'warning'
      : 'success';

  const styles = {
    textColor: color || 'var(--mdc-theme-gc-success)',
    pathColor: color || 'var(--mdc-theme-gc-success)',
    trailColor: 'var(--mdc-theme-gc-selection-background)',
  };

  return (
    <>
      <Box className="progress">
        <Box className="title bold">
          <FormattedMessage id="ingestion.job.progress" />
        </Box>
        <Box className="center">
          <Box className="progressBar">
            {
              job.taskId
              ? <CircularProgressBar
                  value={job.taskPercentage ?? 0}
                  styles={styles}
                >
                  {
                    (isFailed || !isValid) &&
                    <IconButton
                      className={`icon mc-icon-Status-Warnings ${status}`}
                      onClick={(e): void => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    />
                  }
                  <Box className={`text bold ${status}`}>
                    <FormattedMessage id={`system-status.job.status_translation.${job.taskStatus}`} />
                    {
                      job.taskStatus === Status.InProgress &&
                      <Typography tag="span" className="dots">{dots}</Typography>
                    }
                  </Box>
                  <Box className={`percentage bold ${status}`}>
                    {`${job.taskPercentage ?? 0}%`}
                  </Box>
                </CircularProgressBar>
              : <Box className="curtainContainer">
                  <Curtain showProgress={true} />
                </Box>
            }
          </Box>
        </Box>
      </Box>
      <Box className="section">
        <Box className="reportContainer">
          <Box className="title underline">
            <FormattedMessage id="ingestion.job.report" />
          </Box>
          <Box className="reportList error">
            {
              Object.entries(job.validationReport?.errorsAggregation || {}).map(([type, aggregation]) => {
                if (typeof aggregation === 'object' && 'exceeded' in aggregation) {
                  return renderAggregationWithExceeded(type, aggregation);
                } else {
                  return renderAggregationWithoutExceeded(aggregation);
                }
              })
            }
          </Box>
        </Box>
      </Box>
    </>
  );
};

const renderAggregationWithExceeded = (type: string, aggregation: Aggregation) => {
  return aggregationRow(
    type,
    aggregation,
    (aggregation: Aggregation) => (aggregation.exceeded ? 'error' : (aggregation.count > 0 ? 'warning' : 'success')));
};

const renderAggregationWithoutExceeded = (aggregation: Record<string, number>) => {
  return (
    Object.entries(aggregation || {}).map(([key, value]) => (
      aggregationRow(key, value, (value: number) => (value === 0 ? 'success' : ''))
    ))
  );
};

const aggregationRow = (key: string, value: any, rowColor: (val: any) => string) => {
  return (
    <Fragment key={key}>
      <Box className={rowColor(value)}>
        <FormattedMessage id={`validationReport.${key}`} />
      </Box>
      <Box className={rowColor(value)}>
        {typeof value === 'object' ? value.count : value}
      </Box>
    </Fragment>
  );
};
