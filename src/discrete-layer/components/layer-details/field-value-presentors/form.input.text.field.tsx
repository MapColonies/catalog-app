/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { isEmpty } from 'lodash';
import { TextField } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { Copy } from '../../../../common/components/copy/copy';
import TooltippedValue from '../../../../common/components/form/tooltipped.value';
import CONFIG from '../../../../common/config';
import { convertExponentialToDecimal } from '../../../../common/helpers/number';
import useDebounceField from '../../../../common/hooks/debounce-field.hook';
import { Mode } from '../../../../common/models/mode.enum';
import {
  UpdateRulesModelType,
  ValidationConfigModelType,
  ValidationValueType,
} from '../../../models';
import { IRecordFieldInfo } from '../layer-details.field-info';
import { EntityFormikHandlers } from '../layer-datails-form';
import { FormInputInfoTooltipComponent } from './form.input.info.tooltip';

const NONE = 0;

interface FormInputTextFieldProps {
  mode: Mode;
  fieldInfo: IRecordFieldInfo;
  value?: string;
  formik?: EntityFormikHandlers;
  type?: string;
  fieldNamePrefix?: string;
}

export const FormInputTextFieldComponent: React.FC<FormInputTextFieldProps> = ({
  mode,
  fieldInfo,
  value,
  formik,
  type,
  fieldNamePrefix,
}) => {
  const isCopyable = fieldInfo.isCopyable ?? false;
  const isPreserveNewLine = fieldInfo.rows ?? false;
  const isDataError = fieldInfo.isRequired && !value;
  const [innerValue, handleOnChange] = useDebounceField(
    formik as EntityFormikHandlers,
    value ?? ''
  );

  if (
    formik === undefined ||
    mode === Mode.VIEW ||
    (mode === Mode.EDIT && fieldInfo.isManuallyEditable !== true)
  ) {
    return (
      <>
        <TooltippedValue
          className={`detailsFieldValue ${
            isCopyable ? 'detailFieldCopyable' : ''
          } ${isPreserveNewLine ? 'preserveNewline' : ''} ${
            isDataError ? 'detailFieldDataError' : ''
          }`}
        >
          {innerValue}
        </TooltippedValue>
        {!isEmpty(value) && isCopyable && (
          <Box className="detailsFieldCopyIcon">
            <Copy value={value as string} />
          </Box>
        )}
      </>
    );
  } else {
    let min: string;
    let max: string;
    let validationProps = {};
    let placeholder = '';
    const textAreaProps =
      (fieldInfo.rows ?? NONE) > NONE
        ? { textarea: true, rows: fieldInfo.rows }
        : {};

    fieldInfo.validation?.forEach(
      (validationItem: ValidationConfigModelType) => {
        if (validationItem.valueType === ValidationValueType.VALUE) {
          if (validationItem.min !== null) {
            min = convertExponentialToDecimal(validationItem.min as string);
          }
          if (validationItem.max !== null) {
            max = convertExponentialToDecimal(validationItem.max as string);
          }
        }
      }
    );

    const precisionAllowed = 'any';
    // @ts-ignore
    if (min && max) {
      validationProps = { min, max, step: precisionAllowed };
      placeholder =
        CONFIG.I18N.DEFAULT_LANGUAGE.toUpperCase() === 'HE'
          ? `${max} - ${min}`
          : `${min} - ${max}`;
    }
    return (
      <>
        <Box className="detailsFieldValue">
          <TextField
            value={innerValue}
            // @ts-ignore
            id={`${fieldNamePrefix ?? ''}${fieldInfo.fieldName}`}
            name={`${fieldNamePrefix ?? ''}${fieldInfo.fieldName}`}
            type={type}
            // eslint-disable-next-line
            // @ts-ignore
            onChange={handleOnChange}
            // eslint-disable-next-line
            onBlur={formik?.handleBlur}
            disabled={
              (mode === Mode.UPDATE &&
                ((
                  fieldInfo.updateRules as
                    | UpdateRulesModelType
                    | undefined
                    | null
                )?.freeze as boolean)) ||
              fieldInfo.isDisabled === true
            }
            placeholder={placeholder}
            required={fieldInfo.isRequired === true}
            {...validationProps}
            {...textAreaProps}
          />
          {!(
            fieldInfo.infoMsgCode?.length === 1 &&
            fieldInfo.infoMsgCode[0].includes('required')
          ) && <FormInputInfoTooltipComponent fieldInfo={fieldInfo} />}
        </Box>
      </>
    );
  }
};
