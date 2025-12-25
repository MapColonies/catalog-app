import { assign, sendParent } from 'xstate';
import { RasterFileTypeConfig } from '../../../../../common/models/raster-ingestion-files-structure';
import { isFilesSelected, normalizeError } from './helpers';
import { AddPolicy, Events, IContext, IFiles } from './types';

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
    error: normalizeError(_.event.error)
  })),
];

export const updateFileButtonStateWithError = (hasError: boolean, fileName?: keyof IFiles) => {
  return sendParent((_: { context: IContext; event: any }) => {
    const files = _.context.files ?? {};
    const isDisabled = (key: keyof IFiles) => fileName ? fileName !== key : false;
    const setErrorAndDisabled = (value: IFiles[keyof IFiles] | undefined, disabled: boolean) => ({
      ...value,
      isDisabled: disabled,
      error: !disabled && hasError
    });

    return {
      type: "SET_FILES",
      files: {
        ...files,
        data: setErrorAndDisabled(files.data, isDisabled('data')),
        product: setErrorAndDisabled(files.product, isDisabled('product')),
        shapeMetadata: setErrorAndDisabled(files.shapeMetadata, isDisabled('shapeMetadata'))
      },
    };
  });
};

export const cleanFilesErrorActions = [
  assign({ errors: [] }),
  sendParent({ type: "CLEAN_FILES_ERROR" } satisfies Events),
  updateFileButtonStateWithError(false)
];
