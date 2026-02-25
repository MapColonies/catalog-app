import { Box } from '@map-colonies/react-components';
import { MenuItem, Select, Typography } from '@map-colonies/react-core';
import { get, isEmpty } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useIntl } from 'react-intl';
import EnumsMapContext, {
  DEFAULT_ENUM_DESCRIPTOR,
  IEnumsMapType,
} from '../../../../../common/contexts/enumsMap.context';
import { IDictionary } from '../../../../../common/models/dictionary';
import CONFIG from '../../../../../common/config';
import { useStore } from '../../../../models';
import { ExportFieldProps } from '../../types/interfaces';
import ExportFieldLabel from '../export-field-label.component';
import ExportFieldHelperText from '../export-field-helper-text.component';

interface ExportEnumSelectionFieldProps extends ExportFieldProps {
  options: string[];
  dictionary?: IDictionary;
}

const NONE = 0;

const ExportEnumSelectionField: React.FC<ExportEnumSelectionFieldProps> = ({
  options,
  dictionary,
  selectionId,
  selectionIdx,
  fieldName,
  fieldValue,
  fieldInfo: {
    placeholderValue,
    helperTextValue,
    rhfValidation,
    validationAgainstField,
  },
  type,
}) => {
  const intl = useIntl();
  const store = useStore();
  const formMethods = useFormContext();
  const { enumsMap } = useContext(EnumsMapContext);
  const [innerValue, setInnerValue] = useState(fieldValue);
  const enums = enumsMap as IEnumsMapType;
  const locale = CONFIG.I18N.DEFAULT_LANGUAGE;

  const getFormFieldId = (name: string): string => {
    return `${selectionIdx}_${name}_${selectionId}`;
  };

  const fieldId = getFormFieldId(fieldName);

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
    <Box className="exportSelectionField enumSelectContainer">
      <ExportFieldLabel
        required={!isEmpty(rhfValidation?.required)}
        fieldId={fieldId}
        fieldName={fieldName}
      />
      <Select
        value={innerValue}
        id={fieldId}
        name={fieldId}
        onChange={(e: React.FormEvent<HTMLSelectElement>): void => {
          const newFieldVal = e.currentTarget.value;

          store.exportStore.setSelectionProperty(
            selectionId,
            fieldName,
            newFieldVal
          );
          formMethods.setValue(fieldId, newFieldVal, { shouldValidate: true });
          setInnerValue(newFieldVal);
        }}
        onBlur={(): void => {
          void formMethods.trigger(fieldId);
        }}
        invalid={!isEmpty(formMethods.errors[fieldId])}
        outlined
        enhanced
        className="exportOptionsSelect"
      >
        {options.map((item, index) => {
          let icon = '';
          let translation = '';
          if (item !== '') {
            if (dictionary !== undefined) {
              icon = dictionary[item].icon;
              translation = get(dictionary[item], locale) as string;
            } else {
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              const { translationKey, internal } =
                enums[item] ?? DEFAULT_ENUM_DESCRIPTOR;
              icon = enums[item].icon;
              translation = !isEmpty(translationKey)
                ? intl.formatMessage({ id: translationKey })
                : '';
              if (internal) {
                return null;
              }
            }
          }
          return (
            <MenuItem key={index} value={item}>
              <Typography tag="span" className={icon}></Typography>
              {translation}
            </MenuItem>
          );
        })}
      </Select>

      <ExportFieldHelperText
        key={`${fieldId}_helper`}
        helperText={helperTextValue}
        fieldValue={fieldValue}
      />
    </Box>
  );
};

export default ExportEnumSelectionField;
