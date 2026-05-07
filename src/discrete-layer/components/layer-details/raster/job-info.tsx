import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  job?: IJob;
}

const JobInfoComponent: React.FC<JobInfoProps> = ({ job }) => {
  const theme = useTheme();
  const [isResolutionConflictDialogOpen, setIsResolutionConflictDialogOpen] = useState(false);
  const [isResolutionConflictApproved, setIsResolutionConflictApproved] = useState(false);
  const latestJobRef = useRef<IJob | undefined>(job);

  if (job) {
    latestJobRef.current = job;
  }

  const displayJob = latestJobRef.current;

  const openResolutionConflictDialog = useCallback(() => {
    setIsResolutionConflictDialogOpen(true);
  }, []);

  const approveResolutionConflictDialog = useCallback(() => {
    setIsResolutionConflictApproved(true);
  }, []);

  const errorsCount = displayJob?.validationReport?.errorsSummary?.errorsCount;
  const jobStatus = displayJob?.details?.status as Status | undefined;

  const isResolutionConflictViewOnly = useMemo(() => {
    const isStatusReadOnly = jobStatus === Status.Failed || jobStatus === Status.Aborted;

    if (!errorsCount) {
      return isStatusReadOnly;
    }
    const hasOtherErrors = Object.entries(errorsCount).some(
      ([key, value]) => key !== 'resolution' && value > 0
    );
    return isStatusReadOnly || hasOtherErrors;
  }, [errorsCount, jobStatus]);

  if (!displayJob) {
    return null;
  }

  const { taskId, taskStatus, taskReason, taskPercentage, details, validationReport } = displayJob;

  const errorsSummary = validationReport?.errorsSummary;

  const detailsStatus = details?.status as Status | undefined;
  const detailsReason = details?.reason as string | undefined;

  return (
    <>
      <Box className="progressContainer">
        <Progress
          titleId="ingestion.job.validationTaskProgress"
          show={Boolean(taskId)}
          percentage={taskPercentage}
          status={taskStatus}
          reason={taskReason}
          isFailed={isStatusFailed(taskStatus)}
          isValid={isTaskValid(displayJob)}
        />

        <Progress
          titleId="ingestion.job.progress"
          show={Boolean(details)}
          percentage={details?.percentage ?? undefined}
          status={detailsStatus}
          reason={detailsReason}
          isFailed={isStatusFailed(detailsStatus)}
          isValid={isJobValid(detailsStatus)}
        />
      </Box>

      <Box className="section panel">
        <Box className="reportContainer">
          <Box className="title underline bold">
            <FormattedMessage id="ingestion.job.report" />
          </Box>

          {taskId ? (
            errorsCount ? (
              <Box className="reportList bold">
                {JobErrorsSummary(
                  theme,
                  errorsSummary!,
                  'countWrapper',
                  taskStatus === Status.Failed ? theme.custom?.GC_ERROR_HIGH : '',
                  {
                    key: 'resolution',
                    action: openResolutionConflictDialog,
                    isEnabled: taskStatus === Status.Completed,
                    isApproved: isResolutionConflictApproved,
                  }
                )}
              </Box>
            ) : (
              <Box className="reportError">
                {taskReason ? (
                  <Typography className="error" tag="span">
                    <AutoDirectionBox>{taskReason}</AutoDirectionBox>
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
          viewOnly={isResolutionConflictViewOnly || isResolutionConflictApproved}
        />
      )}
    </>
  );
};

JobInfoComponent.displayName = 'JobInfo';

export const JobInfo = React.memo(JobInfoComponent);
