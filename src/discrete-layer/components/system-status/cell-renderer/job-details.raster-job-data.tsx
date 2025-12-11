import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { get } from 'lodash';
import { ICellRendererParams } from 'ag-grid-community';
import { Box } from '@map-colonies/react-components';
import { CircularProgress, IconButton, Tooltip, useTheme } from '@map-colonies/react-core';
import { AutoDirectionBox } from '../../../../common/components/auto-direction-box/auto-direction-box.component';
import { Hyperlink } from '../../../../common/components/hyperlink/hyperlink';
import { RasterIngestionJobType } from '../../../../common/models/raster-job';
import { DETAILS_ROW_ID_SUFFIX } from '../../../../common/components/grid';
import { JobModelType, TaskModelType, useStore } from '../../../models';
import { CopyButton } from '../../job-manager/job-details.copy-button';
import { ErrorsCountPresentor, ErrorsSummary, getErrorCount } from '../../helpers/jobUtils';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';

import './info-area.css';
import './job-details.raster-job-data.css';

interface JobDetailsRasterJobDataProps extends ICellRendererParams { }

const JobDetailsRasterJobData: React.FC<JobDetailsRasterJobDataProps> = ({ data }) => {
  const store = useStore();
  const intl = useIntl();
  const theme = useTheme();
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();

  const jobData = data as JobModelType;

  const [task, setTask] = useState<TaskModelType>();
  const [errorsCount, setErrorsCount] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const isRasterJob =
    jobData.domain?.toLowerCase().includes('raster') &&
    jobData.type &&
    Object.values(RasterIngestionJobType).includes(jobData.type as RasterIngestionJobType);

  const calculateErrorsCount = (errors: ErrorsSummary): number => {
    let count = 0;

    Object.keys(errors.errorsCount).forEach((key) => {
      const errorCount = getErrorCount(errors, key);
      if (errorCount.exceeded === true || typeof errorCount.exceeded === 'undefined') {
        count += errorCount.count ?? 0;
      }
    });

    return count;
  };

  const fetchTask = async () => {
    try {
      const result = await store.queryFindTasks({
        params: {
          jobId: jobData.id.replace(DETAILS_ROW_ID_SUFFIX, ''),
          type: 'validation'
        }
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
    } catch { }
  }

  const computeZoomLevel = () => {
    const ingestionResolution = get(jobData?.parameters, 'ingestionResolution')?.toString();
    if (!ingestionResolution) {
      return;
    }

    const index = Object.values(ZOOM_LEVELS_TABLE)
      .map((value) => value.toString())
      .findIndex(value => value === ingestionResolution);

    if (index >= 0) {
      setZoomLevel(index);
    }
  }

  const getGpkgFilesPath = () => {
    return jobData.parameters?.inputFiles?.gpkgFilesPath?.[0];
  }

  const isNewFormatJob = () => {
    return !!getGpkgFilesPath();
  }

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

  const errorsMessage = intl.formatMessage({ id: 'general.errors.text' });

  const zoomLabel = zoomLevel !== undefined ? `(${zoomLevel})` : '';
  const rasterInfo = (jobData.parameters && isNewFormatJob()) ?
    `${getGpkgFilesPath()} ${zoomLabel}` :
    intl.formatMessage({ id: 'general.deprecated-job.text' });

  const hasErrors = errorsCount > 0;

  if (!isRasterJob) {
    return null;
  }

  return (
    <Box id='rasterJobData' className='jobDataContainer'>
      {
        <AutoDirectionBox>
          {
            !isLoading ? rasterInfo :
              <CircularProgress size='xsmall'></CircularProgress>
          }
        </AutoDirectionBox>
      }
      {
        !isLoading &&
        <Box className={`linkItem errorsCountContainer ${errorsCount === 0 ? 'noErrors' : ''}`} key={`${jobData.id}`}>
          {hasErrors &&
            <>
              <IconButton
                className={`error mc-icon-Status-Warnings`}
                onClick={(e): void => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />

              <Tooltip content={
                <Box>
                  {
                    Object.entries(task?.parameters?.errorsSummary.errorsCount as ErrorsSummary['errorsCount']).map(([key, value]) => {
                      const color =
                        value === 0
                          ? theme.custom?.GC_SUCCESS
                          : getErrorCount(task?.parameters?.errorsSummary, key)?.exceeded === false
                            ? theme.custom?.GC_WARNING_HIGH
                            : theme.custom?.GC_ERROR_HIGH
                      return ErrorsCountPresentor(key, value, 'reportList', color);
                    })
                  }
                </Box>
              }>
                <Hyperlink url={task?.parameters?.TBDlinkTBD ?? ''} label={`${errorsCount.toString()} ${errorsMessage}`} />
              </Tooltip>

              <CopyButton text={task?.parameters?.TBDlinkTBD ?? ''} key={'errorsReportLink'} />
            </>
          }
          {!hasErrors && isNewFormatJob() && task &&
            intl.formatMessage({ id: 'general.no-errors.text' })
          }
        </Box>
      }
    </Box >
  );
}

export default JobDetailsRasterJobData;