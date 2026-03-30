import React, { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { Typography, useTheme } from '@map-colonies/react-core';
import { Skeleton } from '../../../../common/components/skeleton/skeleton';
import { AutoDirectionBox } from '../../../../common/components/auto-direction-box/auto-direction-box.component';
import { Status } from '../../../models';
import { JobErrorsSummary } from '../../job-errors-summary/job-errors-summary';
import { Progress } from './progress';
import { ResolutionConflictDialog } from './resolution-conflict.dialog';
import { isJobValid, isStatusFailed, isTaskValid } from './state-machine/helpers';
import { IJob } from './state-machine/types';

import './job-info.css';

interface JobInfoProps {
  job: IJob | undefined;
}

export const JobInfo: React.FC<JobInfoProps> = ({ job }) => {
  const theme = useTheme();
  const [isResolutionConflictDialogOpen, setIsResolutionConflictDialogOpen] = useState(false);
  const [isResolutionConflictApproved, setIsResolutionConflictApproved] = useState(false);

  const openResolutionConflictDialog = useCallback(() => {
    setIsResolutionConflictDialogOpen(true);
  }, []);

  const approveResolutionConflictDialog = useCallback(() => {
    setIsResolutionConflictApproved(true);
  }, []);

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
      <Box className="section panel">
        <Box className="reportContainer">
          <Box className="title underline bold">
            <FormattedMessage id="ingestion.job.report" />
          </Box>
          {job.taskId ? (
            job.validationReport?.errorsSummary?.errorsCount ? (
              <Box className="reportList bold">
                {JobErrorsSummary(
                  theme,
                  job.validationReport.errorsSummary,
                  'countWrapper',
                  job.taskStatus === Status.Failed ? theme.custom?.GC_ERROR_HIGH : '',
                  {
                    key: 'resolution',
                    action: openResolutionConflictDialog,
                    isApproved: isResolutionConflictApproved,
                  }
                )}
              </Box>
            ) : (
              <Box className="reportError">
                {job.taskReason ? (
                  <Typography className="error" tag="span">
                    <AutoDirectionBox>{job.taskReason}</AutoDirectionBox>
                  </Typography>
                ) : (
                  <Box className="reportInProgress">
                    <FormattedMessage id="ingestion.job.report-in-progress" />
                  </Box>
                )}
              </Box>
            )
          ) : (
            <Box className="reportLoading">
              <Skeleton width="99%" count={8} />
            </Box>
          )}
        </Box>
      </Box>
      {isResolutionConflictDialogOpen && (
        <ResolutionConflictDialog
          isOpen={isResolutionConflictDialogOpen}
          onSetIsOpen={setIsResolutionConflictDialogOpen}
          onApprove={approveResolutionConflictDialog}
        />
      )}
    </>
  );
};
