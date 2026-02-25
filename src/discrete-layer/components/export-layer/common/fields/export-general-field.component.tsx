import React, { ChangeEvent, useCallback, useEffect, useMemo } from 'react';
import { TextField } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { useStore } from '../../../../models';
import { useFormContext } from 'react-hook-form';
import { isEmpty } from 'lodash';
import useDebounceField from '../../../../../common/hooks/debounce-field.hook';
import { EntityFormikHandlers } from '../../../layer-details/layer-datails-form';
import ExportFieldLabel from '../export-field-label.component';
import { DEBOUNCE_PERIOD_EXPORT_FIELDS } from '../../constants';
import { ExportFieldProps } from '../../types/interfaces';
import ExportFieldHelperText from '../export-field-helper-text.component';

const NONE = 0;

const ExportGeneralFieldComponent: React.FC<ExportFieldProps> = ({
  selectionId,
  selectionIdx,
  fieldName,
  fieldValue,
  fieldInfo: {
    placeholderValue,
    helperTextValue,
    rhfValidation,
    validationAgainstField,
    rows,
    maxLength,
  },
  type,
  isLoading,
}) => {
  const store = useStore();
  const formMethods = useFormContext();

  const getFormFieldId = (name: string): string => {
    return `${selectionIdx}_${name}_${selectionId}`;
  };

  const fieldId = getFormFieldId(fieldName);

  const placeholderVal = useMemo(
    () =>
      typeof placeholderValue !== 'undefined'
        ? typeof placeholderValue === 'string'
          ? placeholderValue
          : placeholderValue()
        : '',
    [placeholderValue]
  );

  const handleOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newFieldVal = (rhfValidation?.valueAsNumber as boolean)
        ? e.target.valueAsNumber
        : e.target.value;

      store.exportStore.setSelectionProperty(
        selectionId,
        fieldName,
        newFieldVal
      );
    },
    [store.exportStore.setSelectionProperty, selectionId, fieldName]
  );

  const [innerValue, handleFieldChange] = useDebounceField(
    { handleChange: handleOnChange } as EntityFormikHandlers,
    fieldValue,
    DEBOUNCE_PERIOD_EXPORT_FIELDS
  );

  useEffect(() => {
    const registerValidation = {
      ...(rhfValidation ?? {}),
      validate: {
        ...(rhfValidation?.validate ?? {}),
        validationAgainstField: (
          value: unknown
        ): string | boolean | undefined => {
          if (typeof validationAgainstField !== 'undefined') {
            return validationAgainstField.validate(
              value,
              formMethods.watch(getFormFieldId(validationAgainstField.watch))
            );
          }
        },
      },
    };

    formMethods.register(fieldId, { ...registerValidation });

    // Mitigate errors on init
    formMethods.setValue(fieldId, fieldValue, {
      shouldValidate: fieldValue.length > NONE,
    });

    // Revalidate fields
    void formMethods.trigger();

    return (): void => {
      formMethods.unregister(fieldId);
    };
  }, [fieldId]);

  return (
    <Box className="exportSelectionField" key={selectionId}>
      <ExportFieldLabel
        required={!isEmpty(rhfValidation?.required)}
        fieldId={fieldId}
        fieldName={fieldName}
      />
      <TextField
        dir="auto"
        className="exportGeneralField"
        textarea={(rows ?? NONE) > 1}
        rows={rows}
        maxLength={maxLength}
        name={fieldId}
        type={type}
        value={innerValue}
        onBlur={(): void => {
          formMethods.setValue(fieldId, innerValue, { shouldValidate: true });
        }}
        placeholder={placeholderVal}
        onChange={(e: ChangeEvent<HTMLInputElement>): void => {
          if (!(isLoading as boolean)) {
            handleFieldChange(e);
          }
        }}
        invalid={!isEmpty(formMethods.errors[fieldId])}
      />

      <ExportFieldHelperText
        key={`${fieldId}_helper`}
        helperText={helperTextValue}
        fieldValue={fieldValue}
      />
    </Box>
  );
};

export default ExportGeneralFieldComponent;
