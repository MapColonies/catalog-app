import React from 'react';
import { useIntl } from 'react-intl';
import { Controller, RegisterOptions, useFormContext } from 'react-hook-form';
import {
  lastDayOfYear,
  startOfDay,
  startOfYear,
  subDays,
  subYears,
} from 'date-fns';
import { isEmpty } from 'lodash';
import {
  Box,
  DateRangePicker,
  isDateRange,
} from '@map-colonies/react-components';
import { getDateformatType } from '../../../../../common/helpers/formatters';
import {
  FieldConfigModelType,
  FilterFieldValidationModelType,
} from '../../../../models';
import CatalogFilterFieldLabel from './catalog-filter-field-label.component';

interface CatalogFilterDateRangeFieldProps {
  fieldDescriptor: FieldConfigModelType;
}

export const CatalogFilterDateRangeField: React.FC<
  CatalogFilterDateRangeFieldProps
> = ({ fieldDescriptor }) => {
  const intl = useIntl();
  const formMethods = useFormContext();
  const fieldId = fieldDescriptor.fieldName ?? '';

  const fieldValidation: FilterFieldValidationModelType = {
    ...fieldDescriptor.isFilterable.validation,
    pattern: fieldDescriptor?.isFilterable?.validation?.pattern
      ? {
          value: new RegExp(fieldDescriptor.isFilterable.validation.pattern),
          message: intl.formatMessage({
            id: `catalog-filter.${fieldId}.validation-error`,
          }),
        }
      : undefined,
  };

  const shortcutsTranslations = {
    SEVEN_DAYS: intl.formatMessage({
      id: 'catalog-filter.sevenDays.date-shortcuts',
    }),
    THIRTY_DAYS: intl.formatMessage({
      id: 'catalog-filter.thirtyDays.date-shortcuts',
    }),
    THIS_YEAR: intl.formatMessage({
      id: 'catalog-filter.thisYear.date-shortcuts',
    }),
    LAST_YEAR: intl.formatMessage({
      id: 'catalog-filter.lastYear.date-shortcuts',
    }),
  };

  return (
    <Box
      className={'catalogFilterFieldContainer'}
      key={fieldId + '_fieldContainer'}
    >
      <CatalogFilterFieldLabel
        fieldName={fieldId}
        labelTranslationId={fieldDescriptor.label ?? ''}
      />

      <Controller
        control={formMethods.control}
        name={fieldId}
        defaultValue={{}}
        rules={{
          ...(fieldValidation as RegisterOptions),
          validate: (dateRangeValue) => {
            if (
              !isEmpty(dateRangeValue) &&
              (!dateRangeValue.startDate || !dateRangeValue.endDate)
            ) {
              return intl.formatMessage({
                id: 'catalog-filter.dateRangeField.validation-error',
              });
            }
          },
        }}
        render={({ name, onBlur, onChange, value }) => {
          return (
            <DateRangePicker
              startDate={value.startDate || undefined}
              endDate={value.endDate || undefined}
              locale={intl.locale as any}
              wrapperClassName="catalogFilterDateRangeWrapper"
              shouldCloseOnSelect={false}
              selectsRange
              autoFocus={false}
              dateFormat={getDateformatType(false, true, true)}
              placeholderText={intl.formatMessage({
                id: 'catalog-filter.dateRangeField.placeholder',
              })}
              maxDate={new Date()}
              inputName={name}
              withShortcuts={[
                {
                  id: '1',
                  label: shortcutsTranslations.SEVEN_DAYS,
                  startDate: startOfDay(subDays(new Date(), 6)),
                  endDate: new Date(),
                },
                {
                  id: '2',
                  label: shortcutsTranslations.THIRTY_DAYS,
                  startDate: startOfDay(subDays(new Date(), 29)),
                  endDate: new Date(),
                },
                {
                  id: '3',
                  label: shortcutsTranslations.THIS_YEAR,
                  startDate: startOfYear(new Date()),
                  endDate: new Date(),
                },
                () => {
                  const lastYearStart = startOfYear(subYears(new Date(), 1));
                  const lastYearEnd = lastDayOfYear(lastYearStart);

                  return {
                    id: '4',
                    label: shortcutsTranslations.LAST_YEAR,
                    startDate: lastYearStart,
                    endDate: lastYearEnd,
                  };
                },
              ]}
              isClearable
              showMonthYearDropdown
              onBlur={onBlur}
              onChange={(dateRangeObj) => {
                if (isDateRange(dateRangeObj)) {
                  const dateRangeVal =
                    !dateRangeObj.startDate && !dateRangeObj.endDate
                      ? {}
                      : dateRangeObj;
                  onChange(dateRangeVal);

                  // Revalidate range on change
                  formMethods.trigger(fieldId);
                }
              }}
            />
          );
        }}
      />

      <span className="catalogFilterFieldError">
        {formMethods.errors[fieldId]?.message ?? undefined}
      </span>
    </Box>
  );
};
