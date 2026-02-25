import { createContext } from 'react';
import { RecordType } from '../../discrete-layer/models';

export interface IEnumDescriptor {
  enumName: string;
  realValue: string;
  icon: string;
  translationKey: string;
  parent: string;
  internal: boolean;
  properties: Record<string, unknown>;
  parentDomain: string;
}

export interface IEnumsMapType {
  [unionEnumKey: string]: IEnumDescriptor;
}

interface IEnumsMapContext {
  enumsMap: IEnumsMapType | null;
  setEnumsMap: (enums: IEnumsMapType) => void;
}

export const DEFAULT_ENUM_DESCRIPTOR: IEnumDescriptor = {
  enumName: '##UNKNOWN_ENUM_TYPE##',
  realValue: '##MISSING_VALUE##',
  icon: 'mc-icon-Close glow-missing-icon',
  translationKey: 'general.missing.translation',
  parent: '',
  internal: false,
  properties: {},
  parentDomain: RecordType.RECORD_ALL,
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const EnumsMapContext = createContext<IEnumsMapContext>({
  enumsMap: null,
  setEnumsMap: (enums) => {
    return;
  },
});

export default EnumsMapContext;
