import React, { useMemo, useState, useEffect, useCallback, MouseEventHandler } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  withFormik,
  FormikProps,
  FormikErrors,
  Form,
  FormikHandlers,
  FormikBag,
  Field,
} from 'formik';
import { List, ListRowRenderer } from 'react-virtualized';
import * as Yup from 'yup';
import { OptionalObjectSchema, TypeOfShape } from 'yup/lib/object';
import { AnyObject } from 'yup/lib/types';
import { DraftResult } from 'vest/vestResult';
import { get, set, isEmpty, isObject, omit, unset } from 'lodash';
import { Feature, GeoJsonProperties, Geometry, MultiPolygon, Polygon } from 'geojson';
import { AllGeoJSON, Properties } from '@turf/helpers';
import shp, { FeatureCollectionWithFilename } from 'shpjs';
import { Button, Checkbox, CircularProgress, CollapsibleList, Icon, IconButton, SimpleListItem, Typography, Select } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import CONFIG from '../../../../common/config';
import { Mode } from '../../../../common/models/mode.enum';
import { ValidationsError } from '../../../../common/components/error/validations.error-presentor';
import { getGraphQLPayloadNestedObjectErrors, GraphQLError } from '../../../../common/components/error/graphql.error-presentor';
import { MetadataFile } from '../../../../common/components/file-picker';
import { emphasizeByHTML } from '../../../../common/helpers/formatters';
import { Loading } from '../../../../common/components/tree/statuses/loading';
import { area, countSmallHoles, DEGREES_PER_METER, explode, geoArgs, getFirstPoint, getOutlinedFeature, isGeometryPolygon, isSmallArea, polygonVertexDensityFactor } from '../../../../common/utils/geo.tools';
import { mergeRecursive, removePropertiesWithPrefix } from '../../../../common/helpers/object';
import { useZoomLevels } from '../../../../common/hooks/useZoomLevels';
import { useEnums } from '../../../../common/hooks/useEnum.hook';
import { geoJSONValidation } from '../../../../common/utils/geojson.validation';
import {
  EntityDescriptorModelType,
  FieldConfigModelType,
  LayerMetadataMixedUnion,
  ParsedPolygonPart,
  ParsedPolygonPartError,
  PolygonPartRecordModelType,
  ProviderType,
  RecordType,
  SourceValidationModelType
} from '../../../models';
import { LayersDetailsComponent } from '../layer-details';
import { IngestionFields } from '../ingestion-fields';
import {
  extractDescriptorRelatedFieldNames,
  getFlatEntityDescriptors,
  transformEntityToFormFields,
  filterModeDescriptors,
  importShapeFileFromClient,
  transformSynergyShapeFeatureToEntity,
  GEOMETRY_ERRORS_THRESHOLD,
  getEnumKeys,
  transformTeraNovaShapeFeatureToEntity,
  transformMaxarShapeFeatureToEntity,
  prepareEntityForSubmit,
} from '../utils';
import { GeoFeaturesPresentorComponent } from './pp-map';
import { getUIIngestionFieldDescriptors } from './ingestion.utils';
import { FeatureType, PPMapStyles } from './pp-map.utils';
import { NESTED_FORMS_PRFIX } from './entity.raster.dialog';

import './layer-details-form.raster.css';
import 'react-virtualized/styles.css';

const NONE = 0;

enum CUSTOM_VALIDATION_ERROR_CODES {
  SHAPE_VS_GPKG = 'SHAPE_VS_GPKG',
  POLYGON_PARTS_NOT_VALID_GEOMETRY = 'POLYGON_PARTS_NOT_VALID_GEOMETRY',
  POLYGON_PARTS_NOT_VALID_FOOTPRINT = 'POLYGON_PARTS_NOT_VALID_FOOTPRINT'
} 

// Shape of form values - a bit problematic because we cannot extend union type
export interface FormValues {
  directory: string;
  fileNames: string;
}

interface LayerDetailsFormCustomProps {
  recordType: RecordType;
  ingestionFields: FieldConfigModelType[];
  mode: Mode;
  entityDescriptors: EntityDescriptorModelType[];
  layerRecord: LayerMetadataMixedUnion;
  vestValidationResults: Record<string, DraftResult>;
  mutationQueryError: unknown;
  mutationQueryLoading: boolean;
  closeDialog: () => void;
  schemaUpdater: (parts:number, startIndex?: number, removePrevNested?: boolean) => void;
  removePolygonPart: (polygonPartKey: string) => string[];
  customErrorReset: () => void;
  customError?: Record<string,string[]> | undefined;
  ppCollisionCheckInProgress?: boolean | undefined;
}

export interface StatusError {
  errors: {
    [fieldName: string]: string[];
  }
}

export interface EntityFormikHandlers extends FormikHandlers {
  setFieldValue: (field: string, value: unknown, shouldValidate?: boolean) => void;
  setFieldError: (field: string, message: string) => void;
  setFieldTouched: (field: string, isTouched?: boolean | undefined, shouldValidate?: boolean | undefined) => void;
  setStatus: (status?: StatusError | Record<string, unknown>) => void;
  status: StatusError | Record<string, unknown>;
}

export const InnerRasterForm = (
  props: LayerDetailsFormCustomProps & FormikProps<FormValues>
): JSX.Element => {
  const {
    errors,
    values,
    dirty,
    validateForm,
    handleChange,
    handleBlur,
    handleSubmit,
    handleReset,
    getFieldProps,
    getFieldMeta,
    getFieldHelpers,
    resetForm,
    setFieldValue,
    setValues,
    setFieldError,
    setFieldTouched,
    setStatus,
    recordType,
    ingestionFields,
    entityDescriptors,
    mode,
    layerRecord,
    vestValidationResults,
    // eslint-disable-next-line
    mutationQueryError,
    mutationQueryLoading,
    closeDialog,
    schemaUpdater,
    removePolygonPart,
    customErrorReset,
    customError,
    ppCollisionCheckInProgress,
  } = props;

  const status = props.status as StatusError | Record<string, unknown>;
  type POLYGON_PARTS_MODE = 'FROM_SHAPE' | 'MANUAL';

  const POLYGON_PARTS_STATUS_ERROR = 'pp_status_errors';
  const ppConfig = CONFIG.POLYGON_PARTS;
  
  const intl = useIntl();
  const enumsMap = useEnums();
  const ZOOM_LEVELS = useZoomLevels();
  const [graphQLError, setGraphQLError] = useState<unknown>(mutationQueryError);
  const [isSelectedFiles, setIsSelectedFiles] = useState<boolean>(false);
  const [firstPhaseErrors, setFirstPhaseErrors] = useState<Record<string, string[]>>({});
  const [showCurtain, setShowCurtain] = useState<boolean>(true);
  const [ppFeatures, setPPFeatures] = useState<Feature[]>([]);
  const [parsingErrors, setParsingErrors] = useState<Record<string, unknown>[]>([]);
  const [loadingPolygonParts, setLoadingPolygonParts] = useState<boolean>(false);
  const [outlinedPerimeter, setOutlinedPerimeter] = useState<Feature | undefined>();
  const [outlinedPerimeterMarker, setOutlinedPerimeterMarker] = useState<Feature | undefined>();
  const [sourceExtent, setSourceExtent] = useState<Feature | undefined>();
  const [sourceExtentMarker, setSourceExtentMarker] = useState<Feature | undefined>();
  const [selectedFeature, setSelectedFeature] = useState<string | undefined>();
  const [expandedParts, setExpandedParts] = useState<boolean[]>([]);
  const [showPolygonPartsOnMap, setShowPolygonPartsOnMap] = useState<boolean>(true);
  const [showFaultyPolygonParts, setShowFaultyPolygonParts] = useState<boolean>(false);
  const [faultyPolygonParts, setFaultyPolygonParts] = useState<string[]>([]);
  const [showExisitngLayerPartsOnMap, setShowExisitngLayerPartsOnMap] = useState<boolean>(false);
  const [polygonPartsMode, setPolygonPartsMode] = useState<POLYGON_PARTS_MODE>('MANUAL');
  const [layerPolygonParts, setLayerPolygonParts] = useState<Record<string, PolygonPartRecordModelType>>({});
  const [ppCheckPerformed, setPPCheckPerformed] = useState<boolean>(false);
  const [gpkgValidationError, setGpkgValidationError] = useState<string|undefined>(undefined);
  const [clientCustomValidationErrors, setClientCustomValidationErrors] = useState<Record<string,string>>({});
  const [gpkgValidationResults, setGpkgValidationResults] = useState<SourceValidationModelType|undefined>(undefined);
  const [graphQLPayloadObjectErrors, setGraphQLPayloadObjectErrors] = useState<number[]>([]);
  const [isSubmittedForm, setIsSubmittedForm] = useState(false);
  const [isThresholdErrorsCleaned, setIsThresholdErrorsCleaned] = useState(false);
  const [isValidatingSource, setIsValidatingSource] = useState(false);

  const getStatusErrors = useCallback((): StatusError | Record<string, unknown> => {
    const customValidationErrors = Object.values(clientCustomValidationErrors);
    return {
      ...get(status, 'errors') as Record<string, string[]>,
      ...customError,
      ...(gpkgValidationError ? {
        error: [gpkgValidationError]
      } : {}),
      ...(customValidationErrors.length > NONE ? {
        error: [...customValidationErrors]
      } : {})
    }
  }, [status, customError, ppCheckPerformed, gpkgValidationError, clientCustomValidationErrors]);

  const getYupErrors = useCallback(
    (): Record<string, string[]> => {
      const validationResults: Record<string, string[]> = {};
      Object.entries(errors).forEach(([key, value]) => {
        if (isObject(value)) {
          Object.entries(value).forEach(([keyNested, valueNested]) => {
            if (getFieldMeta(key+'.'+keyNested).touched || isSubmittedForm) {
              if (!validationResults[key]) {
                // @ts-ignore
                validationResults[key] = {};
              }
              // @ts-ignore
              validationResults[key][keyNested] = [valueNested as string];
            }
          });
        } else {
          if (getFieldMeta(key).touched) {
            validationResults[key] = [value];
          }
        }
      });
      return validationResults;
    },
    [errors, getFieldMeta, isSubmittedForm],
  );

  useEffect(() => {
    let vestHasErrors = false;
    let countPPWithErrors = 0;
    Object.keys(vestValidationResults)
      .filter((key)=> key.includes(NESTED_FORMS_PRFIX))
      .forEach((key) => {
        const currPartHasErrors = (vestValidationResults[key].errorCount > NONE);
        vestHasErrors ||= currPartHasErrors;
        countPPWithErrors += currPartHasErrors ? 1 : 0;
      });

    if (vestHasErrors) {
      setStatus({
        errors: {
          [POLYGON_PARTS_STATUS_ERROR]: [
            intl.formatMessage(
              {id: 'validation-general.polygonParts.hasErrors'}, 
              {numErrorParts: emphasizeByHTML(`${countPPWithErrors}`)}
            )
          ]
        },
      });
    }
  }, [vestValidationResults]);

  useEffect(() => {
    setShowCurtain(!isSelectedFiles);
  }, [isSelectedFiles]);

  useEffect(() => {
    setShowCurtain(
      !isSelectedFiles || (isSelectedFiles && 
      gpkgValidationError !== undefined)
    );
  }, [isSelectedFiles, gpkgValidationError]);

  useEffect(() => {
    setGraphQLPayloadObjectErrors(getGraphQLPayloadNestedObjectErrors(mutationQueryError));
    setGraphQLError(mutationQueryError);
  }, [mutationQueryError]);

  useEffect(() => {
    // @ts-ignore
    setFirstPhaseErrors(mergeRecursive(getYupErrors(), getStatusErrors()));

    setTimeout(()=>(ppList && updateListRowHeights()), 100);
  }, [errors, getYupErrors, getStatusErrors]);

  useEffect(() => {
    const features: Feature[] = [];
    const polygonParts: Record<string,PolygonPartRecordModelType> = {};
    let countPPWithGeometryErrors = 0;

    Object.keys(values).filter(key=>key.includes(NESTED_FORMS_PRFIX)).forEach(key=>{
      features.push({
        type: 'Feature',
        properties: {key},
        // @ts-ignore
        geometry: values[key].footprint
      });

       // @ts-ignore
      polygonParts[key] = {...values[key]};

      // @ts-ignore
      countPPWithGeometryErrors += (!isGeometryPolygon(values[key].footprint) ? 1 : 0);
    });

    if (countPPWithGeometryErrors > NONE) {
      setClientCustomValidationErrors({
        ...clientCustomValidationErrors,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        [CUSTOM_VALIDATION_ERROR_CODES.POLYGON_PARTS_NOT_VALID_GEOMETRY]: intl.formatMessage(
          {id: 'validation-general.polygonParts.noValidGeometry'}, 
          {numErrorParts: emphasizeByHTML(`${countPPWithGeometryErrors}`)}
        )
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      setClientCustomValidationErrors(omit(clientCustomValidationErrors,CUSTOM_VALIDATION_ERROR_CODES.POLYGON_PARTS_NOT_VALID_GEOMETRY));
    }
    setPPFeatures(features);
    setLayerPolygonParts(polygonParts);
  }, [values]);
  
  
  useEffect(() => {
    let countPPWithCertainGeometryErrors = 0;
    let countPPWithAllGeometryErrors = 0;
    
    const getCountPPWithGeometryErrors = (features: Record<string, unknown>, errorsToCheck: Record<string, string> | undefined = undefined): number => {
      return Object.keys(features).filter(key => key.includes(NESTED_FORMS_PRFIX)).reduce((count, key) => {
        const footprintErrors = get(features, `${key}.footprint`) as string[];
        if (!isEmpty(footprintErrors)) {
          let hasOneOrMoreError = false;
          if (errorsToCheck) {
            hasOneOrMoreError = Object.values(errorsToCheck).some(err => {
              const error = intl.formatMessage({ id: err });
              return footprintErrors.includes(error);
            });
          } else {
            hasOneOrMoreError = true;
          }
  
          if (hasOneOrMoreError) {
            count++;
          }
        };
  
        return count;
      }, 0);
    }
  
    const addFootPrintAmountClientError = (count: number) => {
      setClientCustomValidationErrors({
        ...clientCustomValidationErrors,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        [CUSTOM_VALIDATION_ERROR_CODES.POLYGON_PARTS_NOT_VALID_FOOTPRINT]: intl.formatMessage(
          { id: 'validation-general.polygonParts.footPrint.hasErrors' },
          { numErrorParts: emphasizeByHTML(`${count}`) }
        )
      });
    };

    const removeFootPrintAmountClientError = () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      setClientCustomValidationErrors(omit(clientCustomValidationErrors, CUSTOM_VALIDATION_ERROR_CODES.POLYGON_PARTS_NOT_VALID_FOOTPRINT));
    }
    
    const cleanUpFieldErrorMsg = (obj: Record<string, unknown>, field: string, err: string): void => {
      const fieldErrors = get(obj, field) as string[];
      if (!isEmpty(fieldErrors)) {
        const err_idx = fieldErrors.findIndex((elem: string) => elem === intl.formatMessage({ id: err }));
        if (err_idx > -1) {
          fieldErrors.splice(err_idx, 1);
          if (isEmpty(fieldErrors)) {
            unset(obj, field);
          }
        }
      }
    };
    
    let effectiveStatusErrors = {...status?.errors as { [key: string]: any }} ;

    if (effectiveStatusErrors) {
      countPPWithCertainGeometryErrors = getCountPPWithGeometryErrors(effectiveStatusErrors, GEOMETRY_ERRORS_THRESHOLD);
      countPPWithAllGeometryErrors = getCountPPWithGeometryErrors(effectiveStatusErrors);
    }

    if (isThresholdErrorsCleaned) return;

    if (countPPWithCertainGeometryErrors > NONE) {
      const footprintErrorsRatio = countPPWithCertainGeometryErrors / Object.keys(values).filter(key => key.includes(NESTED_FORMS_PRFIX)).length;
      if (footprintErrorsRatio <= CONFIG.POLYGON_PARTS.GEOMETRY_ERRORS_THRESHOLD) {
        Object.values(GEOMETRY_ERRORS_THRESHOLD).forEach(err => {
          if (effectiveStatusErrors) {
            Object.keys(effectiveStatusErrors).filter(key => key.includes(NESTED_FORMS_PRFIX)).forEach(key => {
              cleanUpFieldErrorMsg(get(effectiveStatusErrors, `${key}`), 'footprint', err);

              if (isEmpty(effectiveStatusErrors[key])) {
                unset(effectiveStatusErrors, key)
              }
            });
          }
        });

        unset(effectiveStatusErrors, POLYGON_PARTS_STATUS_ERROR);

        const effectiveStatusErrorsLength = Object.keys(effectiveStatusErrors).length;

        if (effectiveStatusErrorsLength > 0) {
          effectiveStatusErrors[POLYGON_PARTS_STATUS_ERROR] = [
            intl.formatMessage(
              { id: 'validation-general.polygonParts.hasErrors' },
              { numErrorParts: emphasizeByHTML(`${effectiveStatusErrorsLength}`) }
            )
          ];
        }

        const errorsCount = countPPWithAllGeometryErrors - countPPWithCertainGeometryErrors;

        if (errorsCount) {
          addFootPrintAmountClientError(errorsCount);
        } else {
          removeFootPrintAmountClientError();
        }

        setIsThresholdErrorsCleaned(true);
        setStatus({ errors: effectiveStatusErrors });
      } else {
        if (countPPWithAllGeometryErrors > 0) {
          addFootPrintAmountClientError(countPPWithAllGeometryErrors);
        }
      }
    } else {
      if (countPPWithAllGeometryErrors) {
        addFootPrintAmountClientError(countPPWithAllGeometryErrors);
      } else {
        removeFootPrintAmountClientError();
      }
    }
  }, [status?.errors]);

  useEffect(() => {
    if (polygonPartsMode === 'MANUAL' && ppFeatures.length) {
      const definedPPGeometries = ppFeatures.filter((item) => !isEmpty(item.geometry));
      if (definedPPGeometries.length) {
        const outlinedPolygon = getOutlinedFeature(definedPPGeometries as Feature<Polygon | MultiPolygon, Properties>[]);
        set(outlinedPolygon,'properties.featureType', FeatureType.PP_PERIMETER);
        setOutlinedPerimeter(outlinedPolygon as Feature<Geometry, GeoJsonProperties>);
        setOutlinedPerimeterMarker({
          type: 'Feature',
          properties: {
            featureType: FeatureType.PP_PERIMETER_MARKER
          },
          geometry: {
            coordinates: getFirstPoint((outlinedPolygon as Feature).geometry),
            type: 'Point'
          },
        });
      } else {
        setOutlinedPerimeter(undefined);
      }
    }
  }, [ppFeatures, polygonPartsMode]);

  useEffect(() => {
    const stattusErrors = parsingErrors.reduce(
      (acc,curr) => {
        Object.keys(curr).forEach(key=>{
          let errObj = curr[key] as Record<string, ParsedPolygonPartError>; 
          Object.keys(errObj).forEach(fieldKey => {
            // @ts-ignore
            errObj[fieldKey] = errObj[fieldKey].codes.map(
              errText => intl.formatMessage({id: errText}, {fieldName: emphasizeByHTML(`${intl.formatMessage({ id: errObj[fieldKey].label })}`)})
            );
          });
        });
        return ({...acc,...curr});
      },
      {}
    );

    if (parsingErrors.length) {
      stattusErrors[POLYGON_PARTS_STATUS_ERROR] = [
        intl.formatMessage(
          {id: 'validation-general.polygonParts.hasErrors'}, 
          {numErrorParts: emphasizeByHTML(`${parsingErrors.length}`)}
        )
      ];
    }

    setStatus({
      errors: {
        // ...currentErrors,
        ...stattusErrors,
      },
    });
   }, [parsingErrors]);

  useEffect(() => {
    if (ppCollisionCheckInProgress !== undefined) {
      setShowCurtain(ppCollisionCheckInProgress);
    }
  }, [ppCollisionCheckInProgress]);


  useEffect(() => {
    const vestValidationPPKeys = Object.fromEntries(Object.entries(vestValidationResults).filter(([key, value]) => vestValidationResults[key].errorCount));
    const graphQLPPKeys = Object.fromEntries(graphQLPayloadObjectErrors.map((k) => [NESTED_FORMS_PRFIX + k, k]));
    const ppWithProblems = Object.keys({...firstPhaseErrors, ...vestValidationPPKeys, ...graphQLPPKeys}).filter(key => key.includes(NESTED_FORMS_PRFIX))

    setFaultyPolygonParts(ppWithProblems);
  
  }, [firstPhaseErrors, vestValidationResults, graphQLPayloadObjectErrors]);
  
  const shapeFileProviders = useMemo(() => {
    return getEnumKeys(enumsMap, 'ProviderType').map((key) => {
      const value = key as keyof typeof ProviderType;
      return {
        label: intl.formatMessage({id: `enum-value.provider_type.${ProviderType[value].toLowerCase()}.label`}),
        value: ProviderType[value]
      };
    });
  }, []);

  // ****** Verification of GPKG extent vs. PP perimeter is disabled
  // useEffect(() => {
  //   if (sourceExtent?.geometry && outlinedPerimeter && !isPolygonContainsPolygon(sourceExtent as  Feature<any>, outlinedPerimeter as Feature<any>)){
  //     setClientCustomValidationErrors({
  //       ...clientCustomValidationErrors,
  //       [CUSTOM_VALIDATION_ERROR_CODES.SHAPE_VS_GPKG]: intl.formatMessage({ id: shapeFilePerimeterVSGpkgExtentError.message })
  //     });
  //   }
  //   else {
  //     setClientCustomValidationErrors(omit(clientCustomValidationErrors,CUSTOM_VALIDATION_ERROR_CODES.SHAPE_VS_GPKG));
  //   }
  // }, [sourceExtent, outlinedPerimeter]);
  
  const exceededFeaturesNumberError = useMemo(() => new Error(
    intl.formatMessage(
      { id: 'validation-general.shapeFile.too-many-features'},
      { maxPPNumber: emphasizeByHTML(`${ppConfig.MAX.PER_SHAPE}`)}
     )
  ), []);

  const isFaultyPPVisible: boolean = useMemo(() => {
    return faultyPolygonParts.length ? showFaultyPolygonParts : false
  }, [faultyPolygonParts, showFaultyPolygonParts])

  const exceededVertexNumberError = useCallback((numberOfPP: number, numberOfVertexes: number) => {
    return new Error(
      intl.formatMessage(
        { id: 'validation-general.shapeFile.too-many-vertices' },
        { 
          maxVerticesPP: emphasizeByHTML(`${ppConfig.MAX.VERTICES}`),
          ppNumber: emphasizeByHTML(`${numberOfPP}`),
          verticesNumber: emphasizeByHTML(`${numberOfVertexes}`)
        }
      )
    );
  }, []);
  
  const shapeFileGenericError = useMemo(() => new Error(`validation-general.shapeFile.generic`), []);
  // const shapeFilePerimeterVSGpkgExtentError = useMemo(() => new Error(`validation-general.shapeFile.polygonParts.not-in-gpkg-extent`), []);

  const editFieldDescriptors = useMemo(() => {
    // **** Remove from descriptors autogenerated fields
    return entityDescriptors.map((desc)=>{
      return {
        ...desc, 
        categories: desc.categories?.map(cat=>{
          return {
            ...cat,
            fields: cat.fields.filter((field: FieldConfigModelType) => (!field.isAutoGenerated && !field.isLifecycleEnvolved))
          }})
        }
    });
  }, [entityDescriptors]);

  const ingestionFieldDescriptors = useMemo(() => {
    return filterModeDescriptors(mode, entityDescriptors);
  }, [entityDescriptors, mode]);

  const uiIngestionFieldDescriptors = useMemo(() => {
    return [{ 
      type: 'PolygonPartRecord',
      categories :[
      {
        category: 'DUMMY',
        fields: getUIIngestionFieldDescriptors(entityDescriptors)
      }
      ]
    }];
  }, [entityDescriptors, mode]);

  const removeStatusError = (errorKey: string) => {
    setStatus(omit(status,`errors.${errorKey}`));
  };

  const entityFormikHandlers: EntityFormikHandlers = useMemo(
    () => ({
      handleChange: (e: React.ChangeEvent<unknown>): void => {
        handleChange(e);
      },
      handleBlur: (e: React.FocusEvent<unknown>): void => {
        setGraphQLError(undefined);
        setPPCheckPerformed(false);
        removeStatusError(POLYGON_PARTS_STATUS_ERROR);
        customErrorReset();
        handleBlur(e);
      },
      handleSubmit,
      handleReset,
      getFieldProps,
      getFieldMeta,
      getFieldHelpers,
      resetForm,
      setFieldValue,
      setValues,
      setFieldError,
      setFieldTouched,
      setStatus,
      status,
    }),
    [
      getFieldHelpers,
      getFieldMeta,
      getFieldProps,
      handleBlur,
      handleChange,
      handleReset,
      handleSubmit,
      resetForm,
      setFieldError,
      setFieldTouched,
      setFieldValue,
      setStatus,
      setValues,
      status,
    ]
  );
  
  const reloadFormMetadata = (
    ingestionFields: FormValues,
    metadata: MetadataFile,
    removePrevData = false
  ): void => {
    setIsSelectedFiles(!!ingestionFields.fileNames);
    
    // Check update related fields in metadata obj
    const updateFields = extractDescriptorRelatedFieldNames('updateRules', getFlatEntityDescriptors(layerRecord.__typename, entityDescriptors));

    // Delete __typename prop to avoid collision
    delete ((metadata.recordModel as unknown) as Record<string, unknown>)['__typename'];

    for (const [key, val] of Object.entries(metadata.recordModel)) {
      if (val === null || (updateFields.includes(key) && mode === Mode.UPDATE)) {
        delete ((metadata.recordModel as unknown) as Record<string, unknown>)[key];
      }
    }

    // Synch entity with loaded values
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [key, val] of Object.entries(metadata.recordModel)) {
      // @ts-ignore
      layerRecord[key] = metadata.recordModel[key];
    }

    const validationResults = metadata.recordModel as unknown as SourceValidationModelType;

    setSourceExtent({
      type: 'Feature',
      properties: {
        featureType: FeatureType.SOURCE_EXTENT
      },
      geometry: validationResults.extentPolygon,
    });

    if (validationResults.extentPolygon) {
      setSourceExtentMarker({
        type: 'Feature',
        properties: {
          featureType: FeatureType.SOURCE_EXTENT_MARKER
        },
        geometry: {
          coordinates: getFirstPoint(validationResults.extentPolygon),
          type: 'Point'
        },
      });
    }
    
    setGpkgValidationResults(validationResults)
    
    setGpkgValidationError(
      !validationResults.isValid ? validationResults.message as string : undefined
    );

    resetForm();

    if (removePrevData) {
      setPolygonPartsMode('MANUAL');
      setExpandedParts([]);
      schemaUpdater(0, 0, true);
    }
    
    const relevantValues = removePrevData ? removePropertiesWithPrefix(values, NESTED_FORMS_PRFIX) : values;
    
    setValues({
      ...relevantValues,
      ...transformEntityToFormFields((isEmpty(metadata.recordModel) ? layerRecord : metadata.recordModel)),
      ...ingestionFields,
    });

    setGraphQLError(metadata.error);
  };

  const isShapeFileValid = (featuresArr: Feature<Geometry, GeoJsonProperties>[]): boolean | Error => {
    let verticesNum = 0;
    featuresArr?.forEach(f => {
      verticesNum += explode(f as AllGeoJSON)?.features.length;
    });

    if (typeof featuresArr === 'undefined') {
      return shapeFileGenericError;
    }
    if (featuresArr && featuresArr.length > ppConfig.MAX.PER_SHAPE) {
      return exceededFeaturesNumberError;
    }
    if (verticesNum > ppConfig.MAX.VERTICES) {
      return exceededVertexNumberError(featuresArr.length, verticesNum)
    }
    return true;
  }

  /*const isIngestedSourceSelected = () => {
    let res = true;
    ingestionFields.forEach((curr) => {
      // @ts-ignore
      res = res && !isEmpty(values[curr?.fieldName]);
    }, true);
    return res;
  }*/

  const transformShapeFeatureToEntity = (polygonPartDescriptors: FieldConfigModelType[], feature: Feature<Geometry, GeoJsonProperties>, provider: string, fileName?: string) => {
    let ret = {} as ParsedPolygonPart;
    switch (provider) {
      case ProviderType.SYNERGY:
        ret = transformSynergyShapeFeatureToEntity(polygonPartDescriptors, feature, provider, fileName);  
        break;
      case ProviderType.TERRA_NOVA:
        ret = transformTeraNovaShapeFeatureToEntity(polygonPartDescriptors, feature, provider, fileName);  
        break;
          case ProviderType.MAXAR:
        ret = transformMaxarShapeFeatureToEntity(polygonPartDescriptors, feature, provider, fileName);
        break;
      default:
        console.log(`**** PROVIDER ${provider} NOT SUPPORTED ****`);
    }
    return ret;
  }

  const proccessShapeFile = async (
    shapeArrayBuffer: ArrayBuffer,
    fileType: string,
    provider: string,
    fileName?: string
  ): Promise<Record<string,ParsedPolygonPart>> => {
    return new Promise((resolve, reject) => {
      const ZIP_EXTENSION = 'zip';

      try {
        // Supports zip files as well as single shape files.
        if (fileType === ZIP_EXTENSION) {
          void shp(shapeArrayBuffer)
            .then((data) => {
              const polygonPartDescriptors = getFlatEntityDescriptors('PolygonPartRecord', entityDescriptors);
              const parsedPolygonParts: Record<string,ParsedPolygonPart> = {};

              const shapeFileValidation = isShapeFileValid((data as FeatureCollectionWithFilename).features);
              if (shapeFileValidation instanceof Error) {
                return reject(shapeFileValidation);
              }

              (data as FeatureCollectionWithFilename).features.forEach((feature, idx) => {
                const currentKey = `${NESTED_FORMS_PRFIX}${idx}`;
                const parsedPolygonPartData = transformShapeFeatureToEntity(polygonPartDescriptors, feature, provider, fileName);
                parsedPolygonPartData.polygonPart.uniquePartId = currentKey;
                parsedPolygonParts[currentKey] = {...parsedPolygonPartData};
              });

              const outlinedPolygon = getOutlinedFeature((data as FeatureCollectionWithFilename).features as Feature<Polygon | MultiPolygon, Properties>[]);
              set(outlinedPolygon,'properties.featureType', FeatureType.PP_PERIMETER);
              setOutlinedPerimeter(outlinedPolygon as Feature<Geometry, GeoJsonProperties>);
              setOutlinedPerimeterMarker({
                type: 'Feature',
                properties: {
                  featureType: FeatureType.PP_PERIMETER_MARKER
                },
                geometry: {
                  coordinates: getFirstPoint((outlinedPolygon as Feature).geometry),
                  type: 'Point'
                },
              });

              return resolve(parsedPolygonParts);
            })
            .catch(() => {
              return reject(shapeFileGenericError);
            });
        } else {
          // **** SINGLE SHP FILE CONTAINS ONLY GEOMETRIES NOT SUPPORTED FOR PP **** 

          // const DEFAULT_PROJECTION = 'WGS84';
          // // Probably is shape file.
          // const geometryArr = parseShp(shapeArrayBuffer, DEFAULT_PROJECTION);

          
        }
      } catch (e) {
        return reject(shapeFileGenericError);
      }
    });
  };

  const topLevelFieldsErrors = {} as Record<string,string[]>;
  firstPhaseErrors && Object.keys(firstPhaseErrors).forEach((err) => {
    if (!err.includes(NESTED_FORMS_PRFIX)){
      topLevelFieldsErrors[err] = firstPhaseErrors[err];
    }
  });

  interface HandleProps {
    partIndex: number;
    text?: string;
    onClick?:  MouseEventHandler | undefined
    isErrorInPolygonPart?: boolean
    handleClick?: ()=>void;
    handleSelection?: ()=>void;
    handleClearSelection?: ()=>void;
  }

  const Handler: React.FC<HandleProps> = ({partIndex, text, onClick, isErrorInPolygonPart, handleClick, handleSelection, handleClearSelection}) => {
    const [deletingPart, setDeletingPart] = useState<boolean>(false);
    
    return  <Box 
      onClick={(e) => {
        onClick ? onClick(e) : (()=>{})();
        expandedParts[partIndex] = !expandedParts[partIndex];
        updateListRowHeights(partIndex);
      }} 
      style={{ height: '48px'}}
    >
    <SimpleListItem
      text={text}
      // graphic="help"
      metaIcon="chevron_right"
      className={isErrorInPolygonPart ? 'polygonPartDataError' : ''}
      onMouseOver={(e: any): void => { handleSelection && handleSelection();}}
      onMouseOut={(e: any): void => { handleClearSelection && handleClearSelection();}}
    />
    <Box className="deletePolygonPart"
     onMouseOver={(e: any): void => { handleSelection && handleSelection();}}
     onMouseOut={(e: any): void => { handleClearSelection && handleClearSelection();}}
    >
      <Box style={{width: "100px"}}>
        {
          deletingPart && <Box style={{display: "flex", gap: "4px"}}>
            <FormattedMessage id="polygon-parts.deleting.label" />
            <CircularProgress/>
          </Box>}
      </Box>
      {(polygonPartsMode === 'MANUAL') && <IconButton
        className="operationIcon mc-icon-Delete"
        label="DELETE PART"
        onClick={ (e): void => {
          if (handleClick) {
            setDeletingPart(true);
            
            handleClick();

            e.preventDefault();
            e.stopPropagation();
          }
        } }
      />}
    </Box>
  </Box>
  }

  let ppList:List;
  const setRef = (ref:List) => {
    ppList = ref;
  }
  const updateListRowHeights = (idx=0) => {
    ppList?.recomputeRowHeights(idx);
    ppList?.forceUpdate();
  }
  
  const NATIVE_RESOLUTION_NAME_FIELD = 'sourceResolutionMeter';
  const geoArgsParams: geoArgs = [{name: NATIVE_RESOLUTION_NAME_FIELD, value: undefined}];
  const getResolutionObject = (params: geoArgs) => params.find((param) => param.name === NATIVE_RESOLUTION_NAME_FIELD);

  const resolutionNotExist = () : geoJSONValidation => {
    return {
      valid: false,
      severity_level: 'ERROR',
      reason: 'resolutionNotExistForGeometry'
    } as geoJSONValidation;
  }

  const ppVertexDensityFactor = (geometry: any, params: geoArgs) => {
    const resolutionObj = getResolutionObject(params);

    if (!resolutionObj || !resolutionObj.value) {
      return resolutionNotExist();
    };
 
    const densityFactor = polygonVertexDensityFactor(geometry, resolutionObj.value * DEGREES_PER_METER);
    if (densityFactor < CONFIG.POLYGON_PARTS.DENSITY_FACTOR) {
      return {
        valid: false,
        severity_level: 'ERROR',
        reason: 'geometryTooDensed'
      } as geoJSONValidation;
    }
  }

  const ppArea = (geometry: any, params: geoArgs) => {
    const resolutionObj = getResolutionObject(params);

    if (!resolutionObj || !resolutionObj.value) {
      return resolutionNotExist();
    };

    const isSmallPolygon = isSmallArea(area(geometry), CONFIG.POLYGON_PARTS.AREA_THRESHOLD, resolutionObj.value);
    if (isSmallPolygon) {
      return {
        valid: false,
        severity_level: 'ERROR',
        reason: 'geometryTooSmall'
      } as geoJSONValidation;
    }
  }

  const ppCountSmallHoles = (geometry: any, params: geoArgs) => {
    const resolutionObj = getResolutionObject(params);
    
    if (!resolutionObj || !resolutionObj.value) {
      return resolutionNotExist();
    };

    const polygonSmallHoles = countSmallHoles(geometry, CONFIG.POLYGON_PARTS.AREA_THRESHOLD, resolutionObj.value);
    if (polygonSmallHoles > 0) {
      return {
        valid: false,
        severity_level: 'ERROR',
        reason: 'geometryHasSmallHoles'
      } as geoJSONValidation;
    }
  }

  const customChecks = useMemo(() => {
    return {
        validationFunc: [
          ppVertexDensityFactor,
          ppArea,
          ppCountSmallHoles
        ],
        validationFuncArgs: geoArgsParams
      };
  }, [ppVertexDensityFactor, ppArea, ppCountSmallHoles]);
  
  const renderRow: ListRowRenderer = ({ index, key, style }) => {
    let data = Object.values(layerPolygonParts);
    let dataKeys = Object.keys(layerPolygonParts);

    if (isFaultyPPVisible) {
      data = [];
      
      for(let i = 0; i < Object.keys(dataKeys).length; i++){
        for(let j = 0; j < Object.keys(faultyPolygonParts).length; j++){
          if (dataKeys[i] === faultyPolygonParts[j]) {
            data.push(Object.values(layerPolygonParts)[i] as unknown as PolygonPartRecordModelType);
          }
        }
      }
    }


    let polygon_part = data[index];
    if (!polygon_part) {
      return <></>;
    }

    const currentFormKey = polygon_part.uniquePartId;
    const isFirstPhaseErrorInPolygonPart = (firstPhaseErrors[currentFormKey] && Object.keys(firstPhaseErrors[currentFormKey])?.length > NONE);
    const isVestPhaseErrorInPolygonPart = (vestValidationResults[currentFormKey] && vestValidationResults[currentFormKey]?.errorCount > NONE);
    const isGraphQLErrorInPolygonPart = graphQLPayloadObjectErrors.includes(index);
    const isGeometryValid = isGeometryPolygon(polygon_part.footprint);

    if (layerPolygonParts && Object.keys(layerPolygonParts).length > NONE) {
      polygon_part = layerPolygonParts[currentFormKey];
    }
    return (
      <CollapsibleList
                  key={currentFormKey}
                  style={style}
                  open={expandedParts[index]}
                  handle={
                    <Handler partIndex={index} text={currentFormKey} 
                      isErrorInPolygonPart={isFirstPhaseErrorInPolygonPart || isVestPhaseErrorInPolygonPart || isGraphQLErrorInPolygonPart || !isGeometryValid}
                      handleClick={()=>{
                        const ppFields: string[] = removePolygonPart(currentFormKey);

                        ppFields.forEach((key) => {
                          setFieldTouched(currentFormKey + '.' + key, false);
                        });

                        setGraphQLPayloadObjectErrors((prev: number[]) => {
                          const newGraphQLErrors = [ ...prev ];
                          newGraphQLErrors?.splice(index, 1);
                          return newGraphQLErrors;
                        });

                        if (status) {
                          const { errors } = status;
                          if (errors) {
                            const { [currentFormKey]: removedKey, ...rest } = errors as Record<string, unknown>;
                            setStatus({ errors: {...rest} });
                          }
                        }

                        expandedParts?.splice(index, 1);
                        setExpandedParts([...expandedParts]);
                        updateListRowHeights(index);
                        
                        //@ts-ignore
                        delete values[currentFormKey];
                        setValues({
                          ...values
                        });

                        setTimeout(async () => {
                          await validateForm();
                        }, 0); 
                      }}
                      handleSelection={()=>{
                        setSelectedFeature(currentFormKey);
                      }}
                      handleClearSelection={()=>{
                        setSelectedFeature(undefined);
                      }}
                    />
                  }>
        <Box className="polygonPartFormContainer"> 
          <Field key={currentFormKey} name={currentFormKey}>
            {(props: any) => <LayersDetailsComponent
                                geoCustomChecks={
                                  customChecks
                                }
                                entityDescriptors={editFieldDescriptors}
                                layerRecord={polygon_part}
                                // mode={mode}
                                mode={polygonPartsMode === 'FROM_SHAPE' ? Mode.VIEW : mode}
                                formik={entityFormikHandlers}
                                enableMapPreview={false}
                                fieldNamePrefix={`${currentFormKey}.`}
                                showFiedlsCategory={false}
            />}
          </Field>
        </Box>
        <Box className="footer">
          <Box className="messages">
          {
            isFirstPhaseErrorInPolygonPart &&
            <ValidationsError errors={firstPhaseErrors[currentFormKey] as unknown as Record<string,string[]>} />
          }
          {
            !isFirstPhaseErrorInPolygonPart && isVestPhaseErrorInPolygonPart &&
            <ValidationsError errors={vestValidationResults[currentFormKey].getErrors()} />
          }
          </Box>
        </Box>
      </CollapsibleList>
    );
  };

  return (
    <Box id="layerDetailsFormRaster">
      <Form
        onSubmit = {(e) => {
          e.preventDefault();
          handleSubmit(e);
          setIsSubmittedForm(true);
        }}
        autoComplete={'off'}
        className="form"
        noValidate
      >
        {
          (mode === Mode.NEW || mode === Mode.UPDATE) &&
          <IngestionFields
            formik={entityFormikHandlers}
            reloadFormMetadata={reloadFormMetadata}
            validateSources={true}
            recordType={recordType}
            fields={ingestionFields}
            values={values}
            isError={showCurtain}
            onErrorCallback={setShowCurtain}
            manageMetadata={false}
            setValidatingSource={(param: boolean) => {
              setIsValidatingSource(param);
            }}
          >
            <Select
              className={'selectButtonFlavor'}
              enhanced
              placeholder={intl.formatMessage({ id: `polygon-parts.button.load-from-shapeFile` })}
              options={shapeFileProviders}
              disabled={/*!isIngestedSourceSelected() &&*/ showCurtain || isValidatingSource}

              onClick={(e): void => {

                const targetName = (e.target as HTMLElement)?.dataset?.value;
                
                if (!targetName) return;

                setLoadingPolygonParts(true);
                
                importShapeFileFromClient((ev, fileType, fileName) => {
                  const shpFile = (ev.target?.result as unknown) as ArrayBuffer;
                  void proccessShapeFile(shpFile, fileType, targetName, fileName)
                    .then((parsedPPData) => {
                      
                      setPolygonPartsMode('FROM_SHAPE');
                      
                      setLoadingPolygonParts(false);

                      setIsThresholdErrorsCleaned(false);

                      const ppDataKeys = Object.keys(parsedPPData);
                      schemaUpdater(ppDataKeys.length, 0, true);

                      setTimeout(async () => {
                        await validateForm();
                      }, 0);

                      setExpandedParts(new Array(ppDataKeys.length).fill(false));

                      const polygonsData = ppDataKeys.map((key) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        let {errors, polygonPart} = parsedPPData[key]; 
                        return {[key]: polygonPart} 
                      }) // eslint-disable-next-line no-sequences
                      .reduce((acc,curr) => (acc={...acc,...curr},acc),{});

                      setParsingErrors(
                        ppDataKeys.map((key) => {
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          let {errors, polygonPart} = parsedPPData[key];
                          return (!isEmpty(errors) ? {[key]: errors} : undefined)
                        })
                        .filter((item) => item !== undefined) as Record<string, unknown>[]
                      );

                      setValues({
                        ...removePropertiesWithPrefix(values, NESTED_FORMS_PRFIX),
                        ...polygonsData
                      });
                    })
                    .catch((e) => {
                      setLoadingPolygonParts(false);
                      schemaUpdater(0, 0, true);
                      setPolygonPartsMode('MANUAL');
                      setExpandedParts([]);
                      setValues({
                        ...removePropertiesWithPrefix(values, NESTED_FORMS_PRFIX),
                      });
                      setStatus({
                        errors: {
                          // ...currentErrors,
                          [POLYGON_PARTS_STATUS_ERROR]: [intl.formatMessage({ id: (e as Error).message })],
                        },
                      });
                    })
                },
                false,
                false,
                () => {
                  setLoadingPolygonParts(false);
                });
              }}
            />
          </IngestionFields>
        }
        <Box
          className={[
            mode === Mode.NEW ? 'content section' : 'content',
            showCurtain && 'curtainVisible',
          ].join(' ')}
        >
          {showCurtain && <Box className="curtain"></Box>}
          <Box className='checkBoxContainer displayFlex'>
            <Box className='polygonPartsData showOnMapContainer displayFlex'>
              <Checkbox
                className='flexCheckItem'
                label={intl.formatMessage({id: 'polygon-parts.show-parts-on-map.label'})}
                checked={showPolygonPartsOnMap}
                onClick={
                  (evt: React.MouseEvent<HTMLInputElement>): void => {
                    setShowPolygonPartsOnMap(evt.currentTarget.checked);
                  }}
                  />
              <Checkbox
                className='flexCheckItem'
                disabled={faultyPolygonParts.length === 0}
                label={intl.formatMessage({ id: 'polygon-parts.show-parts-with-errors-on-map.label' })}
                checked={isFaultyPPVisible}
                onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
                  setShowFaultyPolygonParts(evt.currentTarget.checked);
                }}
              />
            </Box>
            <Box className='displayFlex'>
            {
              mode === Mode.UPDATE &&
              <Checkbox
                className='flexCheckItem showOnMapContainer'
                label={intl.formatMessage({id: 'polygon-parts.show-exisitng-parts-on-map.label'})}
                checked={showExisitngLayerPartsOnMap}
                onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
                  setShowExisitngLayerPartsOnMap(evt.currentTarget.checked);
                }}
              />
            }
            </Box>
          </Box>
          <Box className="polygonPartsContainer">
            <Box className="polygonPartsData">
              
              {
                !loadingPolygonParts && isEmpty(layerPolygonParts) && <Typography
                    use="headline2"
                    tag="div"
                    className="noSelection"
                    style={{paddingTop: '120px', height: (polygonPartsMode === 'MANUAL') ? '370px' : '410px'}}
                  >
                    <FormattedMessage id="polygon-parts.empty-list" />
                  </Typography>
              }
              
              {
                loadingPolygonParts && <Loading />
              }
              {
                !loadingPolygonParts && !isEmpty(layerPolygonParts) && 
                  <List
                    width={740}
                    ref={setRef}
                    height={(polygonPartsMode === 'MANUAL') ? 370 : 410}
                    rowRenderer={renderRow}
                    rowCount={(faultyPolygonParts.length && showFaultyPolygonParts) ? faultyPolygonParts.length : expandedParts.length}
                    overscanRowCount={3}
                    rowHeight={(idx)=> ( expandedParts[idx.index] ? 316 : 48 )}
                    scrollToIndex = { graphQLPayloadObjectErrors[0] ? graphQLPayloadObjectErrors[0] : (expandedParts.length ? expandedParts.length - 1 : 0) }
                  />
              }
              {
                !loadingPolygonParts && (polygonPartsMode === 'MANUAL') && <Box className="addPolygonPart">
                  <Button
                    outlined
                    type="button"
                    onClick={(): void => {
                      setLoadingPolygonParts(false);
                      setPPCheckPerformed(false);

                      //Sort exisitng pp keys in descending order
                      const exisitngParts = layerPolygonParts ? Object.keys(layerPolygonParts)
                                            .map(key => parseInt(key.replace(NESTED_FORMS_PRFIX,'')))
                                            .sort((a, b) => b - a) : [];
                      const lastPartIdx = exisitngParts.length ? exisitngParts[0] + 1 : 0;

                      schemaUpdater(1, lastPartIdx);
                      setIsSubmittedForm(false);
                   
                      setExpandedParts([...expandedParts.fill(false), true]);

                      const polygonData = {
                        uniquePartId: NESTED_FORMS_PRFIX + lastPartIdx,
                        sourceResolutionMeter: Object.values(ZOOM_LEVELS)
                                              .find((zoom) => zoom.resolutionDeg === gpkgValidationResults?.resolutionDegree)?.resolutionMeter,
                        __typename: "PolygonPartRecord",
                      }
                      
                      setValues({
                        ...values,
                        ...{[polygonData.uniquePartId]: polygonData}
                      });

                      setTimeout(async () => {
                        await validateForm();
                      }, 0);
                    }}>
                      <Icon className="mc-icon-Plus" />
                    </Button>
                </Box>
              }
            </Box>
            {
            <>
              <GeoFeaturesPresentorComponent 
                layerRecord={layerRecord}
                mode={mode} 
                geoFeatures={
                  showPolygonPartsOnMap ? 
                  [
                    sourceExtent as Feature<Geometry, GeoJsonProperties>,
                    sourceExtentMarker as Feature<Geometry, GeoJsonProperties>,
                    outlinedPerimeter as Feature<Geometry, GeoJsonProperties>,
                    outlinedPerimeterMarker as Feature<Geometry, GeoJsonProperties>,
                    ...ppFeatures
                  ] 
                  : []
                } 
                selectedFeatureKey={selectedFeature}
                //@ts-ignore
                selectionStyle={[PPMapStyles.get(FeatureType.SELECTED_FILL), PPMapStyles.get(FeatureType.SELECTED_MARKER)]} 
                style={{width: '520px', position: 'relative', direction: 'ltr'}} 
                fitOptions={{padding:[10,20,10,20]}}
                showExisitngPolygonParts={showExisitngLayerPartsOnMap}
                ingestionResolutionMeter={getFieldMeta('resolutionMeter').value as number}
                ppCheck={ppCheckPerformed}
              />
            </>
            }
          </Box>
          <LayersDetailsComponent
                entityDescriptors={uiIngestionFieldDescriptors as EntityDescriptorModelType[]}
                // @ts-ignore
                layerRecord={{__typename: 'PolygonPartRecord'}}
                mode={mode}
                formik={entityFormikHandlers}
                enableMapPreview={false}
                showFiedlsCategory={false}/>
          <LayersDetailsComponent
                entityDescriptors={ingestionFieldDescriptors}
                layerRecord={layerRecord}
                mode={mode}
                formik={entityFormikHandlers}
                enableMapPreview={false}
                showFiedlsCategory={false}/>
        </Box>
        <Box className="footer">
          <Box className="messages">
            {
              topLevelFieldsErrors && Object.keys(topLevelFieldsErrors).length > NONE &&
              JSON.stringify(topLevelFieldsErrors) !== '{}' &&
              <ValidationsError errors={topLevelFieldsErrors} />
            }
            {
              (Object.keys(topLevelFieldsErrors).length === NONE || JSON.stringify(errors) === '{}') &&
              vestValidationResults.topLevelEntityVestErrors?.errorCount > NONE &&
              <ValidationsError errors={vestValidationResults.topLevelEntityVestErrors.getErrors()} />
            }
            { 
              graphQLError !== undefined &&
              graphQLError !== null &&
              graphQLError &&
              JSON.stringify(graphQLError) !== '{}' &&
              Object.keys(graphQLError).length > NONE &&
              <GraphQLError error={graphQLError} />
            }
          </Box>
          <Box className="buttons">
            {
              (mode === Mode.NEW || (ppCheckPerformed && ppCollisionCheckInProgress === false && customError === undefined)) ?
              <Button
                raised
                type="submit"
                disabled={
                  mutationQueryLoading ||
                  !dirty ||
                  ppFeatures.length === NONE ||
                  Object.keys(errors).length > NONE ||
                  (Object.keys(getStatusErrors()).length > NONE) ||
                  !isEmpty(graphQLError)
                }
              >
                <FormattedMessage id="general.ok-btn.text" />
                {mutationQueryLoading && <Box className="loadingOnTop"><CircularProgress/></Box>}
              </Button> :
              <Button
                type="button"
                raised
                disabled={
                  ppCollisionCheckInProgress ||
                  ppFeatures.length === NONE ||
                  Object.keys(errors).length > NONE ||
                  (Object.keys(getStatusErrors()).length > NONE)
                }
                onClick={(e): void => {
                  setPPCheckPerformed(true);

                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <FormattedMessage id="general.check-btn.text" />
              </Button>
            }
            <Button
              type="button"
              onClick={(): void => {
                closeDialog();
              }}
            >
              <FormattedMessage id="general.cancel-btn.text" />
            </Button>
          </Box>
        </Box>
      </Form>
    </Box>
  );
};

interface LayerDetailsFormProps {
  recordType: RecordType;
  ingestionFields: FieldConfigModelType[];
  mode: Mode;
  entityDescriptors: EntityDescriptorModelType[];
  layerRecord: LayerMetadataMixedUnion;
  schemaUpdater: (parts:number) => void;
  removePolygonPart: (polygonPartKey: string) => string[];
  yupSchema: OptionalObjectSchema<
    { [x: string]: Yup.AnySchema<unknown, unknown, unknown> },
    AnyObject,
    TypeOfShape<{ [x: string]: Yup.AnySchema<unknown, unknown, unknown> }>
  >;
  onSubmit: (values: Record<string, unknown>) => void;
  vestValidationResults: Record<string, DraftResult>;
  mutationQueryError: unknown;
  mutationQueryLoading: boolean;
  closeDialog: () => void;
  customErrorReset: () => void;
  customError?: Record<string,string[]> | undefined;
  ppCollisionCheckInProgress?: boolean | undefined;
}

export default withFormik<LayerDetailsFormProps, FormValues>({
  mapPropsToValues: (props) => {
    return {
      directory: '',
      fileNames: '',
      ...transformEntityToFormFields(props.layerRecord)
    };
  },

  validate: (values: FormValues) => {
    const errors: FormikErrors<FormValues> = {};
    return errors;
  },

  validationSchema: (props: LayerDetailsFormProps) => props.yupSchema,

  handleSubmit: (
    values,
    formikBag: FormikBag<LayerDetailsFormProps, FormValues>
  ) => {
    const entityForSubmit = prepareEntityForSubmit(values as unknown as Record<string, unknown>, formikBag.props.layerRecord);
        
    formikBag.props.onSubmit(entityForSubmit);
  },
})(InnerRasterForm);
