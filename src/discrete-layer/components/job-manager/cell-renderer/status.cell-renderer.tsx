import React from 'react';
import { useIntl } from 'react-intl';
import { get } from 'lodash';
import { ICellRendererParams } from 'ag-grid-community';
import { Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { JobModelType, Status } from '../../../models';
import { FINAL_STATUSES } from '../../job-manager/job.types';

import './status.cell-renderer.css';

const NO_DATA = 0;
const NO_WIDTH = 0;

const STATUS_BAR_WIDTH = 134;
const STATUS_BAR_HEIGHT = 18;

export const StatusRenderer: React.FC<ICellRendererParams> = (props) => {
  const intl = useIntl();
  const jobData = props.data as JobModelType;
  const status = jobData.status;

  const getProgress = (): string | null => {
    if (jobData.taskCount as number === NO_DATA) {
        return null;
    }

    const SUM_INIT = 0;

    const finalStatusCount = FINAL_STATUSES.reduce(
      (sum: number, finalStatus: Status) => {
        const lowerCasedStatus = finalStatus.toLowerCase();
        const statusSum = get(jobData, `${lowerCasedStatus}Tasks`) as number;
        const nextSum: number =
          sum + (isNaN(statusSum) ? NO_DATA : statusSum);

        return nextSum;
      },
      SUM_INIT
    );

    // FINAL STATUSES TASKS / TOTAL TASKS COUNT

    return `(${finalStatusCount}/${jobData.taskCount as number})`;
  };

  const getProgressComponent = (): JSX.Element => {
    const statusText = intl.formatMessage({
      id: `system-status.job.status_translation.${status as string}`,
    });

    return (
      <Box>
        {`${statusText}  ${getProgress() ?? ''}`}
      </Box>
    );
  };

  type StatusCountType = number | null | undefined;

  const calcStatusWidth = (statusCount: StatusCountType): number => {
    const { taskCount } = jobData;

    if (taskCount === NO_DATA) return NO_WIDTH;

    return ((statusCount as number) / (taskCount as number)) * STATUS_BAR_WIDTH;
  };

  const getSectionComponent = (
    statusType: Status,
    width: number
  ): JSX.Element | null => {
    if (width === NO_WIDTH) return null;

    const className = `${statusType}Area`;

    return (
      <Box
        className={className}
        style={{
          width: `${width}px`,
          height: `${STATUS_BAR_HEIGHT}px`,
        }}
      />
    );
  };

  const getPercentageView = (): JSX.Element => {
    const { percentage } = jobData;

    return (
        <Typography dir="auto" className={'progressPercentage'} tag={'p'}>
          {typeof percentage !== 'undefined' && percentage !== null
            ? `${percentage}%`
            : ''}
        </Typography>
    );
  };

  const getProgressbarSections = (): JSX.Element | null => {
    const { completedTasks, inProgressTasks, failedTasks, expiredTasks, status} = jobData;

    const jobStatusFinal = FINAL_STATUSES.find(finalStatus => finalStatus === status);

    // If job status is a final status - we should return a full bar with its color.
    if (typeof jobStatusFinal !== 'undefined') {
      return getSectionComponent(jobStatusFinal, STATUS_BAR_WIDTH);
    }

    // Render sections
    const completedWidth = calcStatusWidth(completedTasks);
    const failedWidth = calcStatusWidth(failedTasks);
    const inProgressWidth = calcStatusWidth(inProgressTasks);
    const expiredWidth = calcStatusWidth(expiredTasks);

    return (
      <Box className="progressSectionsContainer">
        {getSectionComponent(Status.Completed, completedWidth)}
        {getSectionComponent(Status.Failed, failedWidth)}
        {getSectionComponent(Status.Expired, expiredWidth)}
        {getSectionComponent(Status.InProgress, inProgressWidth)}
      </Box>
    );
  };

  return (
    <Box className="statusBarContainer">
      <Box className="statusText">
        {getProgressComponent()}
      </Box>
      <Box
        className="statusBar"
        style={{
          width: `${STATUS_BAR_WIDTH}px`,
          height: `${STATUS_BAR_HEIGHT}px`,
        }}>
        {getPercentageView()}
        {getProgressbarSections()}
      </Box>
    </Box>
  );
};
