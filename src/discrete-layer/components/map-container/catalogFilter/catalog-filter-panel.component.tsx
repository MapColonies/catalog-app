import React, { useEffect, useMemo, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { observer } from 'mobx-react-lite';
import { useIntl } from 'react-intl';
import { isEmpty } from 'lodash';
import { Box } from '@map-colonies/react-components';
import { Button } from '@map-colonies/react-core';
import { useClickOutside } from '../../../../common/hooks/useClickOutside';
import { FilterField } from '../../../models/RootStore.base';
import { RecordType, useStore } from '../../../models';
import { useGetFilterableFields } from './hooks/useGetFilterableFields';
import { CatalogFilterFormFields } from './catalog-filter-form-fields.component';
import { getCatalogFilters } from './utils';

import './catalog-filter-panel.css';

interface CatalogFilterPanelProps {
  isOpen: boolean;
  closePanel: () => void;
  onFiltersSubmit: (filters: FilterField[]) => void;
  onFiltersReset: () => void;
}
/**
 * Use react-hook-forms with validations.
 * - Get pycsw mapping field names from descriptors
 * - Create dynamic filter forms by the current catalog search entity(ies) type.
 * - Apply the selected filters to the store and re-fetch the search query (And its dependencies)
 * - Mark the filter icon as the current active filter
 * - Reset everything to the normal filters on clean, and un-mark the icon
 */
export const CatalogFilterPanel: React.FC<CatalogFilterPanelProps> = observer(
  ({ isOpen, closePanel, onFiltersSubmit, onFiltersReset }) => {
    const intl = useIntl();
    const store = useStore();

    const catalogFilterPanelContainerRef = useRef<HTMLDivElement>(null);

    useClickOutside(catalogFilterPanelContainerRef, closePanel, isOpen);

    const selectedProductType =
      store.discreteLayersStore.searchParams.recordType;
    const filterableFields = useGetFilterableFields(
      selectedProductType as RecordType
    );

    const defaultFormValues = useMemo(() => {
      return (
        filterableFields?.reduce((defaultValues, field) => {
          return { ...defaultValues, [field.fieldName as string]: '' };
        }, {}) ?? {}
      );
    }, [filterableFields]);

    const formMethods = useForm({
      mode: 'onBlur',
      reValidateMode: 'onBlur',
      defaultValues: defaultFormValues,
    });

    const handleFormReset = () => {
      formMethods.reset(defaultFormValues);
      onFiltersReset();
    };

    useEffect(() => {
      handleFormReset();
    }, [store.userStore.user?.role]);

    const handleSubmit = () => {
      const filterFormValues = formMethods.getValues();
      const filters = getCatalogFilters(
        filterableFields ?? [],
        filterFormValues
      );

      onFiltersSubmit(filters);
    };

    const watchAllFields = formMethods.watch();
    const isFormEmpty = useMemo(
      () => Object.values(watchAllFields).every((value) => isEmpty(value)),
      [watchAllFields]
    );

    // If there is errors or if all field values are empty, then submit should be disabled
    const isSubmitFiltersDisabled = useMemo(
      () => !formMethods.formState.isValid || isFormEmpty,
      [watchAllFields]
    );

    return (
      <FormProvider {...formMethods}>
        <div
          ref={catalogFilterPanelContainerRef}
          className={`catalogFilterPanelContainer ${isOpen ? 'open' : 'close'}`}
        >
          <Box className="catalogFilterFormContainer">
            {filterableFields?.length && (
              <form className="catalogFiltersForm" id={'catalogFiltersForm'}>
                <CatalogFilterFormFields filterableFields={filterableFields} />
              </form>
            )}
          </Box>
          <Box className="catalogFiltersButtonsContainer">
            <Button
              className="catalogFiltersSubmitBtn"
              raised
              type="submit"
              form="catalogFiltersForm"
              onClick={formMethods.handleSubmit(handleSubmit)}
              disabled={isSubmitFiltersDisabled}
            >
              {intl.formatMessage({ id: 'catalog-filter.filterButton.text' })}
            </Button>
            <Button
              className="catalogFiltersClearBtn"
              type="button"
              form="catalogFiltersForm"
              onClick={handleFormReset}
            >
              {intl.formatMessage({
                id: 'catalog-filter.clearFilterButton.text',
              })}
            </Button>
          </Box>
        </div>
      </FormProvider>
    );
  }
);
