import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { Skeleton } from '../../../../common/components/skeleton/skeleton';
import { Status } from '../../../models';
import { Progress } from './progress';
import { isJobValid, isStatusFailed, isTaskValid } from './state-machine/helpers';
import { IJob } from './state-machine/types';

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
      <Box className="section">
        <Box className="reportContainer">
          <Box className="title underline">
            <FormattedMessage id="ingestion.job.report" />
          </Box>
          {
            job.taskId ? (
              job.validationReport?.errorsSummary?.errorsCount ? (
                <Box className="reportList">
                  {
                    Object.entries(job.validationReport.errorsSummary.errorsCount).map(([key, value]) => {
                      const color = (val: number): string =>
                        val === 0
                          ? 'success'
                          : (job.validationReport?.errorsSummary?.thresholds as Record<string, { exceeded: boolean }>)?.[key]?.exceeded === false
                            ? 'warning'
                            : 'error';
                      return count(key, value, color);
                    })
                  }
                </Box>
              ) : (
                <Box className="error">
                  <FormattedMessage id="ingestion.error.not-found" values={{ value: 'job.validationReport.errorsSummary.errorsCount' }} />
                </Box>
              )
            ) : (
              <Skeleton width="99%" count={8} />
            )
          }
        </Box>
      </Box>
    </>
  );
};

const count = (key: string, value: number, color: (val: number) => string) => {
  return (
    <Fragment key={key}>
      <Box className={color(value)}>
        <FormattedMessage id={`validationReport.${key}`} />
      </Box>
      <Box className={color(value)}>
        {value}
      </Box>
    </Fragment>
  );
};
