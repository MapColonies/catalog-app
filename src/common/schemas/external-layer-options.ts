import {
  WmtsOptionsSchema,
  createWmtsOptionsSchema,
  WmsOptionsSchema,
  createWmsOptionsSchema,
  XyzOptionsSchema,
  createXyzOptionsSchema,
} from '@map-colonies/react-components/schemas';
import type { ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ImageryProtocolType } from '../models/protocol-type.enum';

/**
 * Options schemas of EXTERNAL imagery layers, keyed by imagery protocol type.
 * Source of truth is `@map-colonies/react-components/schemas`.
 */
export type ExternalLayerType = ImageryProtocolType;

const buildRegistry = (
  allowUrlCredentials: boolean
): Partial<Record<ExternalLayerType, ZodTypeAny>> => ({
  [ImageryProtocolType.WMTS]: allowUrlCredentials
    ? createWmtsOptionsSchema({ allowUrlCredentials })
    : WmtsOptionsSchema,
  [ImageryProtocolType.WMS]: allowUrlCredentials
    ? createWmsOptionsSchema({ allowUrlCredentials })
    : WmsOptionsSchema,
  [ImageryProtocolType.XYZ]: allowUrlCredentials
    ? createXyzOptionsSchema({ allowUrlCredentials })
    : XyzOptionsSchema,
});

/** Imagery protocols whose options schema is already available; the rest are added one by one. */
export const SUPPORTED_EXTERNAL_LAYER_TYPES: ExternalLayerType[] = Object.keys(
  buildRegistry(false)
) as ExternalLayerType[];

export const hasOptionsSchema = (type: ExternalLayerType): boolean =>
  SUPPORTED_EXTERNAL_LAYER_TYPES.includes(type);

export interface OptionsPolicy {
  /** Explicit opt-in (e.g. for an admin role): permit credentials/tokens embedded in layer URLs. */
  allowUrlCredentials?: boolean;
}

export const getOptionsSchema = (
  type: ExternalLayerType,
  { allowUrlCredentials = false }: OptionsPolicy = {}
): ZodTypeAny => {
  const schema = buildRegistry(allowUrlCredentials)[type];
  if (schema === undefined) {
    throw new Error(`No options schema for imagery protocol "${type}" yet`);
  }
  return schema;
};

/**
 * `full`: every option, mandatory ones required.
 * `optional`: only the non-mandatory options (the mandatory ones, e.g. url/layer, are managed outside the editor and rejected inside it).
 * `mandatory`: only the mandatory options (all required); the optional ones are managed outside the editor and rejected inside it.
 */
export type SchemaMode = 'full' | 'optional' | 'mandatory';

type JsonSchemaObject = { properties?: Record<string, unknown>; required?: string[] } & Record<
  string,
  unknown
>;

const fullJsonSchema = (type: ExternalLayerType, policy?: OptionsPolicy): JsonSchemaObject =>
  zodToJsonSchema(getOptionsSchema(type, policy), {
    target: 'jsonSchema7',
    $refStrategy: 'none',
  }) as JsonSchemaObject;

/** Names of the mandatory options, derived from the schema (never hand-maintained). */
export const getMandatoryKeys = (type: ExternalLayerType): string[] =>
  fullJsonSchema(type).required ?? [];

/** Plain JSON Schema (draft-07) of the options of the given link type, in the requested mode. */
export const getOptionsJsonSchema = (
  type: ExternalLayerType,
  policy?: OptionsPolicy,
  mode: SchemaMode = 'full'
): Record<string, unknown> => {
  const full = fullJsonSchema(type, policy);
  if (mode === 'full') {
    return full;
  }
  const mandatory = new Set(full.required ?? []);
  const keep = (key: string): boolean =>
    mode === 'mandatory' ? mandatory.has(key) : !mandatory.has(key);
  const { required: _required, ...rest } = full;
  // additionalProperties stays false, so a key of the other group typed into the editor is flagged as unknown.
  return {
    ...rest,
    ...(mode === 'mandatory' && { required: full.required }),
    properties: Object.fromEntries(
      Object.entries(full.properties ?? {}).filter(([key]) => keep(key))
    ),
  };
};

/** Names of the options an editor in the given mode shows. */
export const getModeKeys = (type: ExternalLayerType, mode: SchemaMode): string[] => {
  const properties = Object.keys(fullJsonSchema(type).properties ?? {});
  const mandatory = new Set(getMandatoryKeys(type));
  return mode === 'full'
    ? properties
    : properties.filter((key) => (mode === 'mandatory' ? mandatory.has(key) : !mandatory.has(key)));
};

/** The part of `options` an editor in the given mode shows. */
export const pickOptionsByMode = (
  type: ExternalLayerType,
  options: Record<string, unknown>,
  mode: SchemaMode
): Record<string, unknown> => {
  const keys = new Set(getModeKeys(type, mode));
  return Object.fromEntries(Object.entries(options).filter(([key]) => keys.has(key)));
};

/** Puts the edited part back: replaces the options of the mode's group, keeps the others. */
export const mergeOptionsByMode = (
  type: ExternalLayerType,
  current: Record<string, unknown>,
  edited: Record<string, unknown>,
  mode: SchemaMode
): Record<string, unknown> => {
  const keys = new Set(getModeKeys(type, mode));
  const untouched = Object.fromEntries(Object.entries(current).filter(([key]) => !keys.has(key)));
  return { ...untouched, ...edited };
};

/**
 * Entry for Monaco's JSON language service. Give the editor model the matching `fileMatch[0]` as its URI.
 * `full` and `optional` entries have different URIs, so both can be registered at once for different editors.
 *
 * @example
 * const entry = getMonacoSchemaEntry('WMTS', undefined, 'optional');
 * monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: true, schemas: [entry] });
 * const model = monaco.editor.createModel(initialJson, 'json', monaco.Uri.parse(entry.fileMatch[0]));
 */
export const getMonacoSchemaEntry = (
  type: ExternalLayerType,
  policy?: OptionsPolicy,
  mode: SchemaMode = 'full'
) => ({
  uri: `inmemory://schemas/external-layer/${type}.${mode}.schema.json`,
  fileMatch: [`inmemory://models/external-layer/${type}.${mode}.json`],
  schema: getOptionsJsonSchema(type, policy, mode),
});

export interface OptionsIssue {
  path: string;
  message: string;
}

export type OptionsValidation =
  | { success: true; data: unknown }
  | { success: false; issues: OptionsIssue[] };

/** Validates the text of the editor (JSON) against the schema of the link type, with the same rules the backend enforces. */
export const validateOptionsText = (
  type: ExternalLayerType,
  text: string,
  policy?: OptionsPolicy
): OptionsValidation => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return {
      success: false,
      issues: [{ path: '', message: `Invalid JSON: ${(e as Error).message}` }],
    };
  }
  const result = getOptionsSchema(type, policy).safeParse(json);
  return result.success
    ? { success: true, data: result.data }
    : {
        success: false,
        issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      };
};

/**
 * Validates the text of an editor showing only a group of options (`optional` or `mandatory`).
 * The other group comes from `rest` (the rest of the form); keys of the other group inside the text are rejected.
 * The merged result goes through the full schema, so cross-field rules still apply.
 */
export const validateOptionsTextByMode = (
  type: ExternalLayerType,
  text: string,
  mode: Exclude<SchemaMode, 'full'>,
  rest: Record<string, unknown>,
  policy?: OptionsPolicy
): OptionsValidation => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return {
      success: false,
      issues: [{ path: '', message: `Invalid JSON: ${(e as Error).message}` }],
    };
  }
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return { success: false, issues: [{ path: '', message: 'Expected a JSON object' }] };
  }
  const allowed = new Set(getModeKeys(type, mode));
  const misplaced = Object.keys(json).filter((key) => !allowed.has(key));
  if (misplaced.length > 0) {
    return {
      success: false,
      issues: misplaced.map((key) => ({
        path: key,
        message: `Option is not part of the ${mode} options`,
      })),
    };
  }
  return validateOptionsText(type, JSON.stringify({ ...rest, ...json }), policy);
};

/** Validates the text of the `optional` editor; mandatory options come from `mandatory`. */
export const validateOptionalOptionsText = (
  type: ExternalLayerType,
  text: string,
  mandatory: Record<string, unknown>,
  policy?: OptionsPolicy
): OptionsValidation => validateOptionsTextByMode(type, text, 'optional', mandatory, policy);
