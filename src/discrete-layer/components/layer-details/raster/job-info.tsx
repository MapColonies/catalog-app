import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { Status } from '../../../models';
import { Progress } from './progress';
import { isJobValid, isStatusFailed, isTaskValid } from './state-machine/helpers';
import { Aggregation, IJob } from './state-machine/types';
import { Curtain } from './curtain/curtain.component';

import './job-info.css';

interface JobInfoProps {
  job: IJob | undefined;
}

export const JobInfo: React.FC<JobInfoProps> = ({ job }) => {
  if (!job) {
    return null;
  }

  return (
    <>
      <Box className="progressContainer">
        <Progress
          titleId="ingestion.job.validationTaskProgress"
          show={!!job.taskId}
          percentage={job.taskPercentage}
          status={job.taskStatus}
          reason={job.taskReason}
          isFailed={isStatusFailed(job.taskStatus ?? undefined)}
          isValid={isTaskValid(job)}
        />
        <Progress
          titleId="ingestion.job.progress"
          show={!!job.details}
          percentage={job.details?.percentage ?? undefined}
          status={job.details?.status as Status | undefined}
          reason={job.details?.reason as string | undefined}
          isFailed={isStatusFailed(job.details?.status as Status | undefined)}
          isValid={isJobValid(job.details?.status as Status | undefined)}
        />
      </Box>
      <Box className="section curtainContainer">
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
        {job.taskId ? <></> : <Curtain showProgress={true} />}
      </Box>
    </>
  );
};

const renderAggregationWithExceeded = (type: string, aggregation: Aggregation) => {
  return aggregationRow(
    type,
    aggregation,
    (aggregation: Aggregation) => (aggregation.exceeded ? 'error' : (aggregation.count > 0 ? 'warning' : 'success'))
  );
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
