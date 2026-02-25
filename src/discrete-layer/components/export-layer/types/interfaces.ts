import {
  AvailableProperties,
  ExportFieldOptions,
} from '../hooks/useAddFeatureWithProps';

export interface ExportFieldProps {
  selectionId: string;
  selectionIdx: number;
  fieldName: Partial<AvailableProperties>;
  fieldValue: string;
  fieldInfo: ExportFieldOptions;
  isLoading?: boolean;
  type?: 'text' | 'number';
}
