/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import React from 'react';
import TooltippedValue from '../../../../common/components/form/tooltipped.value';
import { isUnpublishedValue } from '../../../../common/helpers/style';

interface StatusValuePresentorProps {
  value?: string;
}

export const StatusValuePresentorComponent: React.FC<
  StatusValuePresentorProps
> = ({ value }) => {
  return (
    <TooltippedValue
      className={
        value && isUnpublishedValue(value)
          ? 'detailsFieldValue warning'
          : 'detailsFieldValue'
      }
    >
      {value}
    </TooltippedValue>
  );
};
