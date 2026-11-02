export const UiDescriptorsTypeName = 'UiDescriptors';
export type UiDescriptorsType = 'UiDescriptors';
export type UiFieldDescriptor = { __typename: UiDescriptorsType };

/** Input component types a `UiDescriptors` field can declare (`FieldConfigModel.uiDescriptorFieldType`). */
export type UiDescriptorFieldType = 'string' | 'number' | 'resolution';
