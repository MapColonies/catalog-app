import React from 'react';
import { useIntl } from 'react-intl';
import { get } from 'lodash';
import { ICellRendererParams } from 'ag-grid-community';
import { Box } from '@map-colonies/react-components';
import { Typography } from '@map-colonies/react-core';
import { Hyperlink } from '../../../../common/components/hyperlink/hyperlink';
import { dateFormatter } from '../../../../common/helpers/formatters';
import { JobModelType, Status } from '../../../models';
import { CopyButton } from '../../job-manager/job-details.copy-button';

import './job.details.export-job-data.css';

interface JobDetailsExportJobDataProps extends ICellRendererParams {}

const NONE = 0;

const JobDetailsExportJobData: React.FC<JobDetailsExportJobDataProps> = ({ data }) => {
    const intl = useIntl();
    const jobData = data as JobModelType;
    
    const isExportJob = jobData.type?.toLowerCase().includes('export');

    const jobDescription = jobData.description as string | undefined ?? '';
    const exportLinks = get(jobData, `parameters.callbackParams.links`) as Record<string, string> | undefined;

    const expirationTimeUTC: string = get(jobData, `parameters.cleanupData.cleanupExpirationTimeUTC`);
    let formattedExpirationTime = '';
    let hasExpired: boolean = false;

    if (expirationTimeUTC) {
      const expirationTime = new Date(expirationTimeUTC);
      formattedExpirationTime = dateFormatter(expirationTime);
      const today = new Date();
      hasExpired = expirationTime < today;
    }

    const jobStatus = jobData.status;

    // const exportLinkLabel = intl.formatMessage({id: 'system-status.export-details.link.label'});
    const jobNoDescriptionText = intl.formatMessage({id: 'system-status.export-details.no-description.text'});
    
    const jobDescriptionText = intl.formatMessage({ id: 'system-status.export-details.description.label' } );

    if (!(isExportJob as boolean)) return null;

    return (
      <Box className="exportJobDataContainer">
        <Box className="jobDescriptionContainer">
          {
            exportLinks && expirationTimeUTC && 
            <>
              <Typography tag="span" className={`${hasExpired ? 'expired' : 'valid'}`}>
                { intl.formatMessage({id: 'system-status.export-details.expirationDate'}) + ': ' + formattedExpirationTime}
              </Typography>
              { " | " }
            </>
          }
          <Typography tag="bdi" className="jobDescriptionLabel">
            {jobDescriptionText}
          </Typography>
          <Typography tag="bdi" className="jobDescription">
            {jobDescription.length === NONE
              ? jobNoDescriptionText
              : jobDescription}
          </Typography>
        </Box>

        {typeof exportLinks !== 'undefined' && jobStatus === Status.Completed && (
          <Box className="exportJobLinkContainer">
            {Object.entries(exportLinks).map(([linkType, exportLink]) => {
              const typeToPresent = linkType.replace('URI', '');
              return (
                <Box className="linkContainer" key={`${jobData.id}_${linkType}`}>
                  <Hyperlink url={exportLink} label={typeToPresent} />
                  <CopyButton text={exportLink} key={exportLink} />
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    );
}

export default JobDetailsExportJobData;