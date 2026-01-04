/* eslint-disable @typescript-eslint/ban-ts-comment */
import { get, isEmpty, omit } from 'lodash';
import moment, { unitOfTime } from 'moment';
import { IntlShape } from 'react-intl';
import * as Yup from 'yup';
import { MixedSchema } from 'yup/lib/mixed';
import { $enum } from 'ts-enum-util';
import { Feature, Geometry } from 'geojson';
import rewind from '@turf/rewind';
import { AllGeoJSON } from '@turf/helpers';
import truncate from '@turf/truncate';
import convert, { Distance } from 'convert-units';
import CONFIG from '../../../common/config';
import { IEnumsMapType } from '../../../common/contexts/enumsMap.context';
import { emphasizeByHTML } from '../../../common/helpers/formatters';
import { sessionStore } from '../../../common/helpers/storage';
import { Mode } from '../../../common/models/mode.enum';
import { RasterIngestionJobType } from '../../../common/models/raster-job';
import { ValidationTypeName } from '../../../common/models/validation.enum';
import { UiDescriptorsType } from '../../../common/ui-descriptors/type';
import {
  polygonVertexDensityFactor,
  area,
  countSmallHoles,
  DEGREES_PER_METER,
  isSmallArea
} from '../../../common/utils/geo.tools';
import { hasSelfIntersections } from '../../../common/utils/geojson.validation';
import { SYNC_QUERY, syncQueries } from '../../../syncHttpClientGql';
import {
  CategoryConfigModelType,
  EntityDescriptorModelType,
  FieldConfigModelType,
  FractionType,
  Layer3DRecordModel,
  LayerDemRecordModel,
  LayerMetadataMixedUnion,
  LayerRasterRecordModel,
  LinkModel,
  LinkModelType,
  OperationType,
  ParsedPolygonPart,
  ParsedPolygonPartError,
  PolygonPartRecordModel,
  PolygonPartRecordModelType,
  ProductType,
  ProviderType,
  QuantizedMeshBestRecordModel,
  RecordType,
  UpdateRulesModelType,
  UpdateRulesOperationModelType,
  ValidationConfigModelType,
  VectorBestRecordModel
} from '../../models';
import { ILayerImage } from '../../models/layerImage';
import {
  LayerRasterRecordModelArray,
  Layer3DRecordModelArray,
  LayerDemRecordModelArray,
  VectorBestRecordModelArray,
  QuantizedMeshBestRecordModelArray,
  LayerRecordTypes,
  LayerRecordTypesKeys
} from './entity-types-keys';
import { FieldInfoName, IRecordCategoryFieldsInfo } from './layer-details.field-info';

const JSON_INDENTATION = 4;

export const DEFAULT_ENUM = 'DEFAULT_ENUM';

export const ENUM_TYPES = ['DemDataType', 'DemDataType', 'NoDataValue', 'VerticalDatum', 'Units', 'UndulationModel', 'Transparency', 'ProductType' ]

export const GEOMETRY_ERRORS = {
  geometryTooDense: 'validation-general.shapeFile.polygonParts.geometryTooDensed',
  geometryTooSmall: 'validation-general.shapeFile.polygonParts.geometryTooSmall',
  geometryHasSmallHoles: 'validation-general.shapeFile.polygonParts.geometryHasSmallHoles',
  geometryHasSelfIntersections: 'validation-field.footprint.geo_json-has_self_intersections.geojson',
}

export const GEOMETRY_ERRORS_THRESHOLD = {
  geometryTooSmall: GEOMETRY_ERRORS.geometryTooSmall,
  geometryHasSmallHoles: GEOMETRY_ERRORS.geometryHasSmallHoles,
};

export const isEnumType = (typeName: string) => {
  return ENUM_TYPES.some(enumType => enumType === typeName);
}

export const getEntityDescriptors = (
  layerRecordTypename: LayerRecordTypes | UiDescriptorsType,
  entityDescriptors: EntityDescriptorModelType[]
): IRecordCategoryFieldsInfo[] => {
  let entityDesc;
  switch (layerRecordTypename) {
    case 'LayerDemRecord':
      entityDesc = entityDescriptors.find(descriptor => descriptor.type === 'PycswDemCatalogRecord');
      break;
    case 'Layer3DRecord':
      entityDesc = entityDescriptors.find(descriptor => descriptor.type === 'Pycsw3DCatalogRecord');
      break;
    case 'VectorBestRecord':
      entityDesc = entityDescriptors.find(descriptor => descriptor.type === 'VectorBestMetadata');
      break;
    case 'QuantizedMeshBestRecord':
      entityDesc = entityDescriptors.find(descriptor => descriptor.type === 'PycswQuantizedMeshBestCatalogRecord');
      break;
    case 'PolygonPartRecord':
      entityDesc = entityDescriptors.find(descriptor => descriptor.type === 'PolygonPartRecord');
      break;
    case 'UiDescriptors':
      entityDesc = entityDescriptors.find(descriptor => descriptor.type === 'UiDescriptors');
      break;
    default:
      entityDesc = entityDescriptors.find(descriptor => descriptor.type === 'PycswLayerCatalogRecord');
      break;
  }
  return (get(entityDesc, 'categories') ?? []) as IRecordCategoryFieldsInfo[];
};

export const getFlatEntityDescriptors = (
  layerRecordTypename: LayerRecordTypes,
  entityDescriptors: EntityDescriptorModelType[]
): FieldConfigModelType[] => {
  const descriptors = getEntityDescriptors(layerRecordTypename, entityDescriptors);
  let flat: FieldConfigModelType[] = [];
  descriptors.forEach((category: CategoryConfigModelType) => {
    flat = [ ...flat, ...(category.fields ?? []) ];
  });
  return flat;
};

export const getFieldNamesByEntityDescriptorMap = (
  descriptor: keyof FieldConfigModelType,
  entityDescriptors: EntityDescriptorModelType[]
): Map<LayerRecordTypes, string[]> => {
  const fieldNamesMap = new Map();
  LayerRecordTypesKeys.forEach((layerRecordTypename: string) => {
    const fieldNames = extractDescriptorRelatedFieldNames(descriptor, getFlatEntityDescriptors(layerRecordTypename as LayerRecordTypes, entityDescriptors));
    fieldNamesMap.set(layerRecordTypename, fieldNames);
  });
  return fieldNamesMap;
};

export const getBasicType = (fieldName: FieldInfoName, layerTypeName: string, lookupTable?: string, fieldTypeName?: string): string => {
  let recordModel;
  let typeString: string;
  const fieldNameStr = fieldName as string;

  if (lookupTable != null && lookupTable !== 'zoomlevelresolutions') return 'LookupTableType';

  // Check if UiDexcriptorField
  if (fieldTypeName) {
    typeString = fieldTypeName;
  } else {
    switch (layerTypeName) {
      case 'LayerDemRecord':
        recordModel = LayerDemRecordModel;
        break;
      case 'Layer3DRecord':
        recordModel = Layer3DRecordModel;
        break;
      case 'VectorBestRecord':
        recordModel = VectorBestRecordModel;
        break;
      case 'QuantizedMeshBestRecord':
        recordModel = QuantizedMeshBestRecordModel;
        break;
      case 'PolygonPartRecord':
        recordModel = PolygonPartRecordModel;
        break;
      case 'Link':
        recordModel = LinkModel;
        break;
      default:
        recordModel = LayerRasterRecordModel;
        break;
    };
    typeString = get(recordModel,`properties.${fieldNameStr}.name`) as string;
  }
  
  if (typeString) {
    if (fieldNameStr.toLowerCase().includes('url')) {
      return 'url';
    }
    else if (fieldNameStr.toLowerCase().includes('links')) {
      return 'links';
    }
    else if (fieldNameStr.toLowerCase().includes('sensors')) {
      return 'sensors';
    }
    else if (fieldNameStr.toLowerCase().includes('featurestructure')) {
      return 'featureStructure';
    }
    else if (fieldNameStr.toLowerCase().includes('footprint') || fieldNameStr.toLowerCase().includes('geometry') || fieldNameStr.toLowerCase().includes('layerpolygonparts')) {
      return 'json';
    }
    else if (fieldNameStr.toLowerCase().includes('maxresolutiondeg') || fieldNameStr.toLowerCase().includes('resolutiondegree') ) {
      return 'resolution';
    }
    else if (typeString.toLowerCase().includes('number') || fieldNameStr.toLowerCase().includes('resolutionmeter')) {
      return 'number';
    }
    else {
      return typeString.replaceAll('(','').replaceAll(')','').replaceAll(' | ','').replaceAll('null','').replaceAll('undefined','');
    }
  }
  return 'string';
};

export interface ValidationMessage {
  message: string;
  severity: string;
};

export const getValidationMessage = (data: Record<string, unknown>, intl: IntlShape): ValidationMessage => {
  const severity: string = data.severity as string ?? 'warning';
  let message: string = data.message
    ? data.message as string
    : data.code
    ? intl.formatMessage({ id: data.code as string })
    : '';
  if (data.additionalInfo) {
    message = data.additionalInfo as string + ' ' + message;
  }
  return { message, severity };
};

export const getValidationType = (validation: ValidationConfigModelType): ValidationTypeName | undefined => {
  const values = $enum(ValidationTypeName).getValues();
  // @ts-ignore
  const filteredArray = values.filter(value => validation[value] !== null && validation[value] !== undefined);
  return ValidationTypeName[filteredArray[0]];
};

export const getInfoMsgValidationType = (msgCode: string): ValidationTypeName => {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return ValidationTypeName[msgCode.substring(msgCode.lastIndexOf('.') + 1)];
};

export const cleanUpEntity = (
  data: Record<string,unknown>,
  entityKeys: LayerRasterRecordModelArray | Layer3DRecordModelArray | LayerDemRecordModelArray | VectorBestRecordModelArray | QuantizedMeshBestRecordModelArray
): Record<string,unknown> => {
  const keysNotInModel = Object.keys(data).filter(key => {
    // @ts-ignore
    return !entityKeys.includes(key);
  });
  return omit(data, keysNotInModel);
};

export const cleanUpEntityPayload = (
  data: Record<string,unknown>,
  entityKeys: string[]
): Record<string,unknown> => {
  const keysNotInModel = Object.keys(data).filter(key => {
    return !entityKeys.includes(key);
  });
  return omit(data, keysNotInModel);
};

const checkIsBest = (entity: ILayerImage): boolean => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { ORTHOPHOTO_BEST, RASTER_AID_BEST, RASTER_MAP_BEST, RASTER_VECTOR_BEST, QUANTIZED_MESH_DTM_BEST, QUANTIZED_MESH_DSM_BEST } = ProductType;

  const bestProductTypes: ProductType[] = [ ORTHOPHOTO_BEST, RASTER_AID_BEST, RASTER_MAP_BEST, RASTER_VECTOR_BEST, QUANTIZED_MESH_DTM_BEST, QUANTIZED_MESH_DSM_BEST ];

  return bestProductTypes.includes(entity.productType as ProductType);
};

export const isDiscrete = (entity: ILayerImage): boolean => {
  return !checkIsBest(entity)
};

export const isBest = (entity: ILayerImage): boolean => {
  return checkIsBest(entity)
};

export const isVector = (entity: ILayerImage): boolean => {
  const { VECTOR_BEST } = ProductType;

  const vectorProductTypes: ProductType[] = [ VECTOR_BEST ];
 
  return vectorProductTypes.includes(entity.productType as ProductType);
};

export const isMultiSelection = (recordType: RecordType): boolean => {
  return recordType !== RecordType.RECORD_3D && recordType !== RecordType.RECORD_RASTER;
};

export const prepareEntityForSubmit = (fields: Record<string, unknown>, layerRecord: LayerMetadataMixedUnion | LinkModelType) => {
  const cleanObj = removeEmptyObjFields(fields);
  const removeStrings =  removeEmptyStrings(cleanObj, layerRecord);
  return transformFormFieldsToEntity(removeStrings, layerRecord);
};

const removeObjFields = (
  obj: Record<string, unknown>,
  cbFn: (curVal: unknown) => boolean
): Record<string, unknown> => {
  // if cbFn returns true it means the field *should be omitted*.
  return Object.fromEntries(
    Object.entries(obj).filter(([_, val]) => {
      const shouldOmitField = cbFn(val);
      return !shouldOmitField;
    })
  );
};

export const removeEmptyObjFields = (
  obj: Record<string, unknown>
): Record<string, unknown> => {
  return removeObjFields(obj, (val) => typeof val === 'object' && isEmpty(val));
};

export const removeEmptyStrings = (fields: Record<string, unknown>, layerRecord: LayerMetadataMixedUnion | LinkModelType): Record<string, unknown> => {
  const cleanFields = {...fields};
  for (const fieldName of Object.keys(fields)) {
    const basicType = getBasicType(fieldName as FieldInfoName, layerRecord.__typename);
    switch (basicType) {
      case 'resolution':
      case 'number':
        cleanFields[fieldName] = cleanFields[fieldName] || undefined;
        break;
      default:
        break;
    }
  }
  return cleanFields;
};

export const getYupFieldConfig = (
  field: FieldConfigModelType,
  intl: IntlShape
): MixedSchema => {
  return !field.dateGranularity ?
    Yup.mixed().required(
      intl.formatMessage(
        { id: 'validation-general.required' },
        { fieldName: emphasizeByHTML(`${intl.formatMessage({ id: field.label })}`) }
      )
    ):
    Yup.date().nullable().max(
      new Date(),
      intl.formatMessage(
        { id: 'validation-general.date.future' },
        { fieldName: emphasizeByHTML(`${intl.formatMessage({ id: field.label })}`) }
      )
    ).typeError(
      intl.formatMessage(
        { id: 'validation-general.required' },
        { fieldName: emphasizeByHTML(`${intl.formatMessage({ id: field.label })}`) }
      )
    ).required(
      intl.formatMessage(
        { id: 'validation-general.required' },
        { fieldName: emphasizeByHTML(`${intl.formatMessage({ id: field.label })}`) }
      )
    );
};

export const decreaseFeaturePrecision = (feat: Geometry): Geometry => {
  const truncate_options = {precision: 9, coordinates: 2};
  return truncate(omit(feat, 'bbox') as AllGeoJSON, truncate_options) as Geometry;
};

const geometryChecks = (errors: Record<string,ParsedPolygonPartError>, desc: FieldConfigModelType, feature: Feature, nativePartResolution: number) => {
  let doSelfIntersectCheck = true;
  
  const densityFactor = polygonVertexDensityFactor(feature, nativePartResolution * DEGREES_PER_METER);
  if (densityFactor < CONFIG.POLYGON_PARTS.DENSITY_FACTOR) {
    addError(errors, desc, GEOMETRY_ERRORS.geometryTooDense);
    doSelfIntersectCheck = false;
  }

  const polygon_area = area(feature as AllGeoJSON);
  const isSmallPolygon = isSmallArea(polygon_area, CONFIG.POLYGON_PARTS.AREA_THRESHOLD, nativePartResolution);
  if (isSmallPolygon) {
    console.log('Feature area:', polygon_area, isSmallPolygon);
    addError(errors, desc, GEOMETRY_ERRORS.geometryTooSmall);
  }

  const polygonSmallHoles = countSmallHoles(feature, CONFIG.POLYGON_PARTS.AREA_THRESHOLD, nativePartResolution);
  if (polygonSmallHoles > 0) {
    addError(errors, desc, GEOMETRY_ERRORS.geometryHasSmallHoles);
  }
  
  if (doSelfIntersectCheck) {
    const selfIntersections = hasSelfIntersections(feature.geometry);
    if (selfIntersections) {
      addError(errors, desc, GEOMETRY_ERRORS.geometryHasSelfIntersections);
    }
  }
};

const addError = (errors: Record<string,ParsedPolygonPartError>, descriptor: FieldConfigModelType, code: string) => {
  if (errors[descriptor.fieldName as string]) {
    errors[descriptor.fieldName as string].codes.push(code);
  } else {
    errors[descriptor.fieldName as string] = {
      codes: [code],
      label: descriptor.label as string
    };
  }
};

const convertToMeter = (units: string) => {
  const UNITS_INDEX = 1;
  const num = parseFloat(units);
  let un = units.split('_');
  if (!un[UNITS_INDEX]) return num;
  return convert(num).from(un[UNITS_INDEX] as unknown as Distance).to('m');
};

const getProviderResolutionValuePath = (desciptors: FieldConfigModelType[],provider: ProviderType) => {
  return desciptors
    .find(k => k.fieldName === 'sourceResolutionMeter')
    ?.shapeFileMapping
    ?.find(k => k.provider === provider)
    .valuePath;
};

//#region NOT IN USE
const HOURS_TO_ADD = 12;

export const transformSynergyShapeFeatureToEntity = (desciptors: FieldConfigModelType[], feature: Feature, provider: ProviderType, fileName?: string): ParsedPolygonPart => {
  const poygonPartData: Record<string,unknown> = {"__typename": "PolygonPartRecord"};
  const errors: Record<string,ParsedPolygonPartError> = {};

  desciptors.forEach((desc) => {
    const shpMap = desc.shapeFileMapping?.find(k => {
      return k.provider === provider
    });

    let shapeFieldValue = get(feature, shpMap?.valuePath as string);

    // This logic mimics basic YUP schema:
    // 1. required fields 
    // 2. no future dates
    if (!shapeFieldValue && desc.isRequired) {
      addError(errors, desc, 'validation-general.required');
    }
    
    if (shapeFieldValue) {
      switch(desc.fieldName){
        case 'imagingTimeBeginUTC':
        case 'imagingTimeEndUTC':
          poygonPartData[desc.fieldName as string] = moment(shapeFieldValue,  "DD/MM/YYYY").add(HOURS_TO_ADD, 'hours');
          if (poygonPartData[desc.fieldName as string] as moment.Moment > moment()) {
            addError(errors, desc, 'validation-general.date.future');
          }
          break;
          case 'footprint':
            poygonPartData[desc.fieldName as string] = rewind(shapeFieldValue);
  
            let nativePartResolution;
            let fieldRes = getProviderResolutionValuePath(desciptors, provider);
            
            nativePartResolution = parseFloat(get(feature, fieldRes));
            
            if (!isNaN(nativePartResolution)) { 
              geometryChecks(errors, desc, feature, nativePartResolution);
            }
           
            break;
        case 'horizontalAccuracyCE90':
        case 'sourceResolutionMeter':
          poygonPartData[desc.fieldName as string] = parseFloat(shapeFieldValue);
          break;
        default:
          poygonPartData[desc.fieldName as string] = shapeFieldValue !== '' ? shapeFieldValue : undefined;
          break;
      }
    } 
  });
  return {
    polygonPart: {...poygonPartData as unknown as PolygonPartRecordModelType},
    errors: {...errors}
  };
};

export const transformMaxarShapeFeatureToEntity = (desciptors: FieldConfigModelType[], feature: Feature, provider: ProviderType, fileName?: string): ParsedPolygonPart => {
  const poygonPartData: Record<string,unknown> = {"__typename": "PolygonPartRecord"};
  const errors: Record<string,ParsedPolygonPartError> = {};

  desciptors.forEach((desc) => {
    const shpMap = desc.shapeFileMapping?.find(k => {
      return k.provider === provider
    });

    let shapeFieldValue = get(feature, shpMap?.valuePath as string);
    
    if (shpMap?.valuePath === 'NOT_EXISTS_USE_FILENAME') {
      shapeFieldValue = shapeFieldValue ? shapeFieldValue : fileName;
    }

    // This logic mimics basic YUP schema:
    // 1. required fields 
    // 2. no future dates
    if (!shapeFieldValue && desc.isRequired) {
      addError(errors, desc, 'validation-general.required');
    }
    
    if (shapeFieldValue) {
      switch(desc.fieldName) {
        case 'imagingTimeBeginUTC':
        case 'imagingTimeEndUTC':
          poygonPartData[desc.fieldName as string] = moment(shapeFieldValue,  'YYYY-MM-DD').add(HOURS_TO_ADD, 'hours');
          if (poygonPartData[desc.fieldName as string] as moment.Moment > moment()) {
            addError(errors, desc, 'validation-general.date.future');
          }
          break;
        case 'footprint':
          poygonPartData[desc.fieldName as string] = rewind(shapeFieldValue);

          let nativePartResolution;
          let fieldRes = getProviderResolutionValuePath(desciptors, provider);
          
          nativePartResolution = get(feature, fieldRes);

          if (!isNaN(nativePartResolution)) { 
            geometryChecks(errors, desc, feature, nativePartResolution);
          }
         
          break;
        case 'horizontalAccuracyCE90':
        case 'sourceResolutionMeter':
          poygonPartData[desc.fieldName as string] = shapeFieldValue;
          break;
        default:
          poygonPartData[desc.fieldName as string] = shapeFieldValue !== '' ? shapeFieldValue : undefined;
          break;
      }
    } 
  });
  return {
    polygonPart: {...poygonPartData as unknown as PolygonPartRecordModelType},
    errors: {...errors}
  };
};

export const transformTeraNovaShapeFeatureToEntity = (desciptors: FieldConfigModelType[], feature: Feature, provider: ProviderType, fileName?: string): ParsedPolygonPart => {
  const poygonPartData: Record<string,unknown> = {"__typename": "PolygonPartRecord"};
  const errors: Record<string,ParsedPolygonPartError> = {};

  desciptors.forEach((desc) => {
    const shpMap = desc.shapeFileMapping?.find(k => {
      return k.provider === provider
    });

    let shapeFieldValue = get(feature, shpMap?.valuePath as string);

    // This logic mimics basic YUP schema:
    // 1. required fields 
    // 2. no future dates
    if (!shapeFieldValue && desc.isRequired) {
      addError(errors, desc, 'validation-general.required');
    }
    
    if (shapeFieldValue) {
      switch(desc.fieldName){
        case 'imagingTimeBeginUTC':
        case 'imagingTimeEndUTC':
          poygonPartData[desc.fieldName as string] = moment(shapeFieldValue,  "DD/MM/YYYY").add(HOURS_TO_ADD, 'hours');
          if (poygonPartData[desc.fieldName as string] as moment.Moment > moment()) {
            addError(errors, desc, 'validation-general.date.future');
          }
          break;
        case 'footprint':
          poygonPartData[desc.fieldName as string] = rewind(shapeFieldValue);

          let nativePartResolution;
          let fieldRes = getProviderResolutionValuePath(desciptors, provider);
          
          nativePartResolution = convertToMeter(get(feature, fieldRes));

          if (!isNaN(nativePartResolution)) { 
            geometryChecks(errors, desc, feature, nativePartResolution);
          }
          
        break;
        case 'horizontalAccuracyCE90':
          poygonPartData[desc.fieldName as string] = parseFloat(shapeFieldValue);
          break;
        case 'sourceResolutionMeter':
          poygonPartData[desc.fieldName as string] = convertToMeter(shapeFieldValue);
          break;
        default:
          poygonPartData[desc.fieldName as string] = shapeFieldValue !== '' ? shapeFieldValue : undefined;
          break;
      }
    } 
  });
  return {
    polygonPart: {...poygonPartData as unknown as PolygonPartRecordModelType},
    errors: {...errors}
  };
};
//#endregion

export const transformEntityToFormFields = (
  layerRecord: LayerMetadataMixedUnion | LinkModelType
): Record<string, unknown> => {
  const transformedFields = {...layerRecord};
  for (const fieldName of Object.keys(layerRecord)) {
    const basicType = getBasicType(fieldName as FieldInfoName, layerRecord.__typename);
    /* eslint-disable */
    switch (basicType) {
      case 'string[]':
      case 'sensors':
        // @ts-ignore
        transformedFields[fieldName] = transformedFields[fieldName]?.join(', ');
        break;
      default:
        break;
    }
    /* eslint-enable */
  }
  return transformedFields;
};

export const transformFormFieldsToEntity = (
  fields: Record<string, unknown>,
  layerRecord: LayerMetadataMixedUnion | LinkModelType
): Record<string, unknown> => {
  const transformedFields = {...fields};
  for (const fieldName of Object.keys(fields)) {
    const basicType = getBasicType(fieldName as FieldInfoName, layerRecord.__typename);
    /* eslint-disable */
    switch (basicType) {
      case 'string[]':
      case 'sensors':
        // @ts-ignore
        transformedFields[fieldName] = transformedFields[fieldName]?.split(',')?.map(val => (val as string).trim());
        break;
      default:
        break;
    }
    /* eslint-enable */
  }
  return transformedFields;
};

export const getPartialRecord = (inputValues: Partial<ILayerImage>, descriptors: FieldConfigModelType[], attr: string): Partial<ILayerImage> => {
  const editableFields = descriptors
    .filter(item => get(item, attr) === true)
    .map(item => item.fieldName);
  const partialRecordData = Object.keys(inputValues)
    .filter(key => editableFields.includes(key))
    .reduce((obj: Record<string, unknown>, key: string) => {
      obj[key] = get(inputValues, key) as unknown;
      return obj;
    }, {});
  return partialRecordData;
};

export const extractDescriptorRelatedFieldNames = (descriptorName: keyof FieldConfigModelType, descriptors: FieldConfigModelType[]): string[] => {
  const fields = descriptors.filter((descriptor) => descriptor[descriptorName]);
  return fields.map(field => field.fieldName) as string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function downloadJSONToClient(jsonObj: Record<any, any>, fileName: string): void {
  const link = document.createElement('a');
  link.setAttribute('href', `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(jsonObj, null, JSON_INDENTATION)
  )}`);
  link.setAttribute('download', fileName);
  link.click();
  link.remove();
}

export function importJSONFileFromClient(fileLoadCB: (ev: ProgressEvent<FileReader>) => void): void {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', '.json');
  input.addEventListener('change', (e): void => {
    const target = (e.currentTarget as HTMLInputElement);
    if (target.files) {
      const file = target.files[0];
      const fileReader = new FileReader();
      fileReader.readAsText(file);
      fileReader.addEventListener('load', (e) => {
        fileLoadCB(e);
        input.remove();
      });
    }
  });
  input.click();
}  

export function importShapeFileFromClient(
  fileLoadCB: (ev: ProgressEvent<FileReader>, type: string, fileName?: string) => void,
  allowGeojson = false,
  allowSingleSHP = true,
  cancelLoadCB = ()=>{}): void {
  const input = document.createElement('input');
  const supportedExtensions = [allowSingleSHP ? '.shp': '', '.zip', ...(allowGeojson ? ['.geojson'] : [])];
  input.setAttribute('type', 'file');
  input.setAttribute('accept', supportedExtensions.join(','));
  input.addEventListener('change',(e): void => {
    const target = (e.currentTarget as HTMLInputElement);
    if (target.files) {
      const file = target.files[0];
      const fileType = file.name.split('.').pop();
      const fileName = file.name.replace(`.${fileType}`, '');
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.addEventListener('load', (e) => {
        fileLoadCB(e, fileType as string, fileName);
        input.remove();
      });
    }
  });
  input.addEventListener('cancel',(e): void => {
    cancelLoadCB();
    input.remove();
  });
  input.click();
}  

// This function is currently unused. It may be used later to modify fields
// during update if the descriptors include updateRules.
export const getRecordForUpdate = (selectedLayer: ILayerImage ,record: ILayerImage, descriptors: FieldConfigModelType[]): ILayerImage => {
  const VERSION_DELIMITER = '.';

  // ---------- HELPERS ----------
  
  const handleExplicitOperation = (
    field: FieldConfigModelType,
    fieldOperation: UpdateRulesOperationModelType,
    recordForUpdate: Record<string, unknown>
  ): Record<string, unknown> => {
    const recordCopy = { ...recordForUpdate };
    const selectedLayerFieldValue = get(recordForUpdate, `[${field.fieldName as string}]`);
  
    if (fieldOperation.value === null || typeof fieldOperation.value === 'undefined') return recordCopy;
  
    const fraction = fieldOperation.fraction;
  
    // Handling regular number fields
    if (fraction === null || typeof fraction === 'undefined') {
      recordCopy[field.fieldName as string] = fieldOperation.value;
      return recordCopy;
    }
    
    // Handling Moment fields
    if (moment.isMoment(selectedLayerFieldValue)) {
      const dateFractions: Record<string, unitOfTime.Base> = {
        [FractionType.DAYS]: 'date' as unitOfTime.Base, 
        [FractionType.MONTHS]: 'month' as unitOfTime.Base,
        [FractionType.YEARS]: 'year' as unitOfTime.Base,
      };
      selectedLayerFieldValue.set(dateFractions[fraction], fieldOperation.value);
      recordCopy[field.fieldName as string] = selectedLayerFieldValue;
  
      return recordCopy;
    }

    // Handling version fields
    const versionFractions: Record<string, number> = {[FractionType.MAJOR]: 0, [FractionType.MINOR]: 1, [FractionType.PATCH]: 2 };
    
    if (fraction in versionFractions) {
      const currentVersionSplit = (recordCopy[field.fieldName as string] as string).split(VERSION_DELIMITER);
      currentVersionSplit[versionFractions[fraction]] = `${fieldOperation.value}`;
      recordCopy[field.fieldName as string] = currentVersionSplit.join(VERSION_DELIMITER);
      return recordCopy;
    }
    
    return recordCopy;
  };
  
  const handleIncrementOperation = (
    field: FieldConfigModelType,
    fieldOperation: UpdateRulesOperationModelType,
    recordForUpdate: Record<string, unknown>
  ): Record<string, unknown> => {
    const recordCpy = { ...recordForUpdate };
    const selectedLayerFieldValue = get(recordForUpdate,`[${field.fieldName as string}]`);

    if (fieldOperation.value === null || typeof fieldOperation.value === 'undefined') return recordCpy;

    const fraction = fieldOperation.fraction;

    // Handling regular number fields
    if (fraction === null || typeof fraction === 'undefined') {
      recordCpy[field.fieldName as string] = recordCpy[field.fieldName as string] as number + fieldOperation.value;
      return recordCpy;
    }
    
    // Handling Moment fields
    if (moment.isMoment(selectedLayerFieldValue)) {
      const dateFractions: Record<string, string> = {[FractionType.DAYS]: 'days', [FractionType.MONTHS]: 'months', [FractionType.YEARS]: 'years' };
      selectedLayerFieldValue.add(fieldOperation.value, dateFractions[fraction] as unitOfTime.DurationConstructor);
      recordCpy[field.fieldName as string] = selectedLayerFieldValue;
      return recordCpy;
    }

    // Handling version fields
    const versionFractions: Record<string, number> = {[FractionType.MAJOR]: 0, [FractionType.MINOR]: 1, [FractionType.PATCH]: 2 };
    
    if (fraction in versionFractions) {
      const currentVersionSplit = (recordCpy[field.fieldName as string] as string).split(VERSION_DELIMITER);
      const fractionVersionValue = currentVersionSplit[versionFractions[fraction]];
      currentVersionSplit[versionFractions[fraction]] = `${+fractionVersionValue + fieldOperation.value}`;
      recordCpy[field.fieldName as string] = currentVersionSplit.join(VERSION_DELIMITER);
      return recordCpy;
    }
    
    return recordCpy;
  };
  
  // -----------------------------

  let recordForUpdate: Record<string,unknown> = { ...record };
  const updateRulesFields = descriptors.filter((descriptor) => descriptor.updateRules !== null);
  
  for (const field of updateRulesFields) {
    const updateRules = field.updateRules as UpdateRulesModelType | undefined;
    const fieldOperation = get(updateRules,'value.operation') as UpdateRulesOperationModelType | undefined;
    const selectedLayerFieldValue = (selectedLayer as unknown as Record<string,unknown>)[field.fieldName as string];

    // Copy all relevant fields
    recordForUpdate[field.fieldName as string] = selectedLayerFieldValue;

    if (fieldOperation?.type !== null && fieldOperation?.type !== OperationType.COPY) {
      switch (fieldOperation?.type) {
        case OperationType.EXPLICIT: 
          recordForUpdate = {...handleExplicitOperation(field, fieldOperation, recordForUpdate)};
          break;
        case OperationType.INCREMENT:  
          recordForUpdate = {...handleIncrementOperation(field, fieldOperation, recordForUpdate)};
          break;
        default:
      }
    }
  }

  return recordForUpdate as unknown as ILayerImage;
};

export const getEnumKeys = (enumsMap: IEnumsMapType, enumName: string, parent?: string): string[] => {
  return Object.keys(enumsMap)
    .filter((key) => {
      if (!isEmpty(parent)) {
        return enumsMap[key].enumName === enumName && enumsMap[key].parent === parent;
      }
      return enumsMap[key].enumName === enumName;
    });
};

export const getProductDomain = (productType: ProductType, enumsMap?: IEnumsMapType): string => {
  return enumsMap?.[productType as string]?.parentDomain as string;
};

export const getCoordinatesDisplayText = (latitude: number, longitude: number): string => {
  const COORDS_DISPLAY_PRECISION = 5;
  
  return `${latitude.toFixed(COORDS_DISPLAY_PRECISION)}°N ${longitude.toFixed(COORDS_DISPLAY_PRECISION)}°E`;
};

export const getTimeStamp = (): string => new Date().getTime().toString();

export const clearSyncWarnings = (selectedFileWarningsOnly: boolean = false) => {
  syncQueries
    .filter((query: SYNC_QUERY) => selectedFileWarningsOnly ? !query.equalCheck : true)
    .map((query: SYNC_QUERY) => query.queryName)
    .forEach((key: string) => sessionStore.remove(key));
};

export const filterModeDescriptors = (mode: Mode, descriptors: EntityDescriptorModelType[]): EntityDescriptorModelType[] => {
  return descriptors.map((desc) => {
    return {
      ...desc, 
      categories: desc.categories?.map(cat => {
        return {
          ...cat,
          fields: cat.fields.filter((field: FieldConfigModelType) => {
            if (mode === Mode.NEW) {
              return field.isCreateEssential;
            } else if (mode === Mode.UPDATE) {
              return field.isUpdateEssential;
            } else {
              return true;
            }
          })
        }})
      }
  });
};

export const jobType2Mode: { [key: string]: Mode } = {
  [RasterIngestionJobType.NEW]: Mode.NEW,
  [RasterIngestionJobType.UPDATE]: Mode.UPDATE
};
