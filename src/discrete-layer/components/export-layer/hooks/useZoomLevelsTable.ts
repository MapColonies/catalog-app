import { get } from 'lodash';
import { useContext } from 'react';
import lookupTablesContext, {
  ILookupOption,
} from '../../../../common/contexts/lookupTables.context';

const useZoomLevelsTable = (): Record<string, number> => {
  const zoomlevelresolutions = {} as Record<string, number>;
  const { lookupTablesData } = useContext(lookupTablesContext);
  const lookupOptions =
    (get(
      lookupTablesData?.dictionary,
      'zoomlevelresolutions'
    ) as ILookupOption[]) ?? [];

  lookupOptions?.forEach((option) => {
    zoomlevelresolutions[option.value] = option.properties[
      'resolutionDeg'
    ] as number;
  });

  return zoomlevelresolutions;
};

export default useZoomLevelsTable;
