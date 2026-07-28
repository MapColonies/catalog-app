import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip, Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { NoEntryIcon } from '../../../icons/4font/NoEntry';
import EnumsMapContext, { DEFAULT_ENUM_DESCRIPTOR } from '../../contexts/enumsMap.context';

import './type-icon.css';

const SIZE = 128;

interface ITypeIconProps {
  typeName: string;
  thumbnailUrl?: string;
  style?: Record<string, unknown>;
  className?: string;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const TypeIcon: React.FC<ITypeIconProps> = ({
  typeName,
  thumbnailUrl,
  style,
  className,
  disabled,
  onClick,
}) => {
  const intl = useIntl();
  const { enumsMap } = useContext(EnumsMapContext);
  const { icon, translationKey } = enumsMap?.[typeName] ?? DEFAULT_ENUM_DESCRIPTOR;
  const tooltip = intl.formatMessage({ id: translationKey });

  const img = (url: string): JSX.Element => {
    return <img width={SIZE} height={SIZE} src={url} alt={tooltip} />;
  };

  return (
    <Box style={style}>
      <Tooltip content={thumbnailUrl !== undefined ? img(thumbnailUrl) : tooltip}>
        <Typography tag="span" className="typeIconWrapper">
          <IconButton
            className={`${icon} ${className ?? ''}`}
            style={'color' in (style ?? {}) ? { color: style?.color as string } : undefined}
            disabled={disabled}
            onClick={onClick}
          />
          {disabled === true && (
            <Typography tag="span" className="typeIconDisabledIndicator" aria-hidden="true">
              <NoEntryIcon />
            </Typography>
          )}
        </Typography>
      </Tooltip>
    </Box>
  );
};
