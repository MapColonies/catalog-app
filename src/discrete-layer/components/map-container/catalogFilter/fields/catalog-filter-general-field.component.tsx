import React from 'react';
import {
  FieldConfigModelType,
  FilterFieldValidationModelType,
} from '../../../../models';
import { Controller, RegisterOptions, useFormContext } from 'react-hook-form';
import { TextField } from '@map-colonies/react-core';
import CatalogFilterFieldLabel from './catalog-filter-field-label.component';
import { isEmpty } from 'lodash';
import { useIntl } from 'react-intl';
import { Box } from '@map-colonies/react-components';

interface CatalogFilterGeneralFieldProps {
  fieldDescriptor: FieldConfigModelType;
  placeholder?: string;
}

export const CatalogFilterGeneralField: React.FC<
  CatalogFilterGeneralFieldProps
> = ({ fieldDescriptor, placeholder }) => {
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
        name={fieldId}
        control={formMethods.control}
        defaultValue=""
        rules={{ ...(fieldValidation as RegisterOptions) }}
        render={(field) => {
          return (
            <TextField
              dir="auto"
              className="catalogFilterGeneralField"
              maxLength={fieldValidation?.maxLength ?? undefined}
              type={fieldValidation.valueAsNumber ? 'number' : 'text'}
              placeholder={placeholder}
              invalid={!isEmpty(formMethods.errors[fieldId])}
              {...field}
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
