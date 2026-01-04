import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import {
  withFormik,
  FormikProps,
  FormikErrors,
  Form,
  FormikHandlers,
  FormikBag
} from 'formik';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { get } from 'lodash';
import { DraftResult } from 'vest/vestResult';
import * as Yup from 'yup';
import { OptionalObjectSchema, TypeOfShape } from 'yup/lib/object';
import { AnyObject } from 'yup/lib/types';
import { Button } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { ValidationsError } from '../../../../common/components/error/validations.error-presentor';
import { mergeRecursive } from '../../../../common/helpers/object';
import { Mode } from '../../../../common/models/mode.enum';
import { UiDescriptorsTypeName } from '../../../../common/ui-descriptors/type';
import { UserAction } from '../../../models/userStore';
import {
  EntityDescriptorModelType,
  LayerMetadataMixedUnion,
  RecordType,
  useStore
} from '../../../models';
import { LayersDetailsComponent } from '../layer-details';
import {
  filterModeDescriptors,
  prepareEntityForSubmit,
  transformEntityToFormFields
} from '../utils';
import { Curtain } from './curtain/curtain.component';
import { IngestionFields } from './ingestion-fields.raster';
import { JobInfo } from './job-info';
import { GeoFeaturesPresentorComponent } from './pp-map';
import { FeatureType, PPMapStyles } from './pp-map.utils';
import { StateError } from './state-error';
import { RasterWorkflowContext } from './state-machine/context';
import {
  hasActiveJob,
  hasError,
  hasTagDeep,
  isFilesSelected,
  isGoToJobEnabled,
  isJobSubmitted,
  isRetryEnabled,
  isUIDisabled
} from './state-machine/helpers';
import { Events } from './state-machine/types';
import { getUIIngestionFieldDescriptors } from './utils';

import './layer-details-form.raster.css';

const NONE = 0;

// Shape of form values - a bit problematic because we cannot extend union type
export interface FormValues {
  resolutionDegree: number | undefined;
  resolutionMeter: number | undefined;
  resolutionDegreeMaxValue: number | undefined;
}

interface LayerDetailsFormCustomProps {
  recordType: RecordType;
  mode: Mode;
  entityDescriptors: EntityDescriptorModelType[];
  layerRecord: LayerMetadataMixedUnion;
  vestValidationResults: DraftResult;
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
    entityDescriptors,
    mode,
    layerRecord,
    vestValidationResults,
    closeDialog,
    customErrorReset,
    customError,
  } = props;

  const status = props.status as StatusError | Record<string, unknown>;
  const [firstPhaseErrors, setFirstPhaseErrors] = useState<Record<string, string[]>>({});
  const [isSubmittedForm, setIsSubmittedForm] = useState(false);
  const [ingestionFieldsCurtain, setIngestionFieldsCurtain] = useState(false);

  //#region STATE MACHINE
  const actorRef = RasterWorkflowContext.useActorRef();
  const isLoading = hasTagDeep(actorRef?.getSnapshot());
  const state = RasterWorkflowContext.useSelector((s) => s);

  const store = useStore();

  useEffect(() => {
    const { files } = state.context || {};
    const newResolution = files?.data?.validationResult?.resolutionDegree;
    if (newResolution !== values.resolutionDegree) {
      // resetForm();
      setValues({
        ...values,
        resolutionDegree: newResolution ?? values.resolutionDegree,
        resolutionDegreeMaxValue: newResolution ?? values.resolutionDegree,
      });
    }
  }, [state.context?.files]);

  useEffect(() => {
    if (state.context?.formData && state.context?.selectionMode === 'restore') {
      resetForm();
      setValues({
        ...values,
        ...state.context.formData
      });
    }
  }, [state.context?.formData]);
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
  //     filesActor?.send({
  //       type: 'FILES_ERROR',
  //       error: buildError('ingestion.error.invalid-source-file', intl.formatMessage({ id: shapeFilePerimeterVSGpkgExtentError.message }), 'logic', 'error', 'override')
  //     } satisfies Events);
  //   }
  // }, [state.context.files?.gpkg?.geoDetails?.feature, state.context.files?.product?.geoDetails?.feature]);

  const ingestionFieldDescriptors = useMemo(() => {
    return filterModeDescriptors(mode, entityDescriptors);
  }, [entityDescriptors, mode]);

  const uiIngestionFieldDescriptors = useMemo(() => {
    return [{ 
      type: UiDescriptorsTypeName,
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
        customErrorReset();
        handleBlur(e);
        setIngestionFieldsCurtain(true);
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

  // const topLevelFieldsErrors = {} as Record<string,string[]>;
  // firstPhaseErrors && Object.keys(firstPhaseErrors).forEach((err) => {
  //   topLevelFieldsErrors[err] = firstPhaseErrors[err];
  // });

  useEffect(() => {
    if (dirty) {
      actorRef.send({ type: "CLEAN_ERRORS" } satisfies Events);
    }
  }, [dirty]);

  return (
    <Box id="layerDetailsFormRaster">
      <Form
        onSubmit = {(e) => {
          e.preventDefault();
          handleSubmit(e);
          setIsSubmittedForm(true);
          resetForm({ values }); // After submit, reset the form to an undirty state to clear submit errors via CLEAN_ERRORS
        }}
        autoComplete={'off'}
        className="form"
        noValidate
      >
        {
          (mode === Mode.NEW || mode === Mode.UPDATE) &&
          <IngestionFields recordType={recordType} curtain={ingestionFieldsCurtain} />
        }
        <Box className="content section">
          <Box className="previewAndJobContainer">
            <Box className="jobData section">
              <Box className="remainingTime">
                {state.context.remainingTime}
              </Box>
              <JobInfo job={state.context.job} />
            </Box>
            <GeoFeaturesPresentorComponent
              layerRecord={layerRecord}
              mode={mode}
              geoFeatures={
                [
                  state.context.files?.data?.geoDetails?.feature as Feature<Geometry, GeoJsonProperties>,
                  state.context.files?.data?.geoDetails?.marker as Feature<Geometry, GeoJsonProperties>,
                  state.context.files?.product?.geoDetails?.feature as Feature<Geometry, GeoJsonProperties>,
                  state.context.files?.product?.geoDetails?.marker as Feature<Geometry, GeoJsonProperties>
                ]
              } 
              // selectedFeatureKey={selectedFeature}
              // @ts-ignore
              selectionStyle={[PPMapStyles.get(FeatureType.SELECTED_FILL), PPMapStyles.get(FeatureType.SELECTED_MARKER)]}
              style={{width: '520px', position: 'relative', direction: 'ltr'}}
              fitOptions={{padding:[10,20,10,20]}}
              ingestionResolutionMeter={getFieldMeta('resolutionMeter').value as number}
            />
          </Box>
          <Box className="curtainContainer">
            <LayersDetailsComponent
              entityDescriptors={uiIngestionFieldDescriptors as EntityDescriptorModelType[]}
              layerRecord={{__typename: UiDescriptorsTypeName}}
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
            {
              (isLoading || !isFilesSelected(state.context) || isJobSubmitted(state.context)) &&
              <Curtain showProgress={isLoading}/>
            }
          </Box>
        </Box>
        <Box className="footer">
          <Box className="messages">
            <StateError errors={state.context.errors} />
            {/* {
              topLevelFieldsErrors && Object.keys(topLevelFieldsErrors).length > NONE &&
              JSON.stringify(topLevelFieldsErrors) !== '{}' &&
              <ValidationsError errors={topLevelFieldsErrors} />
            } */}
            {
              Object.keys(firstPhaseErrors).length > NONE &&
              JSON.stringify(firstPhaseErrors) !== '{}' &&
              <ValidationsError errors={firstPhaseErrors} />
            }
            {
              (Object.keys(errors).length === NONE || JSON.stringify(errors) === '{}') &&
              vestValidationResults.errorCount > NONE &&
              <ValidationsError errors={vestValidationResults.getErrors()} />
            }
          </Box>
          <Box className="buttons">
            {
              isGoToJobEnabled(state.context) &&
              <Button
                raised
                type="button"
                className={!isRetryEnabled(state.context) ? 'blink-for-attention' : ''}
                onClick={(e): void => {
                  e.preventDefault();
                  e.stopPropagation();
                  store.actionDispatcherStore.dispatchAction({
                    action: UserAction.SYSTEM_CALLBACK_OPEN_JOB_MANAGER,
                    data: { job: state.context.job?.details }
                  })
                  closeDialog();
                }}
              >
                <FormattedMessage id="general.go-to-job-manager-btn.text" />
              </Button>
            }
            {
              !hasActiveJob(state.context) &&
              <Button
                raised
                type="submit"
                disabled={
                  isUIDisabled(isLoading, state) ||
                  !dirty ||
                  Object.keys(errors).length > NONE ||
                  (Object.keys(getStatusErrors()).length > NONE) ||
                  hasError(state.context.errors)
                }
              >
                <FormattedMessage id="general.ok-btn.text" />
              </Button>
            }
            {
              isRetryEnabled(state.context) &&
              <Button
                raised
                type="button"
                disabled={
                  Object.keys(errors).length > NONE ||
                  (Object.keys(getStatusErrors()).length > NONE) ||
                  hasError(state.context.errors)
                }
                onClick={(e): void => {
                  e.preventDefault();
                  e.stopPropagation();
                  actorRef.send({ type: 'STOP_POLLING' } satisfies Events);
                  actorRef.send({ type: 'RETRY' } satisfies Events);
                }}
              >
                <FormattedMessage id="general.retry-btn.text" />
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
  mode: Mode;
  entityDescriptors: EntityDescriptorModelType[];
  layerRecord: LayerMetadataMixedUnion;
  yupSchema: OptionalObjectSchema<
    { [x: string]: Yup.AnySchema<unknown, unknown, unknown> },
    AnyObject,
    TypeOfShape<{ [x: string]: Yup.AnySchema<unknown, unknown, unknown> }>
  >;
  onSubmit: (values: Record<string, unknown>) => void;
  vestValidationResults: DraftResult;
  closeDialog: () => void;
  customErrorReset: () => void;
  customError?: Record<string,string[]> | undefined;
}

export default withFormik<LayerDetailsFormProps, FormValues>({
  mapPropsToValues: (props) => {
    return {
      resolutionDegree: undefined,
      resolutionMeter: undefined,
      resolutionDegreeMaxValue: undefined,
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
