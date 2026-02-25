import { Box } from '@map-colonies/react-components';
import { Typography } from '@map-colonies/react-core';
import React from 'react';
import { useIntl } from 'react-intl';

interface ExportFieldLabelProps {
  fieldName: string;
  fieldId: string;
  required?: boolean;
}

const ExportFieldLabel: React.FC<ExportFieldLabelProps> = ({
  fieldName,
  fieldId,
  required,
}) => {
  const intl = useIntl();

  const fieldLabel = intl.formatMessage({
    id: `export-layer.${fieldName}.field`,
  });

  return (
    <Box className="exportFieldLabelContainer">
      <Typography tag="span" className="exportFieldLabel" htmlFor={fieldId}>
        {fieldLabel}
      </Typography>
      {(required as boolean) && (
        <Typography tag="span" className="requiredAsterisk">
          *
        </Typography>
      )}
    </Box>
  );
};

export default ExportFieldLabel;
