/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Box, Autocomplete } from '@map-colonies/react-components';
import { TextField } from '@map-colonies/react-core';
import { Mode } from '../../../../common/models/mode.enum';
import CONFIG from '../../../../common/config';
import TooltippedValue from '../../../../common/components/form/tooltipped.value';
import { RecordType, useQuery } from '../../../models';
import { IRecordFieldInfo } from '../layer-details.field-info';
import { EntityFormikHandlers } from '../layer-datails-form';

import './autocomplete.value-presentor.css';

interface AutocompleteValuePresentorProps {
  mode: Mode;
  fieldInfo: IRecordFieldInfo;
  value?: string;
  formik?: EntityFormikHandlers;
  fieldNamePrefix?: string;
}

export const AutocompleteValuePresentorComponent: React.FC<AutocompleteValuePresentorProps> =
  observer(({ mode, fieldInfo, value, formik, fieldNamePrefix }) => {
    const { data } = useQuery((store) =>
      store.queryGetDomain({
        recordType: RecordType.RECORD_RASTER,
        // eslint-disable-next-line
        domain: fieldInfo.autocomplete.value, // 'mc:productName'
      })
    );
    const [autocompleteValues, setAutocompleteValues] = useState<string[]>([]);

    const direction =
      CONFIG.I18N.DEFAULT_LANGUAGE.toUpperCase() === 'HE' ? 'rtl' : 'ltr';
    const required = {
      required: fieldInfo.isRequired === true ? true : false,
    };

    useEffect(() => {
      setAutocompleteValues(data ? (data.getDomain.value as []) : []);
    }, [data]);

    const controlValue = { value: value ?? '' };
    const fieldName = `${fieldNamePrefix ?? ''}${fieldInfo.fieldName}`;
    const isDataError = fieldInfo.isRequired && !value;

    if (
      mode === Mode.VIEW ||
      (mode === Mode.EDIT && fieldInfo.isManuallyEditable !== true)
    ) {
      return (
        <TooltippedValue
          className={`detailsFieldValue  ${
            isDataError ? 'detailFieldDataError' : ''
          }`}
        >
          {value}
        </TooltippedValue>
      );
    } else {
      return (
        <Box className="detailsFieldValue">
          <Autocomplete
            {...{
              Component: <TextField />,
              ComponentProps: {
                name: fieldName,
                id: fieldName,
                autoComplete: 'off',
                ...required,
              },
              ...controlValue,
              onBlur: (e: React.FocusEvent<HTMLInputElement>): void => {
                formik?.setFieldValue(fieldName, e.currentTarget.value);
              },
              mode: 'autocomplete',
              options: autocompleteValues,
              direction,
            }}
          />
        </Box>
      );
    }
  });
