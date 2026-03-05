import { createContext } from 'react';
import { CountryTranslation } from '@map-colonies/types';

export interface ILookupOption {
  value: string;
  translationCode?: string;
  translation?: CountryTranslation[];
  properties: Record<string, unknown>;
}
export interface ILookupTableData {
  dictionary?: Record<string, ILookupOption[]>;
}

interface ILookupTablesContext {
  lookupTablesData?: ILookupTableData;
  setLookupTablesData: (lookupTablesData: ILookupTableData) => void;
}

export default createContext<ILookupTablesContext>({
  setLookupTablesData: () => {
    return;
  },
});
