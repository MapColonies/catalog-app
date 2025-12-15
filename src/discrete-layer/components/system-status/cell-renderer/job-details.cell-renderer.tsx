import React, { useEffect, useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { FormattedMessage, useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { truncate } from 'lodash';
import { Moment } from 'moment';
import { IconButton, Tooltip, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { DETAILS_ROW_ID_SUFFIX } from '../../../../common/components/grid';
import { Loading } from '../../../../common/components/tree/statuses/loading';
import { relativeDateFormatter, dateFormatter, } from '../../../../common/helpers/formatters';
import { JobModelType, ProductType, Status, TasksGroupModelType } from '../../../models';
import { useQuery } from '../../../models/RootStore';
import { CopyButton } from '../../job-manager/job-details.copy-button';
import { JobDetailsHeader } from './job-details.header';
import JobDetailsExportJobData from './job.details.export-job-data';
import JobDetailsRasterJobData from './job-details.raster-job-data';

import './job-details.cell-renderer.css';

type ValueType = 'string' | 'Status' | 'date';
interface ITaskField {
  name: string;
  label: string;
  valueType: ValueType;
}
const taskFields: ITaskField[] = [
  {
    label: 'system-status.task.fields.type.label',
    name: 'type',
    valueType: 'string',
  },
  {
    label: 'system-status.task.fields.counts.label',
    name: 'counts',
    valueType: 'string',
  },
  {
    label: 'system-status.task.fields.created.label',
    name: 'created',
    valueType: 'date',
  },
  {
    label: 'system-status.task.fields.updated.label',
    name: 'updated',
    valueType: 'date',
  },
  {
    label: 'system-status.task.fields.status.label',
    name: 'status',
    valueType: 'Status',
  },
];

interface StatusPresentorParams {
  task: Record<string, unknown>;
  reactKey?: string
}

const StatusPresentor: React.FC<StatusPresentorParams> = ({ task, reactKey = '' }) => {
  const intl = useIntl();

  const statusText = intl.formatMessage({
    id: `system-status.job.status_translation.${task.status as string}`,
  });

  if (task.status === Status.Failed) {
    const FAIL_REASON_MAX_LEN = 35;
    const ERROR_ICON_SIZE = 20;
    const ERROR_ICON_COLOR = 'var(--mdc-theme-gc-error-medium)';
    const ellipsizedFailReason = truncate(task.reason as string, {
      length: FAIL_REASON_MAX_LEN,
    });

    return (
      <Box key={reactKey} className={`${(task.status as string).toLowerCase()} gridCell`}>
        {statusText}
        <Tooltip content={ellipsizedFailReason}>
          <IconButton
            style={{
              fontSize: `${ERROR_ICON_SIZE}px`,
              color: ERROR_ICON_COLOR,
            }}
            className="mc-icon-Warning"
            label="FAIL REASON ICON"
          />
        </Tooltip>
        <CopyButton text={task.reason as string} />
      </Box>
    );
  }
  return (
    <Box className={`${(task.status as string).toLowerCase()} gridCell`}>
      {statusText}
    </Box>
  );
};

const getValuePresentor = (
  task: Record<string, unknown>,
  field: ITaskField,
  idx: number,
  setCollapsed?: (collapsed: boolean) => void
): JSX.Element => {
  switch (field.valueType) {
    case 'date': {
      const dateAndTimeTooltipContent: string = dateFormatter(
        task[field.name] as Moment,
        true
      );

      return (
        <Tooltip content={dateAndTimeTooltipContent} key={`DATE_${idx}`}>
          <Box className="gridCell">
            {relativeDateFormatter(task[field.name] as Moment)}
          </Box>
        </Tooltip>
      );
    }
    case 'Status':
      return <StatusPresentor key={`STATUS_${idx}`} task={task} />;
    default:
      return <Box key={`gridCdellDefault_${idx}`} className="gridCell">{task[field.name] as string} </Box>;
  }
};

interface TasksRendererParams {
  jobId: string;
  productType: ProductType;
}

const TasksRenderer: React.FC<TasksRendererParams> = observer(({ jobId, productType}) => {
  const [tasksData, setTasksData] = useState<TasksGroupModelType[]>([]);

  const { loading, data } = useQuery(
    (store) =>
      store.queryTasks({
        params: {
          jobId,
        },
      }),
    {
      fetchPolicy: 'no-cache',
    }
  );

  useEffect(() => {
    if (data?.tasks) {
      setTasksData(data.tasks);
    }
  }, [data]);

  if (loading)
    return (
      <Box className="loadingContainer">
        <Loading />
      </Box>
    );

  return (
    <>
      {
        tasksData.map((task) => {
          return taskFields.map((field, idx) => {
            return getValuePresentor(
              (task as unknown) as Record<string, unknown>,
              field,
              idx
            );
          });
        })
      }
    </>
  );
});

export const JobDetailsRenderer: React.FC<ICellRendererParams> = observer((props) => {
  const store = useStore();
  
  const [propsWithJobParams, setPropsWithJobParams] = useState(props);
  const jobId = (props.data as JobModelType).id.replace(DETAILS_ROW_ID_SUFFIX, '');

  const { data } = useQuery(
    (store) =>
      store.queryJob({
        id: jobId,
      })
  );

  useEffect(() => {
    if (!data?.job) return;

    setPropsWithJobParams(prev => ({
      ...prev,
      data: {
        ...props.data,
        parameters: data.job?.parameters
      },
    }));
  }, [data]);

  const keyPrefix = `${(props.data as JobModelType).resourceId as string}`;

  return (
    <Box key={jobId + store.jobsStore.reloadDataCounter} className="jobDetailsContainer">
      <JobDetailsHeader job={props.data as JobModelType} /> 
      <JobDetailsExportJobData key={jobId} {...propsWithJobParams} />
      <JobDetailsRasterJobData key={jobId} {...propsWithJobParams} />
      <Box className="gridContainer">
        {taskFields.map((field) => (
          <Typography
            key={`${keyPrefix}_${field.name}`}
            tag="div"
            className="column-label"
            style={{ fontWeight: 'bold' }}
          >
            <FormattedMessage id={field.label} />
          </Typography>
        ))}
        <TasksRenderer productType={(props.data as JobModelType).productType as ProductType} jobId={jobId} />
      </Box>
    </Box>
  );
});
