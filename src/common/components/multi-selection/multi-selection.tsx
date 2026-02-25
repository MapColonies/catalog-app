import { isEmpty } from 'lodash';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  MultiSelection as McMultiSelection,
  MultiSelectionOption,
  StylesConfig,
} from '@map-colonies/react-components';
import { EntityFormikHandlers } from '../../../discrete-layer/components/layer-details/layer-datails-form';
import { IRecordFieldInfo } from '../../../discrete-layer/components/layer-details/layer-details.field-info';
import CONFIG from '../../config';
import lookupTablesContext, {
  ILookupOption,
} from '../../contexts/lookupTables.context';

import '../../../App.css';
import '../../../discrete-layer/components/map-container/catalogFilter/catalog-filter-panel.css';

interface MultiSelectionWrapperProps {
  fieldInfo: IRecordFieldInfo;
  lookupOptions: (
    | ILookupOption
    | {
        value: string;
        translationCode: string;
      }
  )[];
  fieldName: string;
  customStyles?: StylesConfig;
  placeholder?: string;
  value?: string;
  formik?: EntityFormikHandlers;
}

export const MultiSelection: React.FC<MultiSelectionWrapperProps> = (props) => {
  const {
    fieldInfo,
    lookupOptions,
    fieldName,
    customStyles,
    placeholder,
    value,
    formik,
  } = props;
  const lang = CONFIG.I18N.DEFAULT_LANGUAGE;
  const backLocale = CONFIG.DEFAULT_BACKEND_LOCALE;

  const [multiSelectionValues, setMultiSelectionValues] = useState<string[]>(
    fieldInfo.isMultiSelection && !isEmpty(value)
      ? (value as string).split(', ')
      : []
  );
  const { lookupTablesData } = useContext(lookupTablesContext);

  useEffect(() => {
    if (fieldInfo.isMultiSelection) {
      setMultiSelectionValues(
        !isEmpty(value) ? (value as string).split(', ') : []
      );
    }
  }, [value, fieldInfo.isMultiSelection]);

  const multiSelectionOptions = useMemo(() => {
    return (lookupOptions as ILookupOption[]).map((option) => {
      const text =
        option.translation?.find((trns) => trns.locale === lang)?.text ?? '';
      return { value: text, label: text };
    });
  }, [lookupOptions, lang]);

  const getMultiSelectionValues = () => {
    const chosenValueStrings = multiSelectionValues
      ?.map((value) =>
        multiSelectionOptions.filter((option) => option.value === value)
      )
      .flat()
      .map((filteredOption) => filteredOption.value);

    const chosenValueOptions = chosenValueStrings
      ?.map((value) => {
        return [{ value: value, label: value }];
      })
      .flat();

    return chosenValueOptions;
  };

  const getFormikFieldValue = (values: { value: string; label: string }[]) => {
    return values
      .map((val) => {
        const lookupOptionsTranslations = (
          lookupOptions as ILookupOption[]
        ).map((option) => option.translation);
        const valueTranslation = lookupOptionsTranslations.find(
          (trns) =>
            (trns as unknown as { locale: string; text: string }[]).findIndex(
              (trn) => trn.text === val.value
            ) > -1
        );
        return valueTranslation?.find(
          (valueTranslations) => valueTranslations.locale === backLocale
        )?.text;
      })
      .join(', ');
  };

  const onChangeMultiSelection = (data: MultiSelectionOption[]) => {
    formik?.setFieldValue(fieldName, getFormikFieldValue(data));
    setMultiSelectionValues(data.map((item) => item.value));
  };

  if (
    !lookupTablesData ||
    !lookupTablesData.dictionary ||
    fieldInfo.lookupTable == null
  )
    return null;

  return (
    <McMultiSelection
      options={multiSelectionOptions}
      values={getMultiSelectionValues()}
      onChange={onChangeMultiSelection}
      placeholder={placeholder}
      styles={customStyles}
    />
  );
};
