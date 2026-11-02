import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { useIntl } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { MonacoJSONEditor } from '../../../common/components/monaco';
import { Mode } from '../../../common/models/mode.enum';
import {
  ExternalLayerType,
  OptionsPolicy,
  getMonacoSchemaEntry,
  getOptionsJsonSchema,
} from '../../../common/schemas/external-layer-options';
import {
  OptionsFormResult,
  getMandatoryEntityDescriptors,
  getMandatoryInitialValues,
  validateOptionsForm,
} from '../../../common/schemas/schema-entity-descriptor';
import { LayersDetailsComponent } from '../layer-details/layer-details';
import { EntityFormikHandlers } from '../layer-details/layer-datails-form';
import { UiDescriptorsTypeName } from '../../../common/ui-descriptors/type';

const INITIAL_OPTIONAL_TEXT = '{}';

interface ExternalLayerOptionsFormProps {
  type: ExternalLayerType;
  policy?: OptionsPolicy;
  /** Called with the merged options and their validation after every edit. */
  onChange?: (result: OptionsFormResult) => void;
}

/**
 * Options of an EXTERNAL layer: mandatory options as input components (generated from the schema through an entity
 * descriptor), the rest as JSON in a Monaco editor restricted to the `optional` schema mode.
 */
export const ExternalLayerOptionsForm: React.FC<ExternalLayerOptionsFormProps> = ({
  type,
  policy,
  onChange,
}) => {
  const intl = useIntl();
  const [optionalText, setOptionalText] = useState<string>(INITIAL_OPTIONAL_TEXT);
  const optionalTextRef = useRef(optionalText);
  optionalTextRef.current = optionalText;

  const descriptors = useMemo(() => getMandatoryEntityDescriptors(type, policy), [type, policy]);
  const formik = useFormik<Record<string, unknown>>({
    initialValues: getMandatoryInitialValues(type, policy),
    // Field issues go to formik errors, which mark the inputs (see `uiShowError`).
    validate: (values) =>
      validateOptionsForm(type, values, optionalTextRef.current, policy).fieldIssues,
    onSubmit: () => undefined,
  });

  const optionalSchema = useMemo(
    () => getOptionsJsonSchema(type, policy, 'optional'),
    [type, policy]
  );
  const modelPath = useMemo(
    () => getMonacoSchemaEntry(type, policy, 'optional').fileMatch[0],
    [type, policy]
  );

  const result = useMemo(
    () => validateOptionsForm(type, formik.values, optionalText, policy),
    [type, policy, formik.values, optionalText]
  );
  useEffect(() => {
    void formik.validateForm();
  }, [optionalText]);
  useEffect(() => {
    onChange?.(result);
  }, [result]);

  // Nothing is reported on a pristine form. An input reports once it was left (blur) or edited; the editor once its text changed.
  const isEditorDirty = optionalText !== INITIAL_OPTIONAL_TEXT;
  const issues = [
    ...Object.entries(result.fieldIssues)
      .filter(
        ([key]) =>
          formik.touched[key] === true || (formik.dirty && String(formik.values[key] ?? '') !== '')
      )
      .map(([path, message]) => ({ path, message })),
    ...(isEditorDirty ? result.editorIssues : []),
  ];

  return (
    <Box className="basemapComposerOptions">
      <LayersDetailsComponent
        entityDescriptors={descriptors}
        layerRecord={{ __typename: UiDescriptorsTypeName }}
        mode={Mode.NEW}
        formik={formik as unknown as EntityFormikHandlers}
        enableMapPreview={false}
        showFiedlsCategory={false}
        intl={intl}
      />
      <Box className="basemapComposerOptionsEditor">
        <MonacoJSONEditor
          schema={optionalSchema}
          modelPath={modelPath}
          codeText={optionalText}
          onChange={(value): void => setOptionalText(value)}
          options={{ automaticLayout: true, minimap: { enabled: false } }}
        />
      </Box>
      {issues.length > 0 && (
        <ul className="basemapComposerOptionsIssues">
          {issues.map(({ path, message }) => (
            <li key={`${path}:${message}`}>{path ? `${path}: ${message}` : message}</li>
          ))}
        </ul>
      )}
    </Box>
  );
};
