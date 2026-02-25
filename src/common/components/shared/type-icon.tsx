/* eslint-disable @typescript-eslint/naming-convention */
import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import EnumsMapContext, {
  DEFAULT_ENUM_DESCRIPTOR,
} from '../../contexts/enumsMap.context';

const SIZE = 128;

interface ITypeIconProps {
  typeName: string;
  thumbnailUrl?: string;
  style?: Record<string, unknown>;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const TypeIcon: React.FC<ITypeIconProps> = ({
  typeName,
  thumbnailUrl,
  style,
  className,
  onClick,
}) => {
  const intl = useIntl();
  const { enumsMap } = useContext(EnumsMapContext);
  const { icon, translationKey } =
    enumsMap?.[typeName] ?? DEFAULT_ENUM_DESCRIPTOR;
  const tooltip = intl.formatMessage({ id: translationKey });

  const img = (url: string): JSX.Element => {
    return <img width={SIZE} height={SIZE} src={url} alt={tooltip} />;
  };

  return (
    <Box style={style}>
      <Tooltip
        content={thumbnailUrl !== undefined ? img(thumbnailUrl) : tooltip}
      >
        <IconButton
          className={`${icon} ${className ?? ''}`}
          style={
            'color' in (style ?? {})
              ? { color: style?.color as string }
              : undefined
          }
          onClick={onClick}
        />
      </Tooltip>
    </Box>
  );
};
