import { Box } from '@map-colonies/react-components';
import { Typography } from '@map-colonies/react-core';
import React from 'react';
import { useIntl } from 'react-intl';

interface CatalogFilterFieldLabelProps {
  fieldName: string;
  labelTranslationId: string;
  required?: boolean;
}

const CatalogFilterFieldLabel: React.FC<CatalogFilterFieldLabelProps> = ({
  fieldName,
  labelTranslationId,
  required,
}) => {
  const intl = useIntl();

  const fieldLabel = intl.formatMessage({
    id: labelTranslationId,
  });

  return (
    <Box className="catalogFilterFieldLabelContainer">
      <Typography
        tag="span"
        className="catalogFilterFieldLabel"
        htmlFor={fieldName}
      >
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

export default CatalogFilterFieldLabel;
