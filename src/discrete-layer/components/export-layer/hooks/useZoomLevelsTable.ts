import { get } from 'lodash';
import { useContext, useMemo } from 'react';
import lookupTablesContext, {
  ILookupOption,
} from '../../../../common/contexts/lookupTables.context';

const useZoomLevelsTable = (): Record<string, number> => {
  const { lookupTablesData } = useContext(lookupTablesContext);

  return useMemo(() => {
    const zoomlevelresolutions = {} as Record<string, number>;
    const lookupOptions =
      (get(lookupTablesData?.dictionary, 'zoomlevelresolutions') as ILookupOption[]) ?? [];

    lookupOptions.forEach((option) => {
      zoomlevelresolutions[option.value] = option.properties['resolutionDeg'] as number;
    });

    return zoomlevelresolutions;
  }, [lookupTablesData]);
};

export default useZoomLevelsTable;
