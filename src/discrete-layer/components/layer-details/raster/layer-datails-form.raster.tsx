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
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import * as Yup from 'yup';
import { OptionalObjectSchema, TypeOfShape } from 'yup/lib/object';
import { AnyObject } from 'yup/lib/types';
import { get, isEmpty } from 'lodash';
import { Button, Checkbox, CircularProgress } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { ValidationsError } from '../../../../common/components/error/validations.error-presentor';
import { mergeRecursive } from '../../../../common/helpers/object';
import { Mode } from '../../../../common/models/mode.enum';
import {
  EntityDescriptorModelType,
  FieldConfigModelType,
  LayerMetadataMixedUnion,
  RecordType
} from '../../../models';
import { LayersDetailsComponent } from '../layer-details';
import {
  transformEntityToFormFields,
  filterModeDescriptors,
  prepareEntityForSubmit,
} from '../utils';
import { IngestionFields } from './ingestion-fields.raster';
import { GeoFeaturesPresentorComponent } from './pp-map';
import { FeatureType, PPMapStyles } from './pp-map.utils';
import { StateMachineError } from './state.error-presentor';
import { RasterWorkflowContext } from './state-machine-context.raster';
import { getUIIngestionFieldDescriptors } from './utils';

import './layer-details-form.raster.css';
import 'react-virtualized/styles.css';

const NONE = 0;

// Shape of form values - a bit problematic because we cannot extend union type
export interface FormValues {
  inputFiles: {
    gpkgFilesPath: string[];
    productShapefilePath: string;
    metadataShapefilePath: string;
  } | undefined;
  resolutionDegree: number | undefined;
}

interface LayerDetailsFormCustomProps {
  recordType: RecordType;
  ingestionFields: FieldConfigModelType[];
  mode: Mode;
  entityDescriptors: EntityDescriptorModelType[];
  layerRecord: LayerMetadataMixedUnion;
  mutationQueryError: unknown;
  mutationQueryLoading: boolean;
  closeDialog: () => void;
  customErrorReset: () => void;
  customError?: Record<string,string[]> | undefined;
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
    // eslint-disable-next-line
    mutationQueryError,
    mutationQueryLoading,
    closeDialog,
    customErrorReset,
    customError,
  } = props;

  const status = props.status as StatusError | Record<string, unknown>;
  const intl = useIntl();
  const [graphQLError, setGraphQLError] = useState<unknown>(mutationQueryError);
  const [isSelectedFiles, setIsSelectedFiles] = useState<boolean>(false);
  const [firstPhaseErrors, setFirstPhaseErrors] = useState<Record<string, string[]>>({});
  const [showCurtain, setShowCurtain] = useState<boolean>(true);
  const [showExisitngLayerPartsOnMap, setShowExisitngLayerPartsOnMap] = useState<boolean>(false);
  const [isSubmittedForm, setIsSubmittedForm] = useState(false);

  //#region STATE MACHINE
  // const actorRef = RasterWorkflowContext.useActorRef();
  const state = RasterWorkflowContext.useSelector((s) => s);
  // const flowActor = state.children?.flow;

  useEffect(() => {
    // console.log("**** workflowMachine_STATE[<IngestionFields>] *****", state.value);
    // console.log("**** flowMachine_STATE *****", flowState?.value);

    const { files } = state.context || {};
    const gpkgExists = files?.gpkg?.exists;
    const productExists = files?.product?.exists;
    const metadataExists = files?.metadata?.exists;

    const newResolution = files?.gpkg?.validationResult?.resolutionDegree;

    const allFilesExistAndHavePaths = gpkgExists && productExists && metadataExists && 
      typeof files.gpkg?.path === 'string' &&
      typeof files.product?.path === 'string' &&
      typeof files.metadata?.path === 'string';

    const newInputFiles = allFilesExistAndHavePaths ? {
      gpkgFilesPath: [files.gpkg?.path as string],
      productShapefilePath: files.product?.path as string,
      metadataShapefilePath: files.metadata?.path as string
    } : undefined;

    if (newResolution !== values.resolutionDegree || newInputFiles !== values.inputFiles) {
      setValues({
        ...values,
        resolutionDegree: newResolution ?? values.resolutionDegree,
        inputFiles: newInputFiles ?? values.inputFiles,
      });
    }

    if (!isSelectedFiles && allFilesExistAndHavePaths) {
      setIsSelectedFiles(true);
    }
    if (isSelectedFiles && !allFilesExistAndHavePaths) {
      setIsSelectedFiles(false);
    }
  }, [state.context?.files]);
  //#endregion

  const getStatusErrors = useCallback((): StatusError | Record<string, unknown> => {
    return {
      ...get(status, 'errors') as Record<string, string[]>,
      ...customError
    }
  }, [status, customError]);

  const getYupErrors = useCallback((): Record<string, string[]> => {
    const validationResults: Record<string, string[]> = {};
    Object.entries(errors).forEach(([key, value]) => {
      if (getFieldMeta(key).touched) {
        if (typeof value === 'string') {
          validationResults[key] = [value];
        }
      }
    });
    return validationResults;
  }, [errors, getFieldMeta, isSubmittedForm]);

  useEffect(() => {
    setShowCurtain(!isSelectedFiles);
  }, [isSelectedFiles]);

  useEffect(() => {
    setShowCurtain(
      !isSelectedFiles ||
      (isSelectedFiles && state.context?.files?.gpkg?.validationResult?.isValid !== true)
    );
  }, [isSelectedFiles, state.context?.files?.gpkg?.validationResult?.isValid]);

  useEffect(() => {
    setGraphQLError(mutationQueryError);
  }, [mutationQueryError]);

  useEffect(() => {
    // @ts-ignore
    setFirstPhaseErrors(mergeRecursive(getYupErrors(), getStatusErrors()));
  }, [errors, getYupErrors, getStatusErrors]);

  // const shapeFilePerimeterVSGpkgExtentError = useMemo(() => new Error(`validation-general.shapeFile.polygonParts.not-in-gpkg-extent`), []);

  // ****** Validation of GPKG extent vs. PP perimeter ******
  // ****** Should not be on client side because of allowed tolerance ******
  // ****** (Raster's internal logic) ******
  // useEffect(() => {
  //   if (state.context.files?.gpkg?.geoDetails?.feature?.geometry &&
  //     state.context.files?.product?.geoDetails?.feature &&
  //     !isPolygonContainsPolygon(state.context.files?.gpkg?.geoDetails?.feature, state.context.files?.product?.geoDetails?.feature)) {
  //     flowActor?.send({
  //       type: "FLOW_ERROR",
  //       error:  {
  //         source: "logic",
  //         code: "ingestion.error.invalid-source-file",
  //         message: intl.formatMessage({ id: shapeFilePerimeterVSGpkgExtentError.message }),
  //         level: "error",
  //         addPolicy: "override"
  //       }
  //     } satisfies Events);
  //   }
  // }, [state.context.files?.gpkg?.geoDetails?.feature, state.context.files?.product?.geoDetails?.feature]);

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
            recordType={recordType}
            fields={ingestionFields}
            values={values}
            isError={showCurtain}
            onErrorCallback={setShowCurtain}
            manageMetadata={false}
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
                <GeoFeaturesPresentorComponent 
                  layerRecord={layerRecord}
                  mode={mode} 
                  geoFeatures={
                    [
                      state.context.files?.gpkg?.geoDetails?.feature as Feature<Geometry, GeoJsonProperties>,
                      state.context.files?.gpkg?.geoDetails?.marker as Feature<Geometry, GeoJsonProperties>,
                      state.context.files?.product?.geoDetails?.feature as Feature<Geometry, GeoJsonProperties>,
                      state.context.files?.product?.geoDetails?.marker as Feature<Geometry, GeoJsonProperties>
                    ] 
                  } 
                  // selectedFeatureKey={selectedFeature}
                  //@ts-ignore
                  selectionStyle={[PPMapStyles.get(FeatureType.SELECTED_FILL), PPMapStyles.get(FeatureType.SELECTED_MARKER)]} 
                  style={{width: '520px', position: 'relative', direction: 'ltr'}} 
                  fitOptions={{padding:[10,20,10,20]}}
                  showExisitngPolygonParts={showExisitngLayerPartsOnMap}
                  ingestionResolutionMeter={getFieldMeta('resolutionMeter').value as number}
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
            <StateMachineError errors={state.context.errors} />
            {
              topLevelFieldsErrors && Object.keys(topLevelFieldsErrors).length > NONE &&
              JSON.stringify(topLevelFieldsErrors) !== '{}' &&
              <ValidationsError errors={topLevelFieldsErrors} />
            }
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
  mutationQueryError: unknown;
  mutationQueryLoading: boolean;
  closeDialog: () => void;
  customErrorReset: () => void;
  customError?: Record<string,string[]> | undefined;
}

export default withFormik<LayerDetailsFormProps, FormValues>({
  mapPropsToValues: (props) => {
    return {
      inputFiles: undefined,
      resolutionDegree: undefined,
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
