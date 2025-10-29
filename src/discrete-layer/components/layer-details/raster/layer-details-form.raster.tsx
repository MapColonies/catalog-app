import React, { useMemo, useState, useEffect, useCallback, Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import {
  withFormik,
  FormikProps,
  FormikErrors,
  Form,
  FormikHandlers,
  FormikBag,
} from 'formik';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { get, isEmpty } from 'lodash';
import * as Yup from 'yup';
import { OptionalObjectSchema, TypeOfShape } from 'yup/lib/object';
import { AnyObject } from 'yup/lib/types';
import { Button, CircularProgress } from '@map-colonies/react-core';
import { Box, CircularProgressBar } from '@map-colonies/react-components';
import { ValidationsError } from '../../../../common/components/error/validations.error-presentor';
import { mergeRecursive } from '../../../../common/helpers/object';
import { Mode } from '../../../../common/models/mode.enum';
import {
  EntityDescriptorModelType,
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
import { StateError } from './state-error';
import { RasterWorkflowContext } from './state-machine/context';
import {
  disableUI,
  hasTagDeep,
  isFilesSelected,
  isJobSubmitted
} from './state-machine/helpers';
import { getUIIngestionFieldDescriptors } from './utils';

import './layer-details-form.raster.css';
import 'react-virtualized/styles.css';

const NONE = 0;

// Shape of form values - a bit problematic because we cannot extend union type
export interface FormValues {
  resolutionDegree: number | undefined;
}

interface LayerDetailsFormCustomProps {
  recordType: RecordType;
  mode: Mode;
  entityDescriptors: EntityDescriptorModelType[];
  layerRecord: LayerMetadataMixedUnion;
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
    closeDialog,
    customErrorReset,
    customError,
  } = props;

  const status = props.status as StatusError | Record<string, unknown>;
  const [firstPhaseErrors, setFirstPhaseErrors] = useState<Record<string, string[]>>({});
  const [isSubmittedForm, setIsSubmittedForm] = useState(false);

  //#region STATE MACHINE
  const actorRef = RasterWorkflowContext.useActorRef();
  const isLoading = hasTagDeep(actorRef?.getSnapshot());
  const state = RasterWorkflowContext.useSelector((s) => s);

  useEffect(() => {
    const { files } = state.context || {};
    const newResolution = files?.gpkg?.validationResult?.resolutionDegree;
    if (newResolution !== values.resolutionDegree) {
      // resetForm();
      setValues({
        ...values,
        resolutionDegree: newResolution ?? values.resolutionDegree,
      });
    }
  }, [state.context?.files]);

  useEffect(() => {
    if (state.context?.formData && state.context?.selectionMode === 'restore') {
      setValues({
        ...values,
        ...state.context.formData,
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

  const JobInfo = (): JSX.Element => {
    return (
      <Box className="jobData section">
        {
          state.context.job &&
          <>
            <Box className="progress">
              <Box className="title bold">
                <FormattedMessage id="ingestion.job.progress" />
              </Box>
              <Box className="center">
                <Box className="progressBar">
                  <CircularProgressBar
                    value={state.context.job?.percentage ?? 0}
                    text={`${state.context.job?.percentage ?? 0}%`}
                  />
                </Box>
              </Box>
            </Box>
            <Box className="section">
              <Box className="reportContainer">
                <Box className="title underline">
                  <FormattedMessage id="ingestion.job.report" />
                </Box>
                <Box className="reportList error">
                  {
                    Object.entries(state.context.job?.report ?? {}).map(([key, value]) => (
                      <Fragment key={key}>
                        <Box key={`${key}-key`}><FormattedMessage id={`report.error.${key}`} /></Box>
                        <Box key={`${key}-value`}>{value as number}</Box>
                      </Fragment>
                    ))
                  }
                </Box>
              </Box>
            </Box>
          </>
        }
      </Box>
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
          <IngestionFields recordType={recordType} />
        }
        <Box className="content section">
          {
            (isLoading || !isFilesSelected(state.context) || isJobSubmitted(state.context)) &&
            <Box className={`curtain ${state.context.flowType === Mode.UPDATE ? 'update' : ''}`}></Box>
          }
          <Box className="previewAndJobContainer">
            <JobInfo />
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
              // @ts-ignore
              selectionStyle={[PPMapStyles.get(FeatureType.SELECTED_FILL), PPMapStyles.get(FeatureType.SELECTED_MARKER)]}
              style={{width: '520px', position: 'relative', direction: 'ltr'}}
              fitOptions={{padding:[10,20,10,20]}}
              ingestionResolutionMeter={getFieldMeta('resolutionMeter').value as number}
            />
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
            <StateError errors={state.context.errors} />
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
                  isLoading ||
                  !dirty ||
                  Object.keys(errors).length > NONE ||
                  (Object.keys(getStatusErrors()).length > NONE) ||
                  !isEmpty(state.context.errors) ||
                  disableUI(state)
                }
              >
                <FormattedMessage id="general.ok-btn.text" />
                {isLoading && <Box className="loadingOnTop"><CircularProgress/></Box>}
              </Button> :
              <Button
                type="button"
                raised
                disabled={
                  Object.keys(errors).length > NONE ||
                  (Object.keys(getStatusErrors()).length > NONE) ||
                  disableUI(state)
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
  mode: Mode;
  entityDescriptors: EntityDescriptorModelType[];
  layerRecord: LayerMetadataMixedUnion;
  yupSchema: OptionalObjectSchema<
    { [x: string]: Yup.AnySchema<unknown, unknown, unknown> },
    AnyObject,
    TypeOfShape<{ [x: string]: Yup.AnySchema<unknown, unknown, unknown> }>
  >;
  onSubmit: (values: Record<string, unknown>) => void;
  closeDialog: () => void;
  customErrorReset: () => void;
  customError?: Record<string,string[]> | undefined;
}

export default withFormik<LayerDetailsFormProps, FormValues>({
  mapPropsToValues: (props) => {
    return {
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
