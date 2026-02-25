import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { Box } from '@map-colonies/react-components';
import { TextField } from '@map-colonies/react-core';
import { observer } from 'mobx-react-lite';
import { useIntl } from 'react-intl';
import useDebounceField from '../../../common/hooks/debounce-field.hook';
import { useStore } from '../../models';
import { FilterField } from '../../models/RootStore.base';
import { UserAction } from '../../models/userStore';
import { EntityFormikHandlers } from '../layer-details/layer-datails-form';

import './freeTextSearch.component.css';

export const PYCSW_ANY_TEXT_FIELD = 'csw:AnyText';
const FREE_TEXT_SEARCH_DEBOUNCE = 1000;
const INITIAL_VALUE = '';

interface FreeTextSearchProps {
  onFiltersApply: (filters: FilterField[]) => void;
  onFiltersReset: () => void;
  isCatalogFiltersEnabled: boolean;
}

export const FreeTextSearch: React.FC<FreeTextSearchProps> = observer(
  ({ onFiltersApply, onFiltersReset, isCatalogFiltersEnabled }) => {
    const intl = useIntl();
    const store = useStore();
    const isSystemFreeTextSearchEnabled = store.userStore.isActionAllowed(
      UserAction.SYSTEM_ACTION_FREETEXTSEARCH
    );

    const catalogFilters =
      store.discreteLayersStore.searchParams.catalogFilters;
    const [value, setValue] = useState(INITIAL_VALUE);

    const getFreeTextFilter = (text: string): FilterField => ({
      field: PYCSW_ANY_TEXT_FIELD,
      like: text,
    });

    useEffect(() => {
      if (isCatalogFiltersEnabled) {
        setValue(INITIAL_VALUE);
      }
    }, [isCatalogFiltersEnabled]);

    useEffect(() => {
      if (catalogFilters.length === 0) {
        if (value.trim().length > 0) {
          const freeTextFilter = getFreeTextFilter(value);
          onFiltersApply([freeTextFilter]);
        }
      }
    }, [catalogFilters]);

    useEffect(() => {
      setValue(INITIAL_VALUE);
    }, [store.userStore.user?.role]);

    const handleFreeTextChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const fieldValue = e.target.value;
        setValue(fieldValue);

        if (fieldValue.trim().length === 0) {
          onFiltersReset();
          return;
        }

        const freeTextFilter = getFreeTextFilter(fieldValue);
        store.discreteLayersStore.searchParams.resetCatalogFilters();
        onFiltersApply([freeTextFilter]);
      },
      [onFiltersReset, onFiltersApply]
    );

    const [innerValue, handleFieldChange] = useDebounceField(
      { handleChange: handleFreeTextChange } as EntityFormikHandlers,
      value,
      FREE_TEXT_SEARCH_DEBOUNCE
    );

    return (
      <Box className="freeTextSearchContainer">
        <TextField
          disabled={!isSystemFreeTextSearchEnabled}
          style={{ padding: '0 6px' }}
          onChange={(e: ChangeEvent<HTMLInputElement>): void => {
            handleFieldChange(e);
          }}
          placeholder={intl.formatMessage({
            id: 'catalog-filter.freeText.placeholder',
          })}
          value={innerValue}
          type="text"
          autoComplete={'off'}
        />
      </Box>
    );
  }
);
