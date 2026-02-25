import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Tooltip } from '@map-colonies/react-core';
import {
  Box,
  DateTimePicker,
  SupportedLocales,
} from '@map-colonies/react-components';
import moment, { Moment } from 'moment';
import {
  dateFormatter,
  relativeDateFormatter,
} from '../../../../common/helpers/formatters';
import CONFIG from '../../../../common/config';
import PlaceholderCellRenderer from './placeholder.cell-renderer';

import './date.cell-renderer.css';
import { get } from 'lodash';
import { DateGranularityType } from '../../../models';

interface IDateCellRendererParams extends ICellRendererParams {
  field: string;
  shouldShowPredicate?: (data: unknown) => boolean;
  comingSoonDaysIndication?: number;
  onChange?: (updatedExpirationDate: Date, jobData: unknown) => void;
  datePickerProps?: {
    disablePast?: boolean;
    disableFuture?: boolean;
    minDate?: Date;
  };
}

const FUTURE_DATE_DIFF_ANCHOR = 0;
const SOON_INDICATOR_CSS_CLASS = 'soonIndicator';
const CHANGEABLE_DATE_CSS_CLASS = 'changeable';
const DATE_GRANULARITY = DateGranularityType.DATE_AND_TIME;

export const DateCellRenderer: React.FC<IDateCellRendererParams> = (props) => {
  const {
    field,
    shouldShowPredicate,
    comingSoonDaysIndication,
    onChange,
    datePickerProps,
  } = props;
  const isChangeable = typeof onChange !== 'undefined';
  const currentDate = useMemo(() => {
    return typeof get(props.data, field) === 'undefined'
      ? undefined
      : moment(get(props.data, field));
  }, [props.data]);
  const [date, setDate] = useState<Moment | undefined>(currentDate);
  const prevDate = useRef<Moment | undefined>(currentDate);

  const shouldShowTime = useMemo(
    () =>
      (DATE_GRANULARITY as DateGranularityType) ===
      DateGranularityType.DATE_AND_TIME,
    []
  );
  const dateFnsFormat = useMemo(
    () => (shouldShowTime ? 'dd/LL/yyyy HH:mm' : 'dd/LL/yyyy'),
    [shouldShowTime]
  );

  useEffect(() => {
    setDate(currentDate);
  }, [currentDate]);

  const isComingSoonClassName = (): string => {
    if (typeof date === 'undefined') return '';

    const today = moment();
    const diffFromToday = today.diff(date);
    if (
      typeof comingSoonDaysIndication === 'undefined' ||
      diffFromToday > FUTURE_DATE_DIFF_ANCHOR
    )
      return '';

    return moment(date).diff(today, 'days') <= comingSoonDaysIndication
      ? SOON_INDICATOR_CSS_CLASS
      : '';
  };

  if (
    typeof date !== 'undefined' &&
    (typeof shouldShowPredicate === 'undefined' ||
      shouldShowPredicate(props.data))
  ) {
    return (
      <Tooltip content={dateFormatter(date, true)}>
        <Box
          className={`dateCellRendererContainer ${
            isChangeable ? CHANGEABLE_DATE_CSS_CLASS : ''
          }`}
        >
          <Box className={isComingSoonClassName()}>
            {relativeDateFormatter(date)}
          </Box>

          {isChangeable && (
            <DateTimePicker
              className="updateableDateCellRendererPicker"
              showTime={shouldShowTime}
              value={date.toDate()}
              allowKeyboardControl={false}
              format={dateFnsFormat}
              helperText={false}
              error={false}
              onClose={(): void => {
                if (
                  typeof onChange !== 'undefined' &&
                  !moment(prevDate.current).isSame(date, 'day')
                ) {
                  onChange(date.toDate(), props.data);
                }
              }}
              onOpen={(): void => {
                prevDate.current = date;
              }}
              onChange={(newDate: string): void => {
                setDate(moment(newDate));
              }}
              local={{
                calendarLocale: CONFIG.I18N
                  .DEFAULT_LANGUAGE as SupportedLocales,
              }}
              autoOk
              {...(datePickerProps ?? {})}
            />
          )}
        </Box>
      </Tooltip>
    );
  }

  return <PlaceholderCellRenderer {...props} />;
};
