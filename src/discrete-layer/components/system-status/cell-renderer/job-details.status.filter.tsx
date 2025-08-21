import React, {
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Box } from '@map-colonies/react-components';
import { Select } from '@map-colonies/react-core';
import { useIntl } from 'react-intl';
import { JobModelType, Status } from '../../../models';
import { IDoesFilterPassParams, IFilterParams, } from 'ag-grid-community';

interface IFilterOnModelChange {
  onModelChange: (model: any | null, additionalEventAttributes?: any) => void;
}

export const JobDetailsStatusFilter: React.FC<IFilterOnModelChange> = ({ onModelChange }) => {
  const intl = useIntl();

  const [filterStatus, setFilterStatus] = useState<string | Status>('');


  const getStatusTranslation = useCallback((status: Status): string => {
    const statusText = intl.formatMessage({
      id: `system-status.job.status_translation.${status as string}`,
    });

    return statusText;
  },[intl]);

  const getStatusOptions = useMemo((): JSX.Element => {
    const statuses: Record<string, string> = {};

    const showAllStatusesText = intl.formatMessage({
      id: 'system-status.job.filter.status.all',
    });


    for (const [key, val] of Object.entries(Status)) {
      statuses[key] = getStatusTranslation(val);
    }

    return (
      <Select
        style={{ height: '180px', borderRadius: 0, width: '100%' }}
        enhanced
        placeholder={showAllStatusesText}
        options={statuses}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>): void => {
          onModelChange(evt.currentTarget.value === '' ? null : evt.currentTarget.value)
        }}
      />
    );
  },[getStatusTranslation, intl]);

  return (
    <Box style={{ height: '230px', width: '200px', overflow: 'hidden' }}>
      {getStatusOptions}
    </Box>
  );
};
