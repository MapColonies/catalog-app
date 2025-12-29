import { assign, sendParent } from 'xstate';
import { RasterFileTypeConfig } from '../../../../../common/models/raster-ingestion-files-structure';
import { isFilesSelected, normalizeError } from './helpers';
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
  sendParent({ type: "CLEAN_FILES_ERRORS" })
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

export const updateFileErrorAction = (targetFile?: keyof IFiles) => {
  return sendParent((_: { context: IContext; event: any }) => {
    const files = _.context.files ?? {};

    const updateFile = (file: IFiles[keyof IFiles] | undefined, key: keyof IFiles) => {
      if (!file) {
        return;
      }

      const isDisabled = targetFile ? targetFile !== key : false;
      const hasError = targetFile === undefined ? false : !isDisabled;

      return {
        ...file,
        isDisabled,
        hasError
      };
    };

    const dataVal = updateFile(files.data, 'data');
    const productVal = updateFile(files.product, 'product');
    const shapeMetadataVal = updateFile(files.shapeMetadata, 'shapeMetadata');

    return {
      type: "SET_FILES",
      files: {
        ...files,
        ...(dataVal ? {data: dataVal} : {}),
        ...(productVal ? {product: productVal} : {}),
        ...(shapeMetadataVal ? {shapeMetadata: shapeMetadataVal} : {})
      },
    };
  });
};

export const filesErrorActions = (targetFile?: keyof IFiles) => [
  sendParent((_: { context: IContext; event: any }) => ({
    type: "FILES_ERROR",
    error: normalizeError(_.event.error)
  })),
  updateFileErrorAction(targetFile)
];

export const cleanFilesErrorActions = () => [
  assign({ errors: [] }),
  sendParent({ type: 'CLEAN_FILES_ERRORS' }),
  updateFileErrorAction()
];
