import { get, isEmpty } from 'lodash';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { Typography, useTheme } from '@map-colonies/react-core';
import { Skeleton } from '../../../../common/components/skeleton/skeleton';
import { AutoDirectionBox } from '../../../../common/components/auto-direction-box/auto-direction-box.component';
import {
  APPROVAL_REQUIRED_ERRORS,
  RasterErrorsCountKey,
} from '../../../../common/models/job-errors-summary.raster';
import { Status } from '../../../models';
import { JobErrorsSummaryRasterJobData } from '../../job-manager/cell-renderer/job-details/job-errors-summary.raster-job-data';
import { FINAL_STATUSES } from '../../job-manager/job.types';
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
  const [isApproved, setIsApproved] = useState(false);
  const latestJobRef = useRef<IJob | undefined>(job);

  if (job) {
    latestJobRef.current = job;
  }

  const displayJob = latestJobRef.current;

  const openResolutionConflictDialog = useCallback(() => {
    setIsResolutionConflictDialogOpen(true);
  }, []);

  const approveResolutionConflictDialog = useCallback(() => {
    setIsApproved(true);
  }, []);

  const errorsCount = displayJob?.validationReport?.errorsSummary?.errorsCount;
  const thresholds = displayJob?.validationReport?.errorsSummary?.thresholds;
  const jobStatus = displayJob?.details?.status as Status | undefined;

  const isViewOnly = useMemo(() => {
    const isStatusReadOnly = jobStatus != null && FINAL_STATUSES.includes(jobStatus);
    if (!errorsCount) {
      return isStatusReadOnly;
    }
    const hasOtherErrors = Object.entries(errorsCount).some(([key, value]) => {
      if (!APPROVAL_REQUIRED_ERRORS.includes(key as RasterErrorsCountKey)) {
        if (value > 0) {
          const isExceeded = get(thresholds, `${key}.exceeded`);
          return isExceeded === undefined ? true : isExceeded;
        }
      }
      return false;
    });
    return isStatusReadOnly || hasOtherErrors;
  }, [errorsCount, thresholds, jobStatus]);

  if (!displayJob) {
    return null;
  }

  const { taskId, taskStatus, taskReason, taskPercentage, details, validationReport } = displayJob;

  const errorsSummary = validationReport?.errorsSummary;
  const jobReason = details?.reason as string | undefined;

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
          status={jobStatus}
          reason={jobReason}
          isFailed={isStatusFailed(jobStatus)}
          isValid={isJobValid(jobStatus)}
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
                {JobErrorsSummaryRasterJobData(
                  theme,
                  errorsSummary!,
                  'countWrapper',
                  taskStatus === Status.Failed ? theme.custom?.GC_ERROR_HIGH : '',
                  {
                    key: 'resolution',
                    action: openResolutionConflictDialog,
                    isEnabled: taskStatus === Status.Completed,
                    isApproved:
                      isApproved ||
                      !isEmpty(details?.parameters.allowedValidationErrors),
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
          viewOnly={isViewOnly || isApproved}
        />
      )}
    </>
  );
};

JobInfoComponent.displayName = 'JobInfo';
export const JobInfo = React.memo(JobInfoComponent);
