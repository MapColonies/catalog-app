import { PropsWithChildren } from 'react';
import { CesiumMath } from '@map-colonies/react-components';
import { Typography, useTheme } from '@map-colonies/react-core';
import { IPosition } from '../../../../common/hooks/useHeightFromTerrain';
import CreateSvgIconLocationOn from '../../../../icons/LocationOn';
import { getCoordinatesDisplayText } from '../../layer-details/utils';

const GenericInfoBoxContainer: React.FC<
  PropsWithChildren<{ positionInRadians?: IPosition }>
> = ({ positionInRadians, children }) => {
  const themeObj = useTheme();
  const theme = themeObj as Record<string, string>;

  if (!positionInRadians) return null;

  return (
    <>
      <Typography
        tag="h4"
        style={{
          margin: '0',
          marginBottom: '10px',
          color: theme.textPrimaryOnDark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
        }}
      >
        <CreateSvgIconLocationOn
          className="glow-missing-icon"
          style={{
            stroke: 'currentColor',
            fill: 'currentColor',
            transform: 'scale(0.5)',
          }}
          height="48"
          width="48"
        />
        {getCoordinatesDisplayText(
          CesiumMath.toDegrees(positionInRadians.latitude),
          CesiumMath.toDegrees(positionInRadians.longitude)
        )}
      </Typography>
      {children}
    </>
  );
};

export default GenericInfoBoxContainer;
