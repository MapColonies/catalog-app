import { get } from 'lodash';
import { useContext } from 'react';
import lookupTablesContext, {
  ILookupOption,
} from '../contexts/lookupTables.context';

export interface IZoomLevelData {
  resolutionDeg: number;
  resolutionMeter: number;
}
export const useZoomLevels = (): Record<string, IZoomLevelData> => {
  const zoomlevelresolutions = {} as Record<string, IZoomLevelData>;
  const { lookupTablesData } = useContext(lookupTablesContext);
  const lookupOptions =
    (get(
      lookupTablesData?.dictionary,
      'zoomlevelresolutions'
    ) as ILookupOption[]) ?? [];

  lookupOptions?.forEach((option) => {
    zoomlevelresolutions[option.value] = {
      ...option.properties,
    } as unknown as IZoomLevelData;
  });

  return zoomlevelresolutions;
};
