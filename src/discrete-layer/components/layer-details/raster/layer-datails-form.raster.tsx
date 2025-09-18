import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  withFormik,
  FormikProps,
  FormikErrors,
  Form,
  FormikHandlers,
  FormikBag,
} from 'formik';
import * as Yup from 'yup';
import { OptionalObjectSchema, TypeOfShape } from 'yup/lib/object';
import { AnyObject } from 'yup/lib/types';
import { DraftResult } from 'vest/vestResult';
import { get, isEmpty, isObject } from 'lodash';
import { Feature } from 'geojson';
import { Button, Checkbox, CircularProgress } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { Mode } from '../../../../common/models/mode.enum';
import { ValidationsError } from '../../../../common/components/error/validations.error-presentor';
import { getGraphQLPayloadNestedObjectErrors, GraphQLError } from '../../../../common/components/error/graphql.error-presentor';
import { MetadataFile } from '../../../../common/components/file-picker';
import { getFirstPoint } from '../../../../common/utils/geo.tools';
import { mergeRecursive } from '../../../../common/helpers/object';
import {
  EntityDescriptorModelType,
  FieldConfigModelType,
  LayerMetadataMixedUnion,
  RecordType,
  SourceValidationModelType
} from '../../../models';
import { LayersDetailsComponent } from '../layer-details';
import {
  extractDescriptorRelatedFieldNames,
  getFlatEntityDescriptors,
  transformEntityToFormFields,
  filterModeDescriptors,
  prepareEntityForSubmit,
} from '../utils';
import { IngestionFields } from './ingestion-fields.raster';
import { getUIIngestionFieldDescriptors } from './ingestion.utils';
import { FeatureType } from './pp-map.utils';
import { RasterWorkflowContext } from './state-machine-context.raster';

import './layer-details-form.raster.css';
import 'react-virtualized/styles.css';

const NONE = 0;

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
    customErrorReset,
    customError,
    ppCollisionCheckInProgress,
  } = props;

  //#region STATE MACHINE
  // const actorRef = RasterWorkflowContext.useActorRef();
  const state = RasterWorkflowContext.useSelector((s) => s);
  //#endregion
  
  
  
  const status = props.status as StatusError | Record<string, unknown>;
  
  const intl = useIntl();
  const [graphQLError, setGraphQLError] = useState<unknown>(mutationQueryError);
  const [isSelectedFiles, setIsSelectedFiles] = useState<boolean>(false);
  const [firstPhaseErrors, setFirstPhaseErrors] = useState<Record<string, string[]>>({});
  const [showCurtain, setShowCurtain] = useState<boolean>(true);
  const [, setSourceExtent] = useState<Feature | undefined>();
  const [, setSourceExtentMarker] = useState<Feature | undefined>();
  const [showExisitngLayerPartsOnMap, setShowExisitngLayerPartsOnMap] = useState<boolean>(false);
  const [gpkgValidationError, setGpkgValidationError] = useState<string|undefined>(undefined);
  const [, setGpkgValidationResults] = useState<SourceValidationModelType|undefined>(undefined);
  const [, setGraphQLPayloadObjectErrors] = useState<number[]>([]);
  const [isSubmittedForm, setIsSubmittedForm] = useState(false);
  const [, setIsValidatingSource] = useState(false);

  const getStatusErrors = useCallback((): StatusError | Record<string, unknown> => {
    return {
      ...get(status, 'errors') as Record<string, string[]>,
      ...customError,
      ...(gpkgValidationError ? {
        error: [gpkgValidationError]
      } : {})
    }
  }, [status, customError, gpkgValidationError]);

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
  }, [errors, getYupErrors, getStatusErrors]);

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

  const entityFormikHandlers: EntityFormikHandlers = useMemo(
    () => ({
      handleChange: (e: React.ChangeEvent<unknown>): void => {
        handleChange(e);
      },
      handleBlur: (e: React.FocusEvent<unknown>): void => {
        setGraphQLError(undefined);
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
    
    setGpkgValidationResults(validationResults);
    
    setGpkgValidationError(
      !validationResults.isValid ? validationResults.message as string : undefined
    );

    resetForm();
    
    setValues({
      ...values,
      ...transformEntityToFormFields((isEmpty(metadata.recordModel) ? layerRecord : metadata.recordModel)),
      ...ingestionFields,
    });

    setGraphQLError(metadata.error);
  };

  /*const isIngestedSourceSelected = () => {
    let res = true;
    ingestionFields.forEach((curr) => {
      // @ts-ignore
      res = res && !isEmpty(values[curr?.fieldName]);
    }, true);
    return res;
  }*/

  const topLevelFieldsErrors = {} as Record<string,string[]>;
  firstPhaseErrors && Object.keys(firstPhaseErrors).forEach((err) => {
    topLevelFieldsErrors[err] = firstPhaseErrors[err];
  });

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
          />
        }
        <Box
          className={[
            mode === Mode.NEW ? 'content section' : 'content',
            showCurtain && 'curtainVisible',
          ].join(' ')}
        >
          {
            showCurtain && <Box className="curtain"></Box>
          }
          <Box className='checkBoxContainer displayFlex'>
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
          <Box className="validationsContainer">
            <Box className="validationsData">
            </Box>
            {
              <>
                {/* <GeoFeaturesPresentorComponent 
                  layerRecord={layerRecord}
                  mode={mode} 
                  geoFeatures={
                    showPolygonPartsOnMap ? 
                    [
                      sourceExtent as Feature<Geometry, GeoJsonProperties>,
                      sourceExtentMarker as Feature<Geometry, GeoJsonProperties>,
                      outlinedPerimeter as Feature<Geometry, GeoJsonProperties>,
                      outlinedPerimeterMarker as Feature<Geometry, GeoJsonProperties>
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
                /> */}
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
            <GraphQLError error={state.context.errors[0]} />
            {/* {
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
            } */}
          </Box>
          <Box className="buttons">
            {
              (mode === Mode.NEW || customError === undefined) ?
              <Button
                raised
                type="submit"
                disabled={
                  mutationQueryLoading ||
                  !dirty ||
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
                  Object.keys(errors).length > NONE ||
                  (Object.keys(getStatusErrors()).length > NONE)
                }
                onClick={(e): void => {
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
