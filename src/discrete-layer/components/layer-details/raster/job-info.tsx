import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { Typography, useTheme } from '@map-colonies/react-core';
import { Skeleton } from '../../../../common/components/skeleton/skeleton';
import { AutoDirectionBox } from '../../../../common/components/auto-direction-box/auto-direction-box.component';
import { Status } from '../../../models';
import { RenderErrorCounts } from '../../job-error-summary/job-error-summary';
import { Progress } from './progress';
import { isJobValid, isStatusFailed, isTaskValid } from './state-machine/helpers';
import { IJob } from './state-machine/types';

import './job-info.css';

interface JobInfoProps {
  job: IJob | undefined;
}

export const JobInfo: React.FC<JobInfoProps> = ({ job }) => {
  const theme = useTheme();

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
                    RenderErrorCounts(theme, job.validationReport.errorsSummary, 'countWrapper')
                  }
                </Box>
              ) : (
                <Box className="reportError error">
                  {
                    job.taskReason
                    ? <Typography tag={'span'}>
                        <AutoDirectionBox>{job.taskReason}</AutoDirectionBox>
                      </Typography>
                    : <FormattedMessage id="ingestion.error.not-found" values={{ value: 'job.validationReport.errorsSummary.errorsCount' }} />
                  }
                </Box>
              )
            ) : (
              <Box className="reportLoading">
                <Skeleton width="99%" count={8} />
              </Box>
            )
          }
        </Box>
      </Box>
    </>
  );
};
