import React, { PropsWithChildren, useMemo, useRef } from 'react';
import { Typography, Tooltip, TypographyProps } from '@map-colonies/react-core';
import useIsEllipsisActive from '../../hooks/isEllipsisActive.hook';

export interface TooltippedValueProps extends TypographyProps {
  tag?: string | React.ComponentType<unknown>;
  className?: string;
  disableTooltip?: boolean;
  alwaysTooltip?: boolean;
  customTooltipText?: string;
}

const TooltippedValue: React.FC<PropsWithChildren<TooltippedValueProps>> = ({
  tag = 'span',
  className = '',
  disableTooltip = false,
  alwaysTooltip = false,
  customTooltipText = '',
  children,
  ...restTypographyProps
}) => {
  const elementRef = useRef<HTMLElement>(null);
  const isEllipsisActive = useIsEllipsisActive(elementRef);
  const typographyElement = useMemo(
    () => (
      <Typography
        dir="auto"
        {...restTypographyProps}
        ref={elementRef}
        className={className}
        tag={tag as React.ElementType<any>}
      >
        {children}
      </Typography>
    ),
    [children]
  );

  return alwaysTooltip || (isEllipsisActive && !disableTooltip) ? (
    <Tooltip content={customTooltipText || typographyElement}>
      {typographyElement}
    </Tooltip>
  ) : (
    typographyElement
  );
};

export default TooltippedValue;
