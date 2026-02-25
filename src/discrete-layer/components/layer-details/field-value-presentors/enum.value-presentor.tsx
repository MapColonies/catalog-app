/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useCallback, useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import { get, isEmpty } from 'lodash';
import { MenuItem, Select, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import TooltippedValue from '../../../../common/components/form/tooltipped.value';
import CONFIG from '../../../../common/config';
import EnumsMapContext, {
  DEFAULT_ENUM_DESCRIPTOR,
  IEnumsMapType,
} from '../../../../common/contexts/enumsMap.context';
import useDebounceField from '../../../../common/hooks/debounce-field.hook';
import { IDictionary } from '../../../../common/models/dictionary';
import { Mode } from '../../../../common/models/mode.enum';
import { UpdateRulesModelType } from '../../../models/UpdateRulesModel';
import { IRecordFieldInfo } from '../layer-details.field-info';
import { EntityFormikHandlers } from '../layer-datails-form';
import { FormInputInfoTooltipComponent } from './form.input.info.tooltip';

import './enum.value-presentor.css';

interface EnumValuePresentorProps {
  options: string[];
  mode: Mode;
  fieldInfo: IRecordFieldInfo;
  value?: string;
  formik?: EntityFormikHandlers;
  dictionary?: IDictionary;
  fieldNamePrefix?: string;
}

export const EnumValuePresentorComponent: React.FC<EnumValuePresentorProps> = ({
  options,
  mode,
  fieldInfo,
  value,
  formik,
  dictionary,
  fieldNamePrefix,
}) => {
  const fieldName = `${fieldNamePrefix ?? ''}${fieldInfo.fieldName}`;
  const [innerValue] = useDebounceField(
    formik as EntityFormikHandlers,
    value ?? ''
  );
  const [locale] = useState<string>(CONFIG.I18N.DEFAULT_LANGUAGE);
  const intl = useIntl();
  const { enumsMap } = useContext(EnumsMapContext);
  const enums = enumsMap as IEnumsMapType;
  const isDataError = fieldInfo.isRequired && !value;

  const getDisplayValue = useCallback((): string => {
    if (isEmpty(innerValue)) {
      return innerValue;
    } else if (Array.isArray(innerValue)) {
      return innerValue.join(',');
    } else if (dictionary !== undefined) {
      return get(dictionary[innerValue], locale) as string;
    } else {
      return intl.formatMessage({ id: enums[innerValue].translationKey });
    }
  }, [innerValue]);

  if (
    formik === undefined ||
    mode === Mode.VIEW ||
    (mode === Mode.EDIT && fieldInfo.isManuallyEditable !== true)
  ) {
    return (
      <TooltippedValue
        className={`detailsFieldValue  ${
          isDataError ? 'detailFieldDataError' : ''
        }`}
      >
        {getDisplayValue()}
      </TooltippedValue>
    );
  } else {
    return (
      <>
        <Box className="detailsFieldValue selectBoxContainer">
          <Select
            value={innerValue}
            id={fieldName}
            name={fieldName}
            disabled={
              mode === Mode.UPDATE &&
              ((
                fieldInfo.updateRules as UpdateRulesModelType | undefined | null
              )?.freeze as boolean)
            }
            onChange={(e: React.FormEvent<HTMLSelectElement>): void => {
              formik.setFieldValue(fieldName, e.currentTarget.value);
            }}
            onBlur={formik.handleBlur}
            outlined
            enhanced
            className="enumOptions"
          >
            {options.map((item, index) => {
              let icon = '';
              let translation = '';
              if (item !== '') {
                if (dictionary !== undefined) {
                  icon = dictionary[item].icon;
                  translation = get(dictionary[item], locale) as string;
                } else {
                  const { translationKey, internal } =
                    enums[item] ?? DEFAULT_ENUM_DESCRIPTOR;
                  icon = enums[item].icon;
                  translation = intl.formatMessage({ id: translationKey });
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
          {!(
            fieldInfo.infoMsgCode?.length === 1 &&
            fieldInfo.infoMsgCode[0].includes('required')
          ) && <FormInputInfoTooltipComponent fieldInfo={fieldInfo} />}
        </Box>
      </>
    );
  }
};
