import { assign, sendParent } from 'xstate';
import { RasterFileTypeConfig } from '../../../../../common/models/raster-ingestion-files-structure';
import { isFilesSelected } from './helpers';
import { AddPolicy, IContext, IFiles } from './types';

export const fetchProductActions = [
  assign((_: { context: IContext; event: any }) => ({
    files: {
      ..._.context.files,
      product: {
        ..._.context.files?.product,
        ..._.event.output
      }
    }
  })),
  sendParent((_: { context: IContext; event: any }) => ({
    type: "SET_FILES",
    files: {
      product: {
        ..._.event.output
      }
    },
    addPolicy: "merge"
  }))
];

export const selectionModeActions = (selectionMode: SelectionMode, files: IFiles = {}) => [
  assign({ selectionMode, files }),
  sendParent({ type: "SET_SELECTION_MODE", selectionMode }),
  sendParent({ type: "SET_FILES", files, addPolicy: "override" }),
  sendParent({ type: "CLEAN_ERRORS" })
];

export const selectFileActions = (fileType: RasterFileTypeConfig, parentAddPolicy: AddPolicy = 'merge', preserveCurrent: boolean = true) => [
  assign((_: { context: IContext; event: any }) => ({
    files: {
      ...(preserveCurrent ? _.context.files : {}),
      [fileType]: {
        ..._.event.file
      }
    }
  })),
  sendParent((_: { context: IContext; event: any }) => ({
    type: "SET_FILES",
    files: {
      [fileType]: {
        ..._.event.file
      }
    },
    addPolicy: parentAddPolicy
  }))
];

export const filesSelectedActions = [
  sendParent((_: { context: IContext; event: any }) => {
    return isFilesSelected(_.context)
      ? {type: "FILES_SELECTED"}
      : {type: "NOOP"};
  })
];

export const filesErrorActions = [
  sendParent((_: { context: IContext; event: any }) => ({
    type: "FILES_ERROR",
    error: { ..._.event.error }
  })),
];

const setDisabled = (value: IFiles[keyof IFiles] | undefined, disabled: boolean) => ({
  ...value,
  disabled
})

export const buttonDisabledErrorActions = (fileName?: keyof IFiles) => {
  return sendParent(
    ({ context }: { context: IContext }) => {
      const files = context.files ?? {};

      const isDisabled = (key: keyof IFiles) => fileName ? fileName !== key : false;

      return {
        type: "SET_FILES",
        files: {
          ...files,
          data: setDisabled(files.data, isDisabled("data")),
          product: setDisabled(files.product, isDisabled("product")),
          shapeMetadata: setDisabled(files.shapeMetadata, isDisabled("shapeMetadata")),
        },
      };
    }
  )
};

export const cleanFilesErrors = [
  assign({ errors: [] }),
  sendParent((_: { context: IContext; event: any }) => ({
    type: "FILES_ERROR",
    error: []
  })),
  buttonDisabledErrorActions()
]
