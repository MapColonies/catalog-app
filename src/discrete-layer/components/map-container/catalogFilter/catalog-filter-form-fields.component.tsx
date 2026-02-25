import { FieldConfigModelType } from '../../../models';
import { FilterField } from '../../../models/RootStore.base';
import { CatalogFilterDateRangeField } from './fields/catalog-filter-date-range-field.component';
import { CatalogFilterGeneralField } from './fields/catalog-filter-general-field.component';
import { CustomFilterOperations } from './utils';

interface CatalogFilterFormFieldProps {
  filterableFields: FieldConfigModelType[];
}

export const CatalogFilterFormFields: React.FC<CatalogFilterFormFieldProps> = ({
  filterableFields,
}) => {
  return (
    <>
      {filterableFields.length > 0 &&
        filterableFields.map((filterField, i) => {
          const filterOperation: keyof FilterField | CustomFilterOperations =
            filterField.isFilterable.operation;
          const fieldIndex = `${filterField.fieldName ?? ''}_${i}`;
          switch (filterOperation) {
            case 'like':
            case 'eq':
              return (
                <CatalogFilterGeneralField
                  key={fieldIndex}
                  fieldDescriptor={filterField}
                />
              );
            case CustomFilterOperations.DATE_RANGE:
              return (
                <CatalogFilterDateRangeField
                  key={fieldIndex}
                  fieldDescriptor={filterField}
                />
              );
            default:
              return (
                <CatalogFilterGeneralField
                  key={fieldIndex}
                  fieldDescriptor={filterField}
                />
              );
          }
        })}
    </>
  );
};
