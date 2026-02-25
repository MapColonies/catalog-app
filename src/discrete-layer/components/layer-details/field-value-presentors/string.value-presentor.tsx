import React from 'react';
import { Mode } from '../../../../common/models/mode.enum';
import { EntityFormikHandlers } from '../layer-datails-form';
import { IRecordFieldInfo } from '../layer-details.field-info';
import { FormInputTextFieldComponent } from './form.input.text.field';

interface StringValuePresentorProps {
  mode: Mode;
  fieldInfo: IRecordFieldInfo;
  value?: string;
  formik?: EntityFormikHandlers;
  fieldNamePrefix?: string;
}

export const StringValuePresentorComponent: React.FC<
  StringValuePresentorProps
> = (props) => {
  return <FormInputTextFieldComponent {...props} type="text" />;
};
