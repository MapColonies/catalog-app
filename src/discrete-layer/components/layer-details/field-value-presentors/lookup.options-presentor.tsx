import { Box } from '@map-colonies/react-components';
import { MenuItem, Select, Typography } from '@map-colonies/react-core';
import { isEmpty } from 'lodash';
import React, { useCallback, useContext } from 'react';
import { useIntl } from 'react-intl';
import TooltippedValue from '../../../../common/components/form/tooltipped.value';
import lookupTablesContext, {
  ILookupOption,
} from '../../../../common/contexts/lookupTables.context';
import useDebounceField from '../../../../common/hooks/debounce-field.hook';
import { Mode } from '../../../../common/models/mode.enum';
import { EntityFormikHandlers } from '../layer-datails-form';
import { IRecordFieldInfo } from '../layer-details.field-info';
import './enum.value-presentor.css';
import { FormInputInfoTooltipComponent } from './form.input.info.tooltip';
import CONFIG from '../../../../common/config';
import { MultiSelection } from '../../../../common/components/multi-selection/index';
import { CustomTheme } from '../../../../theming/custom.theme';
import {
  LayerMetadataMixedUnion,
  LinkModelType,
  RecordType,
} from '../../../models';

interface LookupTablesPresentorProps {
  mode: Mode;
  fieldInfo: IRecordFieldInfo;
  layerRecord: LayerMetadataMixedUnion | LinkModelType;
  value?: string;
  formik?: EntityFormikHandlers;
  fieldNamePrefix?: string;
}

export const LookupOptionsPresentorComponent: React.FC<
  LookupTablesPresentorProps
> = (props) => {
  const { mode, fieldInfo, layerRecord, value, formik, fieldNamePrefix } =
    props;
  const fieldName = `${fieldNamePrefix ?? ''}${fieldInfo.fieldName}`;
  const lang = CONFIG.I18N.DEFAULT_LANGUAGE;
  const intl = useIntl();
  const { lookupTablesData } = useContext(lookupTablesContext);
  const [innerValue] = useDebounceField(
    formik as EntityFormikHandlers,
    value ?? ''
  );
  const isDataError = fieldInfo.isRequired && !value;

  const customStyles = {
    container: (
      styles: any,
      { data, isDisabled, isFocused, isSelected }: any
    ) => {
      return {
        marginRight:
          mode === Mode.EDIT
            ? '18px'
            : (layerRecord as LayerMetadataMixedUnion)?.type ===
              RecordType.RECORD_3D
            ? '16px'
            : '12px',
        marginLeft: '2px',
        width: '100%',
      };
    },
    control: (
      styles: any,
      { data, isDisabled, isFocused, isSelected }: any
    ) => {
      return {
        backgroundColor: CustomTheme.darkTheme.GC_ALTERNATIVE_SURFACE,
        cursor: 'pointer',
        border: `1px solid`,
        borderColor: isFocused
          ? 'var(--mdc-theme-primary)'
          : CustomTheme.darkTheme.GC_TAB_ACTIVE_BACKGROUND,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row-reverse' as const,
        justifyContent: 'space-between',
        height: '24px',
      };
    },
    menu: (styles: any, { data, isDisabled, isFocused, isSelected }: any) => {
      return {
        ...styles,
        width: mode === Mode.EDIT ? '97%' : '99%',
        marginTop: '0px',
        animation: 'fadeIn 0.3s ease-in-out',
      };
    },
    menuList: (
      styles: any,
      { data, isDisabled, isFocused, isSelected }: any
    ) => {
      return {
        ...styles,
        maxHeight: '160px',
        backgroundColor: 'var(--mdc-theme-surface)',
        scrollbarColor: 'var(--mdc-theme-surface)',
        paddingTop: 0,
        paddingBottom: 0,
      };
    },
    option: (styles: any, { data, isDisabled, isFocused, isSelected }: any) => {
      return {
        cursor: 'pointer',
        height: '40px',
        color: isSelected
          ? CustomTheme.darkTheme.GC_HOVER_BACKGROUND
          : 'var(--mdc-theme-on-surface)',
        backgroundColor: isSelected && 'black',
        border: '0',
      };
    },
    input: (styles: any, { data, isDisabled, isFocused, isSelected }: any) => {
      return {
        ...styles,
        color: 'var(--mdc-theme-on-surface)',
      };
    },
    value: (styles: any, { data, isDisabled, isFocused, isSelected }: any) => {
      return {
        position: 'relative',
      };
    },
    indicatorsContainer: (
      styles: any,
      { data, isDisabled, isFocused, isSelected }: any
    ) => {
      return {
        ...styles,
        position: 'absolute' as const,
        bottom: '20px',
        height: '2px',
        padding:
          mode === Mode.NEW &&
          (layerRecord as LayerMetadataMixedUnion)?.type ===
            RecordType.RECORD_RASTER
            ? '0 4px'
            : '0 22px',
      };
    },
    dropdownIndicator: (
      styles: any,
      { data, isDisabled, isFocused, isSelected }: any
    ) => {
      return {
        ...styles,
        padding: '0',
        width: '14px',
        color: 'var(--mdc-theme-primary)',
      };
    },
    clearIndicator: (
      styles: any,
      { data, isDisabled, isFocused, isSelected }: any
    ) => {
      return {
        ...styles,
        padding: '0',
        width: '14px',
        color: 'var(--mdc-theme-primary)',
      };
    },
  };

  const getDisplayValue = useCallback((): string => {
    if (isEmpty(innerValue)) {
      return typeof innerValue === 'string'
        ? innerValue
        : (innerValue as string[]).toString();
    } else {
      const filteredOptions = lookupOptions.filter(
        (option) => option.value === innerValue
      );
      const displayValue = Object.keys(lookupOptions).includes('translation')
        ? filteredOptions.length
          ? (filteredOptions[0] as ILookupOption).translation?.find(
              (trns) => trns.locale === lang
            )?.text
          : value
        : filteredOptions.length
        ? (filteredOptions[0] as ILookupOption).translationCode
        : value;

      // @ts-ignore
      return intl.formatMessage({
        id:
          typeof displayValue === 'string' || 'undefined'
            ? (displayValue as string | undefined)
            : (displayValue as string[]).toString(),
      });
    }
  }, [innerValue]);

  if (
    !lookupTablesData ||
    !lookupTablesData.dictionary ||
    fieldInfo.lookupTable == null
  )
    return null;

  const lookupOptions = !fieldInfo.isMultiSelection
    ? [
        { value: '', translationCode: 'general.empty-string' },
        ...lookupTablesData.dictionary[fieldInfo.lookupTable],
      ]
    : [...lookupTablesData.dictionary[fieldInfo.lookupTable]];

  if (
    formik === undefined ||
    mode === Mode.VIEW ||
    (mode === Mode.EDIT && fieldInfo.isManuallyEditable !== true)
  ) {
    return (
      <TooltippedValue
        className={`detailsFieldValue  ${
          isDataError ? 'detailFieldDataError' : ''
        }`}
      >
        {getDisplayValue()}
      </TooltippedValue>
    );
  }

  return fieldInfo.isMultiSelection ? (
    <MultiSelection
      fieldInfo={fieldInfo}
      lookupOptions={lookupOptions}
      value={value}
      customStyles={customStyles}
      placeholder={''}
      formik={formik}
      fieldName={fieldName}
    />
  ) : (
    <Box className="detailsFieldValue selectBoxContainer">
      <Select
        className="enumOptions"
        value={value as string}
        id={fieldName}
        name={fieldName}
        onChange={(e: React.FormEvent<HTMLSelectElement>): void => {
          formik.setFieldValue(fieldName, e.currentTarget.value);
        }}
        onBlur={formik.handleBlur}
        outlined
        enhanced
      >
        {lookupOptions.map(({ translationCode, value }, index) => {
          const translation = intl.formatMessage({ id: translationCode });

          return (
            <MenuItem key={index} value={value}>
              <Typography tag="span"></Typography>
              {translation}
            </MenuItem>
          );
        })}
      </Select>
      {!(
        fieldInfo.infoMsgCode?.length === 1 &&
        fieldInfo.infoMsgCode[0].includes('required')
      ) && <FormInputInfoTooltipComponent fieldInfo={fieldInfo} />}
    </Box>
  );
};
