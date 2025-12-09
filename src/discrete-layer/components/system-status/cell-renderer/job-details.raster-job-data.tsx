import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { get } from 'lodash';
import { ICellRendererParams } from 'ag-grid-community';
import { Box } from '@map-colonies/react-components';
import { IconButton } from '@map-colonies/react-core';
import { Hyperlink } from '../../../../common/components/hyperlink/hyperlink';
import { DETAILS_ROW_ID_SUFFIX } from '../../../../common/components/grid';
import { JobModelType, TaskModelType, useStore } from '../../../models';
import { CopyButton } from '../../job-manager/job-details.copy-button';
import { RasterJobTypeEnum } from '../../../../common/models/raster-job';
import { ValidationErrorsAggregation } from '../../layer-details/raster/state-machine/types';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';

import './info-area.css';
import './job-details.raster-job-data.css';

interface JobDetailsRasterJobDataProps extends ICellRendererParams { }

const JobDetailsRasterJobData: React.FC<JobDetailsRasterJobDataProps> = ({ data }) => {
  const intl = useIntl();
  const jobData = data as JobModelType;

  const store = useStore();
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();

  const [task, setTask] = useState<TaskModelType>();
  const [errorsCount, setErrorsCount] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<number | undefined>(undefined);

  const isRasterJob =
    jobData.domain?.toLowerCase().includes('raster') &&
    jobData.type &&
    Object.values(RasterJobTypeEnum).includes(jobData.type as RasterJobTypeEnum);

  const calculateErrorsCount = (errors: ValidationErrorsAggregation): number => {
    return (
      Object.values(errors.count).reduce((sum, val) => sum + val, 0) +
      (errors.smallGeometries.exceeded ? errors.smallGeometries.count : 0) +
      (errors.smallHoles.exceeded ? errors.smallHoles.count : 0)
    );
  };

  const fetchTask = async () => {
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

      const errorsAggregation = task?.parameters?.errorsAggregation;

      if (errorsAggregation) {
        setErrorsCount(calculateErrorsCount(errorsAggregation));
      }
    }
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

  useEffect(() => {
    if (!isRasterJob) {
      return;
    }

    fetchTask();
    computeZoomLevel();
  }, [jobData, isRasterJob, ZOOM_LEVELS_TABLE])

  const numberOfErrorsMessage = intl.formatMessage({ id: 'general.errors.text' });

  const gpkgFilePath = jobData.parameters?.inputFiles?.gpkgFilesPath?.[0];

  const zoom = zoomLevel !== undefined ? `(${zoomLevel})` : '';
  const gpkgInfoText = gpkgFilePath ? `GPKG: ${gpkgFilePath} ${zoom}` : '';

  if (!isRasterJob) {
    return null;
  }

  return (
    <Box id='rasterJobData' className="jobDataContainer">
      {
        gpkgInfoText || <div className='spacer' />
      }
      {
        errorsCount > 0 &&
        <Box className="linkItem errorsCountContainer" key={`${jobData.id}`}>
          <IconButton
            className={`error mc-icon-Status-Warnings`}
            onClick={(e): void => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          <Hyperlink url={task?.parameters?.link ?? ''} label={`${errorsCount.toString()} ${numberOfErrorsMessage}`} />
          <CopyButton text={task?.parameters?.link ?? ''} key={'errorsReportLink'} />
        </Box>
      }
    </Box>
  );
}

export default JobDetailsRasterJobData;