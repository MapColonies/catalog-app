import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, CircularProgressBar } from '@map-colonies/react-components';
import { IconButton } from '@map-colonies/react-core';
import { isTaskFailed, isTaskValid } from './state-machine/helpers';
import { IJob } from './state-machine/types';

import './job-info.css';

interface JobInfoProps {
  job: IJob | undefined;
}

export const JobInfo: React.FC<JobInfoProps> = ({ job }) => {
  if (!job) {
    return null;
  }

  const isFailed = isTaskFailed(job);
  const isValid = isTaskValid(job);
  
  const color = isFailed 
    ? 'var(--mdc-theme-gc-error-high)' 
    : (!isValid ? 'var(--mdc-theme-gc-warning-high)' : 'var(--mdc-theme-gc-success)');
  
  const className = isFailed 
    ? 'error' 
    : (!isValid ? 'warning' : 'success');

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
              job.taskId &&
              <CircularProgressBar
                value={job.taskPercentage ?? 0}
                styles={styles}
              >
                {
                  (isFailed || !isValid) &&
                  <IconButton
                    className={`icon mc-icon-Status-Warnings ${isFailed ? 'error' : !isValid ? 'warning' : ''}`}
                    onClick={(e): void => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                }
                <Box className={`text ${className}`}>
                  {`${job.taskPercentage ?? 0}%`}
                </Box>
              </CircularProgressBar>
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
              Object.entries(job.validationReport?.errorsAggregation?.count || {}).map(([key, value]) => (
                <Fragment key={key}>
                  <Box className={value === 0 ? 'success' : ''}>
                    <FormattedMessage id={`validationReport.${key}`} />
                  </Box>
                  <Box className={value === 0 ? 'success' : ''}>
                    {value}
                  </Box>
                </Fragment>
              ))
            }
            {
              (['smallHoles', 'smallGeometries'] as const).map((aggregation) => (
                renderAggregationWithExceeded(job, aggregation)
              ))
            }
          </Box>
        </Box>
      </Box>
    </>
  );
};

const renderAggregationWithExceeded = (job: IJob, type: 'smallHoles' | 'smallGeometries') => {
  if (!job.validationReport?.errorsAggregation || !job.validationReport?.errorsAggregation[type]) {
    return null;
  }

  const exceeded = job.validationReport.errorsAggregation[type].exceeded;
  const count = job.validationReport.errorsAggregation[type].count;
  const className = exceeded ? 'error' : (count > 0 ? 'warning' : 'success');

  return (
    <Fragment key={type}>
      <Box className={className}>
        <FormattedMessage id={`validationReport.${type}`} />
      </Box>
      <Box className={className}>
        {count}
      </Box>
    </Fragment>
  );
};
