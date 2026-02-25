import React, { useEffect, useState } from 'react';

export const useForceEntitySelection = (
  dependencies: React.DependencyList
): { entitySelected: boolean } => {
  const RESELECTION_TIMEOUT = 0;
  const [entitySelected, setEntitySelected] = useState(true);

  useEffect(() => {
    setEntitySelected(false);

    setTimeout(() => {
      setEntitySelected(true);
    }, RESELECTION_TIMEOUT);
  }, dependencies);

  return { entitySelected };
};
