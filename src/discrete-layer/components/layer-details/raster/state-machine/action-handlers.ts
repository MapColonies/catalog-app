import { assign, sendParent } from 'xstate';
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
  sendParent({ type: "SET_FILES", files, addPolicy: "override" })
];

export const selectFileActions = (fileType: 'gpkg' | 'product' | 'metadata', parentAddPolicy: AddPolicy = 'merge', preserveCurrent: boolean = true) => [
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

export const filesErrorActions = [
  sendParent((_: { context: IContext; event: any }) => ({
    type: "FILES_ERROR",
    error: { ..._.event.error }
  })),
];
