import React, { useState, useEffect } from 'react';
import { Icon } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';

const BASE_ICON_ANGLE = 0;
const UPSIDE_DOWN_ANGLE = 180;

type IconSizeType = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

interface CollaseButtonProps {
  onClick: (collapsed: boolean) => void;
  size?: IconSizeType;
}

export const CollapseButton: React.FC<CollaseButtonProps> = ({
  onClick,
  size = 'xsmall',
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [iconRotation, setIconRotation] = useState(BASE_ICON_ANGLE);

  const handleClick: () => void = () => {
    setCollapsed(!collapsed);
    onClick(collapsed);
  };

  // Rotating the icon when the details container is visible.
  useEffect(() => {
    setIconRotation(collapsed ? BASE_ICON_ANGLE : UPSIDE_DOWN_ANGLE);
  }, [collapsed]);

  return (
    <Box className="expanderContainer" onClick={handleClick}>
      <Icon
        className="expanderIcon"
        style={{ transform: `rotate(${iconRotation}deg)` }}
        icon={{ icon: 'expand_more', size }}
      />
    </Box>
  );
};
