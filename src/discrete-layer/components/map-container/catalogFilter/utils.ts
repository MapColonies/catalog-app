import { isEmpty } from 'lodash';
import {
  FieldConfigModelType,
  FilterableFieldConfigModelType,
} from '../../../models';
import { FilterField } from '../../../models/RootStore.base';
import { isDateRange } from '@map-colonies/react-components';

export enum CustomFilterOperations {
  DATE_RANGE = 'dateRange',
}

const buildFieldFilter = (
  filterableField: FieldConfigModelType,
  fieldValue: unknown
): FilterField[] => {
  const CUSTOM_OPERATIONS: string[] = [CustomFilterOperations.DATE_RANGE];
  const fieldFilterConfig = (filterableField.isFilterable ??
    {}) as FilterableFieldConfigModelType;

  if (!CUSTOM_OPERATIONS.includes(fieldFilterConfig.operation ?? '')) {
    if (!fieldValue) return [];

    // We can use the operation as is, just return the filter
    const filter: FilterField = {
      field: filterableField.queryableName ?? '',
      [fieldFilterConfig.operation ?? '']: fieldValue,
    };

    return [filter];
  }

  // Custom operations handling
  switch (fieldFilterConfig.operation) {
    case CustomFilterOperations.DATE_RANGE: {
      // @ts-ignore
      if (isDateRange(fieldValue)) {
        if (!fieldValue.startDate || !fieldValue.endDate) return [];

        const filterStart: FilterField = {
          field: filterableField.queryableName ?? '',
          gteq: fieldValue.startDate.toUTCString(),
        };

        const filterEnd: FilterField = {
          field: filterableField.queryableName ?? '',
          lteq: fieldValue.endDate.toUTCString(),
        };

        return [filterStart, filterEnd];
      }

      return [];
    }
    default:
      return [];
  }
};

export const getCatalogFilters = (
  filterableFields: FieldConfigModelType[],
  catalogFilterFormValues: Record<string, unknown>
): FilterField[] => {
  const fieldsFilters = [];

  for (const field of filterableFields) {
    const fieldFilterValue = catalogFilterFormValues[field.fieldName ?? ''];

    // Empty value means that the user didn't choose to filter on this field
    if (!isEmpty(fieldFilterValue)) {
      fieldsFilters.push(...buildFieldFilter(field, fieldFilterValue));
    }
  }

  return fieldsFilters;
};
