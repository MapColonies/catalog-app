/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React from 'react';
import TooltippedValue from '../../../../common/components/form/tooltipped.value';

interface TypeValuePresentorProps {
  value?: string;
}

export const TypeValuePresentorComponent: React.FC<TypeValuePresentorProps> = ({ value }) => {
  return <TooltippedValue className="detailsFieldValue">{value}</TooltippedValue>;
};
