import { useEffect, useMemo, useState } from 'react';
import {
  Editor,
  EditorProps,
  OnChange,
  OnMount,
  BeforeMount,
  useMonaco,
} from '@monaco-editor/react';
import { LinearProgress } from '@map-colonies/react-core';
import type { editor } from 'monaco-editor';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import type { ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { JsonSchema, JsonValidation } from './monaco.types';

type MonacoSchemaEntry = { uri: string; schema: JsonSchema; fileMatch: string[] };

// Monaco keeps ONE global list of JSON schemas, and `setDiagnosticsOptions` replaces it.
// Editors therefore register their schema here and the whole list is (re)applied, so several editors can coexist.
const registeredSchemas = new Map<string, MonacoSchemaEntry>();

const isZodSchema = (schema: ZodTypeAny | JsonSchema): schema is ZodTypeAny =>
  typeof (schema as ZodTypeAny).safeParse === 'function';

const toJsonSchema = (schema: ZodTypeAny | JsonSchema): JsonSchema =>
  isZodSchema(schema)
    ? (zodToJsonSchema(schema, { target: 'jsonSchema7', $refStrategy: 'none' }) as JsonSchema)
    : schema;

const validateWithZod = (schema: ZodTypeAny, text: string): JsonValidation => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return {
      success: false,
      issues: [{ path: '', message: `Invalid JSON: ${(e as Error).message}` }],
    };
  }
  const result = schema.safeParse(json);
  return result.success
    ? { success: true, data: result.data }
    : {
        success: false,
        issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      };
};

export type MonacoJSONEditorProps = Omit<EditorProps, 'onChange' | 'value' | 'path' | 'schema'> & {
  /** Zod schema (converted to JSON Schema, and used for validation) or a ready JSON Schema (e.g. a partial one). */
  schema: ZodTypeAny | JsonSchema;
  /** Unique model URI/path of this editor, e.g. `inmemory://models/external-layer/WMTS.full.json`. */
  modelPath: string;
  codeText?: string;
  readonly?: boolean;
  isFetching?: boolean;
  onChange?: (value: string, ev: editor.IModelContentChangedEvent) => void;
  /** Custom validation, e.g. for a partial schema. Defaults to the Zod schema when one is given. */
  validate?: (text: string) => JsonValidation;
  /** Called after every edit with the validation result (only when `validate` or a Zod schema is available). */
  onValidated?: (result: JsonValidation) => void;
};

export const MonacoJSONEditor: React.FC<MonacoJSONEditorProps> = ({
  schema,
  modelPath,
  codeText,
  readonly = false,
  isFetching = false,
  onChange,
  validate,
  onValidated,
  ...editorProps
}) => {
  const [loadProgressBar, setLoadProgressBar] = useState<boolean>(false);
  const [code, setCode] = useState<string>(codeText ?? '');
  const monaco = useMonaco();
  const isDarkMode = false;

  const jsonSchema = useMemo(() => toJsonSchema(schema), [schema]);
  const validator = useMemo(
    () =>
      validate ??
      (isZodSchema(schema)
        ? (text: string): JsonValidation => validateWithZod(schema, text)
        : undefined),
    [validate, schema]
  );

  useEffect(() => {
    setCode(codeText ?? '');
  }, [codeText]);

  useEffect(() => {
    if (!monaco) {
      return;
    }
    registeredSchemas.set(modelPath, {
      uri: `${modelPath}#schema`,
      schema: jsonSchema,
      fileMatch: [modelPath],
    });
    monaco.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      trailingCommas: 'error',
      schemaValidation: 'error',
      schemas: Array.from(registeredSchemas.values()),
    });
    return (): void => {
      registeredSchemas.delete(modelPath);
      monaco.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: Array.from(registeredSchemas.values()),
      });
    };
  }, [monaco, modelPath, jsonSchema]);

  const handleCodeChange: OnChange = (value, ev) => {
    const localCode = value ?? '';
    setCode(localCode);
    onChange?.(localCode, ev);
    if (validator) {
      onValidated?.(validator(localCode));
    }
  };

  const handleBeforeMount: BeforeMount = () => {
    setLoadProgressBar(true);
  };

  const handleMount: OnMount = () => {
    setLoadProgressBar(false);
  };

  return (
    <>
      {loadProgressBar && (
        <LinearProgress value={100} variant={isFetching ? 'indeterminate' : 'determinate'} />
      )}
      <Editor
        width="100%"
        defaultLanguage="json"
        theme={isDarkMode ? 'vs-dark' : 'light'}
        {...editorProps}
        path={modelPath}
        value={code}
        options={{
          readOnly: readonly,
          minimap: { enabled: false },
          // the basemaps tab is mounted while hidden (display: none), so the editor must re-layout when shown
          automaticLayout: true,
          ...editorProps.options,
        }}
        onChange={handleCodeChange}
        onMount={handleMount}
        beforeMount={handleBeforeMount}
      />
    </>
  );
};
