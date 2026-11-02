import { Instance, types } from "mobx-state-tree"
import { FieldConfigModelBase } from "./FieldConfigModel.base"

/* The TypeScript type of an instance of FieldConfigModel */
export interface FieldConfigModelType extends Instance<typeof FieldConfigModel.Type> {}

/* A graphql query fragment builders for FieldConfigModel */
export { selectFromFieldConfig, fieldConfigModelPrimitives, FieldConfigModelSelector } from "./FieldConfigModel.base"

/**
 * FieldConfigModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const FieldConfigModel = FieldConfigModelBase
  .props({
    // UI-only props (not part of the GraphQL schema), set by client-side `UiDescriptors` (see `common/ui-descriptors`)
    // type of the input component of the field, e.g. 'string' | 'number' | 'resolution'
    uiDescriptorFieldType: types.maybe(types.string),
    // the input is marked while the form reports an error for it
    uiShowError: types.maybe(types.boolean),
    // value of the native `autocomplete` attribute of the input, e.g. 'off' to disable the browser's suggestions
    uiAutoComplete: types.maybe(types.string),
  })
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
