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
import { get, isEmpty } from 'lodash';
import { Button } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { Mode } from '../../../common/models/mode.enum';
import { ValidationsError } from '../../../common/components/error/validations.error-presentor';
import { GraphQLError } from '../../../common/components/error/graphql.error-presentor';
import { MetadataFile } from '../../../common/components/file-picker';
// import useSessionStoreWatcherForm from '../../../common/hooks/useSessionStoreWatcherForm';
import {
  EntityDescriptorModelType,
  FieldConfigModelType,
  LayerMetadataMixedUnion,
  RecordType,
} from '../../models';
import { LayersDetailsComponent } from './layer-details';
import { IngestionFields } from './ingestion-fields';
import {
  extractDescriptorRelatedFieldNames,
  getFlatEntityDescriptors,
  transformEntityToFormFields,
  prepareEntityForSubmit,
} from './utils';

import './layer-details-form.css';

const NONE = 0;

// Shape of form values - a bit problematic because we cant extend union type.
export interface FormValues {
  directory: string;
  fileNames: string;
}

export interface StatusError {
  errors: {
    [fieldName: string]: string[];
  };
}

interface LayerDetailsFormCustomProps {
  recordType: RecordType;
  ingestionFields: FieldConfigModelType[];
  mode: Mode;
  entityDescriptors: EntityDescriptorModelType[];
  layerRecord: LayerMetadataMixedUnion;
  vestValidationResults: DraftResult;
  mutationQueryError: unknown;
  mutationQueryLoading: boolean;
  closeDialog: () => void;
}

export interface EntityFormikHandlers extends FormikHandlers {
  setFieldValue: (
    field: string,
    value: unknown,
    shouldValidate?: boolean
  ) => void;
  setFieldError: (field: string, message: string) => void;
  setFieldTouched: (
    field: string,
    isTouched?: boolean | undefined,
    shouldValidate?: boolean | undefined
  ) => void;
  setStatus: (status?: StatusError | Record<string, unknown>) => void;
  status: StatusError | Record<string, unknown>;
}

const InnerForm = (
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
  } = props;

  const status = props.status as StatusError | Record<string, unknown>;
  const intl = useIntl();
  const [graphQLError, setGraphQLError] = useState<unknown>(mutationQueryError);
  const [isSelectedFiles, setIsSelectedFiles] = useState<boolean>(false);
  const [firstPhaseErrors, setFirstPhaseErrors] = useState<
    Record<string, string[]>
  >({});
  const [showCurtain, setShowCurtain] = useState<boolean>(true);
  // const validationWarn = useSessionStoreWatcherForm();

  const getStatusErrors = useCallback(():
    | StatusError
    | Record<string, unknown> => {
    return {
      ...(get(status, 'errors') as Record<string, string[]>),
    };
  }, [status]);

  const getYupErrors = useCallback((): Record<string, string[]> => {
    const validationResults: Record<string, string[]> = {};
    Object.entries(errors).forEach(([key, value]) => {
      if (getFieldMeta(key).touched) {
        validationResults[key] = [value];
      }
    });
    return validationResults;
  }, [errors, getFieldMeta]);

  useEffect(() => {
    setShowCurtain(
      (mode === Mode.NEW || mode === Mode.UPDATE) && !isSelectedFiles
    );
  }, [mode, isSelectedFiles]);

  useEffect(() => {
    setGraphQLError(mutationQueryError);
  }, [mutationQueryError]);

  useEffect(() => {
    setFirstPhaseErrors({
      ...getYupErrors(),
      ...(getStatusErrors() as { [fieldName: string]: string[] }),
    });
  }, [errors, getYupErrors, getStatusErrors]);

  const entityFormikHandlers: EntityFormikHandlers = useMemo(
    () => ({
      handleChange: (e: React.ChangeEvent<unknown>): void => {
        setGraphQLError(undefined);
        handleChange(e);
      },
      handleBlur: (e: React.FocusEvent<unknown>): void => {
        setGraphQLError(undefined);
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
    metadata: MetadataFile
  ): void => {
    setIsSelectedFiles(!!ingestionFields.fileNames);

    delete (metadata.recordModel as unknown as Record<string, unknown>)[
      '__typename'
    ];

    // Check update related fields in metadata obj
    const updateFields = extractDescriptorRelatedFieldNames(
      'updateRules',
      getFlatEntityDescriptors(layerRecord.__typename, entityDescriptors)
    );

    for (const [key, val] of Object.entries(metadata.recordModel)) {
      if (
        val === null ||
        (updateFields.includes(key) && mode === Mode.UPDATE)
      ) {
        delete (metadata.recordModel as unknown as Record<string, unknown>)[
          key
        ];
      }
    }

    resetForm();
    setValues({
      ...values,
      ...transformEntityToFormFields(
        isEmpty(metadata.recordModel) ? layerRecord : metadata.recordModel
      ),
      ...ingestionFields,
    });

    setGraphQLError(metadata.error);
  };

  return (
    <Box id="layerDetailsForm">
      <Form
        onSubmit={handleSubmit}
        autoComplete={'off'}
        className="form"
        noValidate
      >
        {(mode === Mode.NEW || mode === Mode.UPDATE) && (
          <IngestionFields
            formik={entityFormikHandlers}
            reloadFormMetadata={reloadFormMetadata}
            validateSources={recordType === RecordType.RECORD_3D}
            recordType={recordType}
            fields={ingestionFields}
            values={values}
            isError={showCurtain}
            onErrorCallback={setShowCurtain}
          />
        )}
        <Box
          className={[
            mode === Mode.NEW ? 'content section' : 'content',
            showCurtain && 'curtainVisible',
          ].join(' ')}
        >
          {showCurtain && <Box className="curtain"></Box>}
          <LayersDetailsComponent
            entityDescriptors={entityDescriptors}
            layerRecord={layerRecord}
            mode={mode}
            formik={entityFormikHandlers}
            intl={intl}
          />
        </Box>
        <Box className="footer">
          <Box className="messages">
            {Object.keys(firstPhaseErrors).length > NONE &&
              JSON.stringify(firstPhaseErrors) !== '{}' && (
                <ValidationsError errors={firstPhaseErrors} />
              )}
            {(Object.keys(errors).length === NONE ||
              JSON.stringify(errors) === '{}') &&
              vestValidationResults.errorCount > NONE && (
                <ValidationsError errors={vestValidationResults.getErrors()} />
              )}
            {graphQLError !== undefined &&
              graphQLError !== null &&
              graphQLError &&
              JSON.stringify(graphQLError) !== '{}' &&
              Object.keys(graphQLError).length > NONE && (
                <GraphQLError error={graphQLError} />
              )}
          </Box>
          <Box className="buttons">
            {mode !== Mode.VIEW && (
              <Button
                raised
                type="submit"
                disabled={
                  mutationQueryLoading ||
                  !dirty ||
                  Object.keys(errors).length > NONE ||
                  Object.keys(getStatusErrors()).length > NONE ||
                  !isEmpty(graphQLError)
                }
              >
                <FormattedMessage id="general.ok-btn.text" />
              </Button>
            )}
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
  vestValidationResults: DraftResult;
  mutationQueryError: unknown;
  mutationQueryLoading: boolean;
  closeDialog: () => void;
}

export default withFormik<LayerDetailsFormProps, FormValues>({
  mapPropsToValues: (props) => {
    return {
      directory: '',
      fileNames: '',
      ...transformEntityToFormFields(props.layerRecord),
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
    const entityForSubmit = prepareEntityForSubmit(
      values as unknown as Record<string, unknown>,
      formikBag.props.layerRecord
    );

    formikBag.props.onSubmit(entityForSubmit);
  },
})(InnerForm);
