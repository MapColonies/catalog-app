import { assign, sendParent } from "xstate";
import { AddPolicy, IContext } from "./types";

export const fetchProductServiceOnDoneActions = [
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
  })),
  sendParent({ type: "FILES_SELECTED" })
];

export const switchModeActions = (selectionMode: SelectionMode) => {
  return [
    assign({ selectionMode, files: {} }),
    sendParent({ type: "SET_FILES", files: {}, addPolicy: "override" })
  ]
};

export const selectFileActions = (fileType: 'gpkg'| 'product' | 'metadata', parentAddPolicy: AddPolicy = 'merge', preserveCurrent: boolean = true) => {
  return [
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
}

export const filesOnError = [
  sendParent((_: { context: IContext; event: any }) => ({
    type: "FILES_ERROR",
    error: { ..._.event.error }
  })),
];