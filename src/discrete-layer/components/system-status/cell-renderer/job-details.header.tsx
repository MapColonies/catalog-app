import React from 'react';
import { useIntl } from 'react-intl';
import { Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { AutoDirectionBox } from '../../../../common/components/auto-direction-box/auto-direction-box.component';
import TooltippedValue from '../../../../common/components/form/tooltipped.value';
import {DETAILS_ROW_ID_SUFFIX} from '../../../../common/components/grid';
import { Copy } from '../../../../common/components/copy';
import { JobModelType, Status } from '../../../models';

import './job-details.header.css';

interface JobDetailsHeaderProps {
  job: JobModelType;
}

// Component should present additional job details:
// internalId, resourceId, producerName,
// Fail reason if status failed: reason, if status === Status.Failed
// Number of tasks specification: failedTasks, inProgressTasks, completedTasks, pendingTasks

export const JobDetailsHeader: React.FC<JobDetailsHeaderProps> = ({
  job: {
    id,
    resourceId,
    producerName,
    reason,
    status,
    failedTasks,
    inProgressTasks,
    completedTasks,
    pendingTasks,
    expiredTasks,
  },
}) => {
  const intl = useIntl();

  const getStatusTranslation = (status: Status): string => {
    return intl.formatMessage({
      id: `system-status.job.status_translation.${status as string}`,
    });
  };

  const getDetailsTranslation = (detail: string): string => {
    return intl.formatMessage({
      id: `system-status.job-details.header.${detail}`,
    });
  };

  const dataToPresent = {
    detailsRow: {
      id: {
        label: getDetailsTranslation('internalId'),
        value: id.replace(DETAILS_ROW_ID_SUFFIX, ''),
      },
      externalId: {
        label: getDetailsTranslation('extetnalId'),
        value: resourceId as string,
      },
      producerName: {
        label: getDetailsTranslation('producerName'),
        value: producerName as string,
      },
    },
    taskCountRow: {
      completed: {
        label: getStatusTranslation(Status.Completed),
        value: (completedTasks as unknown) as string,
      },
      failed: {
        label: getStatusTranslation(Status.Failed),
        value: (failedTasks as unknown) as string,
      },
      inProgress: {
        label: getStatusTranslation(Status.InProgress),
        value: (inProgressTasks as unknown) as string,
      },
      pending: {
        label: getStatusTranslation(Status.Pending),
        value: (pendingTasks as unknown) as string,
      },
      // suspended: {
      expired: {
        label: getStatusTranslation(Status.Suspended),
        value: (expiredTasks as unknown) as string,
      },
    },
    failReason: {
      reason: status === Status.Failed ? reason : null,
    },
  };


  const generateDetailsRow = (): JSX.Element => {
    return (
      <>
        {Object.values(dataToPresent.detailsRow).map(({ label, value }, index) => {
          return (
            <Box className="detailsField" key={`${label}${index}`}>
              <TooltippedValue tag="p" className="detailLabel">
                {`${label}:`}
              </TooltippedValue>
              <TooltippedValue tag="p" className="detailValue">
                {value}
              </TooltippedValue>
              <Copy value = {value} iconStyle = {{ fontSize: `20px` }}/>
            </Box>
          );
        })}
      </>
    );
  };

  const generateTaskCounts = (): JSX.Element => {
    const localeValueWithCommas = (value: string): string => Number(value).toLocaleString();

    return (
      <>
        {Object.values(dataToPresent.taskCountRow).map(({ label, value },index) => {
          return (
            <Box className="counterField" key={`${label}${index}`}>
              <Typography tag="p" className="countLabel">
                {`${label}:`}
              </Typography>
              <Typography tag="p" className="countValue">
                {localeValueWithCommas(value)}
              </Typography>
            </Box>
          );
        })}
      </>
    );
  };

  const generateFailReason = (): JSX.Element | null => {
    const failReason = dataToPresent.failReason.reason as string;
    if (!failReason) return null;
    return (
      <>
        <AutoDirectionBox className="failReasonText">
          {failReason}
        </AutoDirectionBox>
        <Copy value = {failReason} iconStyle = {{ fontSize: `20px` }}/>
      </>
    );
  };

  return (
    <Box className="jobDetailsHeaderContainer">
      <Box className="jobInfoTop">
        <Box className="detailsRow">{generateDetailsRow()}</Box>
        <Box className="taskCountsRow">{generateTaskCounts()}</Box>
      </Box>
      <Box className="failReasonBottom">{generateFailReason()}</Box>
    </Box>
  );
};
