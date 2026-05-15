import { ICellRendererParams } from 'ag-grid-community';
import { get } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import {
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from '@map-colonies/react-core';
import { AutoDirectionBox } from '../../../../../common/components/auto-direction-box/auto-direction-box.component';
import { DETAILS_ROW_ID_SUFFIX } from '../../../../../common/components/grid';
import { Hyperlink } from '../../../../../common/components/hyperlink/hyperlink';
import { useEnums } from '../../../../../common/hooks/useEnum.hook';
import { Domain } from '../../../../../common/models/domain';
import { RasterErrorsSummary } from '../../../../../common/models/job-errors-summary.raster';
import { JobModelType, Status, TaskModelType, useStore } from '../../../../models';
import useZoomLevelsTable from '../../../export-layer/hooks/useZoomLevelsTable';
import {
  getRasterErrorCount,
  JobErrorsSummary,
} from '../../../job-errors-summary/job-errors-summary';
import { getEnumKeys } from '../../../layer-details/utils';

import './info-area.css';
import './job-details.raster-job-data.css';

interface JobDetailsRasterJobDataProps extends ICellRendererParams {}

const MAX_ERRORS_SHOWN = 99;

export const JobDetailsRasterJobData: React.FC<JobDetailsRasterJobDataProps> = ({ data }) => {
  const jobData = data as JobModelType;
  const intl = useIntl();
  const theme = useTheme();
  const store = useStore();
  const ENUMS = useEnums();
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const [task, setTask] = useState<TaskModelType>();
  const [errorsCount, setErrorsCount] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const rasterIngestionJobTypes = useMemo(() => {
    return getEnumKeys(ENUMS, 'RasterJobType').map((key) => ENUMS[key]?.realValue);
  }, []);

  const isRasterJob =
    jobData.domain === Domain.RASTER &&
    jobData.type &&
    rasterIngestionJobTypes.includes(jobData.type as string);

  const calculateErrorsCount = (errors: RasterErrorsSummary): number => {
    let count = 0;
    Object.keys(errors.errorsCount).forEach((key) => {
      const errorCount = getRasterErrorCount(errors, key);
      if (errorCount.exceeded === true || typeof errorCount.exceeded === 'undefined') {
        count += errorCount.count ?? 0;
      }
    });
    return count;
  };

  const fetchTask = useCallback(async () => {
    try {
      const result = await store.queryFindTasks({
        params: {
          jobId: jobData.id.replace(DETAILS_ROW_ID_SUFFIX, ''),
          type: 'validation',
        },
      });
      if (!result?.findTasks[0]) {
        return undefined;
      }
      const task = { ...result.findTasks[0] };
      if (task) {
        setTask(task);
        const errorsCount = task?.parameters?.errorsSummary;
        if (errorsCount) {
          setErrorsCount(calculateErrorsCount(errorsCount));
        }
      }
    } catch {}
  }, [store, jobData]);

  const computeZoomLevel = useCallback(() => {
    const ingestionResolution = get(jobData?.parameters, 'ingestionResolution')?.toString();
    if (!ingestionResolution) {
      return;
    }
    const index = Object.values(ZOOM_LEVELS_TABLE)
      .map((value) => value.toString())
      .findIndex((value) => value === ingestionResolution);
    if (index >= 0) {
      setZoomLevel(index);
    }
  }, [jobData]);

  const getGpkgFilesPath = () => {
    return jobData.parameters?.inputFiles?.gpkgFilesPath?.[0];
  };

  const hasGpkgPath = () => {
    return !!getGpkgFilesPath();
  };

  const errorsMessage = intl.formatMessage({ id: 'general.errors.text' });

  const zoomLabel = zoomLevel !== undefined ? `(${zoomLevel})` : '';

  const rasterInfo =
    jobData.parameters && hasGpkgPath()
      ? `${getGpkgFilesPath()} ${zoomLabel}`
      : intl.formatMessage({ id: 'general.deprecated-job.text' });

  const hasErrors = errorsCount > 0;
  const isTaskFailed = task?.status === Status.Failed;

  useEffect(() => {
    if (!isRasterJob) {
      return;
    }
    fetchTask();
    computeZoomLevel();
  }, [jobData, jobData.parameters, isRasterJob]);

  useEffect(() => {
    const loading = !jobData.parameters;
    setIsLoading(loading);
  }, [jobData]);

  if (!isRasterJob) {
    return null;
  }

  return (
    <Box id="rasterJobData" className="jobDataContainer">
      <Box className="content">
        <AutoDirectionBox>
          {!isLoading ? rasterInfo : <CircularProgress size="xsmall"></CircularProgress>}
        </AutoDirectionBox>
      </Box>
      {!isLoading && (
        <Box className="errorsContainerPosition" key={`${jobData.id}`}>
          {!isTaskFailed && hasErrors && (
            <Box className="errorsSummaryContainer">
              <IconButton
                className="mc-icon-Status-Warnings error statusIcon"
                onClick={(e): void => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
              <Tooltip
                content={
                  <Box>
                    {JobErrorsSummary(theme, task?.parameters?.errorsSummary, 'reportItem')}
                  </Box>
                }
              >
                <Hyperlink
                  className="error"
                  url={task?.parameters?.report?.url ?? ''}
                  label={`${
                    errorsCount > MAX_ERRORS_SHOWN ? `+${MAX_ERRORS_SHOWN}` : errorsCount
                  } ${errorsMessage}`}
                ></Hyperlink>
              </Tooltip>
              <Hyperlink
                className="error"
                url={task?.parameters?.report?.url ?? ''}
                label={`${
                  errorsCount > MAX_ERRORS_SHOWN ? `+${MAX_ERRORS_SHOWN}` : errorsCount
                } ${errorsMessage}`}
              >
                <IconButton className="mc-icon-Download downloadIcon error statusIcon" />
              </Hyperlink>
            </Box>
          )}
          {!isTaskFailed && !hasErrors && hasGpkgPath() && task && (
            <Box className="success">{intl.formatMessage({ id: 'general.no-errors.text' })}</Box>
          )}
          {isTaskFailed && (
            <Tooltip
              content={
                <Box>
                  {JobErrorsSummary(
                    theme,
                    task?.parameters?.errorsSummary,
                    'reportItem',
                    theme.custom?.GC_ERROR_HIGH
                  )}
                </Box>
              }
            >
              <Typography className="error" tag="span">
                {intl.formatMessage({ id: 'ingestion.error.failed-task-report' })}
              </Typography>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};
