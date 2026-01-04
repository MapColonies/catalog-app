/* eslint-disable no-fallthrough */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useContext, useMemo } from 'react';
import { FormattedMessage, IntlShape } from 'react-intl';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import { get } from 'lodash';
import { Typography } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { FieldLabelComponent } from '../../../common/components/form/field-label';
import CONFIG from '../../../common/config';
import EnumsMapContext, { IEnumsMapType } from '../../../common/contexts/enumsMap.context';
import { LinkType } from '../../../common/models/link-type.enum';
import { Mode } from '../../../common/models/mode.enum';
import { isUiDescriptor } from '../../../common/ui-descriptors/helper';
import { UiFieldDescriptor } from '../../../common/ui-descriptors/type';
import { geoJSONValidation } from '../../../common/utils/geojson.validation';
import { geoArgs } from '../../../common/utils/geo.tools';

import { 
  // AutocompletionModelType,
  EntityDescriptorModelType,
  FieldConfigModelType,
  LayerMetadataMixedUnion,
  LinkModelType,
  RecordType,
  useStore,
  ValidationConfigModelType,
  ValidationValueType,
} from '../../models';
import { DEFAULT_ENUM, getEnumKeys, isEnumType } from '../../components/layer-details/utils';
import { ILayerImage } from '../../models/layerImage';
import { links } from '../../models/links';
import { getLinkUrl, getLinkUrlWithToken } from '../helpers/layersUtils';
// import { AutocompleteValuePresentorComponent } from './field-value-presentors/autocomplete.value-presentor';
import { DateValuePresentorComponent } from './field-value-presentors/date.value-presentor';
import { EnumValuePresentorComponent } from './field-value-presentors/enum.value-presentor';
import { JsonValuePresentorComponent } from './field-value-presentors/json.value-presentor';
import { LinksValuePresentorComponent } from './field-value-presentors/links.value-presentor';
import { NumberValuePresentorComponent } from './field-value-presentors/number.value-presentor';
import { StatusValuePresentorComponent } from './field-value-presentors/status.value-presentor';
import { StringValuePresentorComponent } from './field-value-presentors/string.value-presentor';
import { TypeValuePresentorComponent } from  './field-value-presentors/type.value-presentor';
import { UnknownValuePresentorComponent } from './field-value-presentors/unknown.value-presentor';
import { UrlValuePresentorComponent } from './field-value-presentors/url.value-presentor';
import { IRecordFieldInfo, IRecordCategoryFieldsInfo, FieldInfoName } from './layer-details.field-info';
import { EntityFormikHandlers } from './layer-datails-form';
import { getBasicType, getEntityDescriptors } from './utils';

import './layer-details.css';
import { LookupOptionsPresentorComponent } from './field-value-presentors/lookup.options-presentor';
import { PYCSW_ANY_TEXT_FIELD } from '../map-container/freeTextSearch.component';
import { ResolutionValuePresentorComponent } from './field-value-presentors/resolution.value-presentor';

const FOOTPRINT_FIELD_NAMES = ['footprint', 'geometry'];

interface LayersDetailsComponentProps {
  entityDescriptors: EntityDescriptorModelType[];
  mode: Mode;
  className?: string;
  isBrief?: boolean;
  layerRecord?: ILayerImage | null | UiFieldDescriptor;
  formik?: EntityFormikHandlers;
  geoCustomChecks?:{
    validationFunc: ((value: string, args: geoArgs) => geoJSONValidation | undefined)[],
    validationFuncArgs: geoArgs
  };
  isSearchTab?: boolean;
  enableMapPreview?: boolean;
  fieldNamePrefix?: string;
  showFiedlsCategory?: boolean;
  intl?: IntlShape;
}

export const getValuePresentor = (
  layerRecord: LayerMetadataMixedUnion | LinkModelType,
  fieldInfo: IRecordFieldInfo,
  fieldValue: unknown,
  mode: Mode,
  formik?: EntityFormikHandlers,
  geoCustomChecks?:{
    validationFunc: ((value: string, args: geoArgs) => geoJSONValidation | undefined)[],
    validationFuncArgs: geoArgs
  },
  enumsMap?: IEnumsMapType | null,
  enableMapPreview = true,
  fieldNamePrefix?: string,
  intl?: IntlShape
): JSX.Element => {
  const { fieldName, lookupTable } = fieldInfo;
  const fieldTypeName = isUiDescriptor(layerRecord) && get(fieldInfo,'uiDescriptorFieldType');
  const basicType = getBasicType(fieldName as FieldInfoName, layerRecord.__typename, lookupTable as string, fieldTypeName);
  const value = formik?.getFieldProps(`${fieldNamePrefix ?? ''}${fieldInfo.fieldName}`).value ?? fieldValue as unknown;
  
  switch (basicType) {
    case 'string':
    case 'identifier':
    case 'sensors':
      return (
        <StringValuePresentorComponent
          mode={mode}
          fieldInfo={fieldInfo}
          value={value as string}
          formik={formik}
          fieldNamePrefix={fieldNamePrefix}/>
      );
      // return ((!isEmpty(formik) && !isEmpty(fieldInfo.autocomplete) && (fieldInfo.autocomplete as AutocompletionModelType).type === 'DOMAIN') ? 
      //   <AutocompleteValuePresentorComponent 
      //     mode={mode}
      //     fieldInfo={fieldInfo}
      //     value={value as string}
      //     formik={formik}
      //     fieldNamePrefix={fieldNamePrefix}
      //   /> :
      //   <StringValuePresentorComponent
      //     mode={mode}
      //     fieldInfo={fieldInfo}
      //     value={value as string}
      //     formik={formik}
      //     fieldNamePrefix={fieldNamePrefix}/>
      // );
    case 'featureStructure':
      return (
        <Box className='featureStructureContainer'>
          <table className='featureStructureTable'>
            <thead>
              <tr>
                <th className='thTableFeature'>
                  {
                    intl?.formatMessage({ id: 'field-names.vector.featureStructure.fieldName' })
                  }
                </th>
                <th className='thTableFeature'>
                  {
                    intl?.formatMessage({ id: 'field-names.vector.featureStructure.type' })
                  }
                </th>
              </tr>
            </thead>
            <tbody>
              {value.fields.map((field: any, index: number) => (
                <tr key={index}>
                  <td className='tdTableFeature'>{field.fieldName}</td>
                  <td className='tdTableFeature'>{field.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      );
    case 'string[]':
      return (
        <StringValuePresentorComponent 
          mode={mode}
          fieldInfo={fieldInfo}
          value={value as string}
          formik={formik}
          fieldNamePrefix={fieldNamePrefix}/>
      );
    case 'json':
      return (
        <JsonValuePresentorComponent 
          mode={mode}
          fieldInfo={fieldInfo}
          value={value as string}
          geoCustomChecks={geoCustomChecks}
          formik={formik}
          enableMapPreview={enableMapPreview && FOOTPRINT_FIELD_NAMES.includes(fieldName as string)}
          enableLoadFromShape={FOOTPRINT_FIELD_NAMES.includes(fieldName as string)}
          fieldNamePrefix={fieldNamePrefix}/>
      );
    case 'number':
      return (
        <NumberValuePresentorComponent 
          mode={mode}
          fieldInfo={fieldInfo}
          value={value as string}
          formik={formik}
          fieldNamePrefix={fieldNamePrefix}/>
      );
    case 'links':
      return (
        <LinksValuePresentorComponent value={value as LinkModelType[]} fieldInfo={fieldInfo}/>
      );
    case 'url':
      return (
        <UrlValuePresentorComponent value={value as string} linkInfo={links[(layerRecord as LinkModelType).protocol as LinkType]}/>
      );
    case 'resolution':{
      const maxFieldRef = (fieldInfo.validation as ValidationConfigModelType[])
        ?.filter((valid: ValidationConfigModelType) => 
          valid.valueType === ValidationValueType.FIELD && valid.max)[0]?.max || undefined;
      return (
        <ResolutionValuePresentorComponent 
          value={value as string}
          fieldInfo={fieldInfo}
          mode={mode}
          formik={formik}
          maxFilterValue={formik?.getFieldProps(`${fieldNamePrefix ?? ''}${maxFieldRef}`).value}
          fieldNamePrefix={fieldNamePrefix} />
      )}
    case 'momentDateType':
      return (
        <DateValuePresentorComponent 
          mode={mode} 
          fieldInfo={fieldInfo} 
          value={value as moment.Moment} 
          formik={formik}
          fieldNamePrefix={fieldNamePrefix}/>
      );
    case (isEnumType(basicType) ? basicType : DEFAULT_ENUM): {
      let options: string[] = [];
      if (basicType === 'ProductType') {
        options = getEnumKeys(enumsMap as IEnumsMapType, basicType, layerRecord.__typename);
      } else {
        options = getEnumKeys(enumsMap as IEnumsMapType, basicType);
      }
      return (
        <EnumValuePresentorComponent 
          options={['',...options]} 
          mode={mode} 
          fieldInfo={fieldInfo} 
          value={value as string} 
          formik={formik}
          fieldNamePrefix={fieldNamePrefix}/>
      );
    }
    case 'RecordType':
      return (
        <TypeValuePresentorComponent value={value as string}></TypeValuePresentorComponent>
      );
    case 'RecordStatus':
      return (
        <StatusValuePresentorComponent value={value as string}></StatusValuePresentorComponent>
      );
    case 'LookupTableType':
      return (
        <LookupOptionsPresentorComponent 
          value={value as string} 
          fieldInfo={fieldInfo} 
          mode={mode} 
          formik={formik}
          fieldNamePrefix={fieldNamePrefix}
          layerRecord={layerRecord}/>
      );
    default:
      return (
        <UnknownValuePresentorComponent value={basicType}></UnknownValuePresentorComponent>
      );
  }
};

export const LayersDetailsComponent: React.FC<LayersDetailsComponentProps> = observer((props: LayersDetailsComponentProps) => {
  const { entityDescriptors, geoCustomChecks, mode, isBrief, layerRecord, formik, className = '', isSearchTab = false, enableMapPreview = true, fieldNamePrefix, showFiedlsCategory = true, intl } = props;
  const { enumsMap } = useContext(EnumsMapContext);
  const store = useStore();
  
  const maxLabelLengthCssVar = '--field-label-max-length';
  const categoryFieldsParentContainerStyle = (CONFIG.NUMBER_OF_CHARACTERS_LIMIT
    ? { [maxLabelLengthCssVar]: `${CONFIG.NUMBER_OF_CHARACTERS_LIMIT}ch` }
    : {}) as React.CSSProperties;

  const renderCategory = (category: IRecordCategoryFieldsInfo): JSX.Element =>
  (
    <Box
      key={category.category}
      className={`categoryFieldsParentContainer ${className}`}
      style={categoryFieldsParentContainerStyle}
    >
      {showFiedlsCategory && <Typography
        use="headline6"
        tag="div"
        className="categoryFieldsTitle"
      >
        <FormattedMessage id={category.categoryTitle} />
      </Typography>}
      <Box className="categoryFieldsContainer">
        {category.fields?.filter((fieldInfo)=>{
          // eslint-disable-next-line
          return (mode !== Mode.NEW && mode !== Mode.UPDATE && get(fieldInfo,'isCreationEssential') !== true) ||
                 ((mode === Mode.NEW || mode === Mode.UPDATE) && get(fieldInfo,'isAutoGenerated') !== true) || 
                 (mode === Mode.VIEW || mode === Mode.EDIT || mode === Mode.EXPORT); 
        }).map(
          (fieldInfo: IRecordFieldInfo) => {
            let fieldClassName = fieldInfo.fullWidth === true
            ? 'categoryFullWidthField'
            : 'categoryField';

            const fieldValue = get(layerRecord, fieldInfo.fieldName as string);
            const getFilterFieldIdx = (fieldName: string | undefined) => {
              // WORKAROUND to make appropriate indication on found pattern for RASTER not common filtered field
              let aliasFilterField = fieldName;
              if (!isUiDescriptor(layerRecord) && layerRecord?.type === RecordType.RECORD_RASTER) {
                switch (fieldName) {
                  case 'mc:ingestionDate':
                    aliasFilterField = 'mc:insertDate';
                    break;
                  case 'mc:insertDate':
                    aliasFilterField = 'NO_FIELD';
                    break;
                }
              }
              return store.discreteLayersStore.searchParams.catalogFilters.findIndex((filter) => {
                return filter.field === aliasFilterField;
              });
            };
            const stringifyFieldValue = (val: unknown) => (val + '').toLowerCase();

            if (isSearchTab) {
              // Check if catalog filter is enabled by that field
              const isFilterParticipantField = getFilterFieldIdx(fieldInfo.queryableName) > -1;
              
              const idxFreeTextSearchFilterField = getFilterFieldIdx(PYCSW_ANY_TEXT_FIELD);
  
              const isByFreeTextSearch = idxFreeTextSearchFilterField > -1 &&
                                    stringifyFieldValue(fieldValue)
                                    .indexOf(stringifyFieldValue(store.discreteLayersStore.searchParams.catalogFilters[idxFreeTextSearchFilterField].like)) > -1;

              if (isFilterParticipantField || isByFreeTextSearch) {
                fieldClassName += ' filterParticipant';
              }
            }
            
            return (
              <Box
                key={fieldInfo.fieldName as string}
                className={fieldClassName}
              >
                <FieldLabelComponent
                  value={fieldInfo.label}
                  isRequired={
                    !!(fieldInfo.isRequired ?? false) &&
                    !(isBrief ?? false) &&
                    mode !== Mode.VIEW
                  }
                />
                {
                  getValuePresentor(
                    layerRecord as LayerMetadataMixedUnion,
                    fieldInfo,
                    fieldValue,
                    mode,
                    formik,
                    geoCustomChecks,
                    enumsMap,
                    enableMapPreview,
                    fieldNamePrefix,
                    intl
                  )
                }
              </Box>
            )
          }
        )}
      </Box>
    </Box>
  );

  const fullInputs = useMemo(() => {
    const fullArray = layerRecord && getEntityDescriptors(layerRecord.__typename, entityDescriptors);
    return (
      fullArray?.map((category) => {
        category.fields = category.fields?.sort((first, second) => first.order - second.order);
        return renderCategory(category);
      })
    );
  }, [layerRecord, formik]);

  const briefInputs = useMemo(() => {
    const briefCategory = {
      __typename: 'CategoryConfig',
      category: undefined,
      categoryTitle: ' ',
      fields: [] as FieldConfigModelType[],
    };

    layerRecord &&
      getEntityDescriptors(layerRecord.__typename, entityDescriptors).forEach((category)=>{
        const categoryBriefFields = category.fields?.filter((field) => field.isBriefField) as FieldConfigModelType[];
        briefCategory.fields.push(...categoryBriefFields)
      });
    
    briefCategory.fields = briefCategory.fields.sort((first, second) => first.isBriefField.order - second.isBriefField.order);
    // @ts-ignore
    return renderCategory(briefCategory);

  }, [layerRecord, formik]);

  return (
    <>
      {!(isBrief ?? false) ? fullInputs : briefInputs}
      {
        !isUiDescriptor(layerRecord) && layerRecord?.links &&
        getLinkUrl(layerRecord.links, LinkType.THUMBNAIL_L) !== undefined &&
        mode !== Mode.UPDATE && mode !== Mode.EXPORT &&
        <img
          className="detailsThumbnail"
          src={getLinkUrlWithToken(layerRecord.links, LinkType.THUMBNAIL_L)}
        />
      }
      {
        !layerRecord &&
        <Box>
          <Typography use="headline2" tag="div" className="noSelection">
            <FormattedMessage id="details-panel.no-selection" />
          </Typography>
        </Box>
      }
    </>
  );
});
