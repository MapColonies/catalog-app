/* eslint-disable */
/* tslint:disable */
// TOFO: Remove when implemented
import React, { useEffect, useRef } from 'react';
import { TextField } from '@map-colonies/react-core';
import {
  Box,
  DateTimeRangePickerFormControl,
  SupportedLocales,
} from '@map-colonies/react-components';
import { useIntl } from 'react-intl';
import { Formik, FormikProps } from 'formik';
import CONFIG from '../../../common/config';
import { usePrevious } from '../../../common/hooks/previous.hook';

export interface FiltersProps {
  isFiltersOpened: boolean;
  filtersView: number;
}

export const Filters: React.FC<FiltersProps> = (props) => {
  const { isFiltersOpened, filtersView } = props;

  const prevFiltersView = usePrevious<number>(filtersView);
  const intl = useIntl();
  let formikRef = useRef<FormikProps<any>>() as any;

  const [filterValues, setFilterValues] = React.useState<any>({ sensor: '' });

  const getFilters = (view: number) => {
    return {
      sensor: 'SENSOR FOR ' + filtersView.toString(),
    };
  };

  useEffect(() => {
    if (isFiltersOpened) {
      console.log('***** RE-STORE FILTERS FOR: ', filtersView);

      setFilterValues(getFilters(filtersView));
    } else {
      console.log('***** STORE FILTERS FOR: ', filtersView, formikRef);
    }
  }, [isFiltersOpened]);

  useEffect(() => {
    if (
      isFiltersOpened &&
      prevFiltersView !== undefined &&
      filtersView !== prevFiltersView
    ) {
      console.log('***** STORE FILTERS FOR: ', prevFiltersView);

      console.log('***** RE-STORE FILTERS FOR: ', filtersView);

      setFilterValues(getFilters(filtersView));
    }
  }, [filtersView, prevFiltersView, isFiltersOpened]);

  return isFiltersOpened ? (
    <div
      style={{
        backgroundColor: 'green',
        top: '70px',
        right: '0',
        width: '20%',
        position: 'absolute',
        height: '80%',
      }}
    >
      <Box position="relative" padding="16px 16px 16px 16px">
        <DateTimeRangePickerFormControl
          width={'100%'}
          renderAsButton={false}
          onChange={(dateRange): void => {
            console.log(
              'DateTimeRangePickerFormControl--->',
              dateRange.from,
              dateRange.to
            );
          }}
          local={{
            setText: intl.formatMessage({
              id: 'filters.date-picker.set-btn.text',
            }),
            startPlaceHolderText: intl.formatMessage({
              id: 'filters.date-picker.start-time.label',
            }),
            endPlaceHolderText: intl.formatMessage({
              id: 'filters.date-picker.end-time.label',
            }),
            calendarLocale:
              SupportedLocales[
                CONFIG.I18N.DEFAULT_LANGUAGE.toUpperCase() as keyof typeof SupportedLocales
              ],
          }}
        />
        <Formik
          initialValues={filterValues}
          enableReinitialize={true}
          innerRef={(instance) => {
            if (instance) {
              formikRef.current = instance;
            }
          }}
          onSubmit={(values, actions) => {
            // setTimeout(() => {
            //   alert(JSON.stringify(values, null, 2));
            //   actions.setSubmitting(false);
            // }, 1000);
          }}
        >
          {(props) => (
            <form onSubmit={props.handleSubmit}>
              <TextField
                label={intl.formatMessage({
                  id: 'custom-bbox.dialog-field.topRightLat.label',
                })}
                id="sensor"
                name="sensor"
                type="string"
                onChange={props.handleChange}
                value={props.values?.sensor}
                // className={classes.spacer}
              />
            </form>
          )}
        </Formik>
      </Box>
    </div>
  ) : (
    <></>
  );
};
