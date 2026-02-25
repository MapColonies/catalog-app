import { useContext } from 'react';
import EnumsMapContext, { IEnumsMapType } from '../contexts/enumsMap.context';

export const useEnums = (): IEnumsMapType => {
  const { enumsMap } = useContext(EnumsMapContext);
  const enums = enumsMap as IEnumsMapType;
  return enums;
};
