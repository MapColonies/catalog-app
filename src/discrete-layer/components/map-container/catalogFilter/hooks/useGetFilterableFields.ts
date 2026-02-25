import { FieldConfigModelType, RecordType, useStore } from '../../../../models';

/**
 *  This is a dictionary between the current selected domain and the representing entity types of that domain.
 *  We only choose one entity type for each domain in order to create a baseline of common fields across each domain.
 */
const DOMAIN_TO_PRIMARY_ENTITY_TYPE: Record<RecordType, string[]> = {
  [RecordType.RECORD_RASTER]: ['PycswLayerCatalogRecord'],
  [RecordType.RECORD_3D]: ['Pycsw3DCatalogRecord'],
  [RecordType.RECORD_DEM]: ['PycswDemCatalogRecord'],
  [RecordType.RECORD_VECTOR]: ['PycswVectorCatalogRecord'],
  [RecordType.RECORD_ALL]: [
    'PycswLayerCatalogRecord',
    'Pycsw3DCatalogRecord',
    'PycswDemCatalogRecord',
    'PycswVectorCatalogRecord',
  ],
};

export const useGetFilterableFields = (
  recordType: RecordType,
  forFilterPanel = true
): null | FieldConfigModelType[] => {
  const store = useStore();
  const { entityDescriptors } = store.discreteLayersStore;

  const descriptorsTypesForExtraction =
    DOMAIN_TO_PRIMARY_ENTITY_TYPE[recordType];

  if (entityDescriptors) {
    const filteredDescriptors = entityDescriptors.filter((descriptor) =>
      descriptorsTypesForExtraction.includes(descriptor.type as string)
    );
    const allFilterableDescriptorsFields: FieldConfigModelType[] = [];

    for (const descriptor of filteredDescriptors) {
      for (const category of descriptor.categories ?? []) {
        for (const iterField of category.fields as FieldConfigModelType[]) {
          const field = { ...iterField };
          if (field.isFilterable) {
            if (
              (forFilterPanel && field.isFilterable.participateInFilterPanel) ||
              (!forFilterPanel && !field.isFilterable.participateInFilterPanel)
            ) {
              const filterableFieldIdx =
                allFilterableDescriptorsFields.findIndex(
                  (filterableField) =>
                    field.fieldName === filterableField.fieldName
                );

              // Prevent fields duplications in final array
              if (filterableFieldIdx > -1) {
                const isCurrentFilterableFieldQueryable =
                  !!allFilterableDescriptorsFields[filterableFieldIdx]
                    .queryableName;
                if (!isCurrentFilterableFieldQueryable) {
                  // Remove not queryable field and insert the new field
                  allFilterableDescriptorsFields.splice(
                    filterableFieldIdx,
                    1,
                    field
                  );
                }
              } else {
                // WORKAROUND to change RASTER not common filtered field label
                if (field.fieldName === 'insertDate') {
                  field.label = 'filters.ingestion-date.unified.label';
                }
                allFilterableDescriptorsFields.push(field);
              }
            }
          }
        }
      }
    }

    // Sort by order
    allFilterableDescriptorsFields.sort(
      (a, b) => a.isFilterable.order - b.isFilterable.order
    );

    return allFilterableDescriptorsFields;
  }

  return null;
};
