import React, { useLayoutEffect, useState } from 'react';

export interface IDimensions {
  width: number;
  height: number;
}

export const useElementDimensions = (
  element: React.MutableRefObject<HTMLElement | null>
): IDimensions | undefined => {
  const [dimensions, setDimensions] = useState<IDimensions>();

  useLayoutEffect(() => {
    if (element.current) {
      const { offsetHeight, offsetWidth } = element.current;
      setDimensions({ height: offsetHeight, width: offsetWidth });
    }
  }, [element.current]);

  return dimensions;
};
