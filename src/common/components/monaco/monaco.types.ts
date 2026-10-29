/** Plain JSON Schema object (what Monaco's JSON language service consumes). Replaces the former `ajv` `SchemaObject`. */
export type JsonSchema = { $id?: string } & Record<string, unknown>;

export interface JsonValidationIssue {
  path: string;
  message: string;
}

export type JsonValidation =
  | { success: true; data: unknown }
  | { success: false; issues: JsonValidationIssue[] };
