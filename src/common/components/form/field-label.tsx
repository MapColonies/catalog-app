import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import TooltippedValue from './tooltipped.value';

import './field-label.css';

interface FieldLabelProps {
  value?: string;
  isRequired?: boolean;
  customClassName?: string;
  showTooltip?: boolean;
}

export const FieldLabelComponent: React.FC<FieldLabelProps> = ({
  value,
  isRequired,
  customClassName,
  showTooltip,
}) => {
  return (
    <Box className={customClassName !== undefined ? customClassName : 'detailsFieldLabel'}>
      <TooltippedValue disableTooltip={showTooltip}>
        <FormattedMessage id={value} />
      </TooltippedValue>
      {isRequired === true && <Box className="requiredAsterisk">{'*'}</Box>}
    </Box>
  );
};
