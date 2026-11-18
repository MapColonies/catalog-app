/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { RootStoreType } from "./index"


/**
 * BasemapExportPackageBase
 * auto generated base class for the model BasemapExportPackageModel.
 */
export const BasemapExportPackageModelBase = ModelBase
  .named('BasemapExportPackage')
  .props({
    __typename: types.optional(types.literal("BasemapExportPackage"), "BasemapExportPackage"),
    filename: types.union(types.undefined, types.string),
    contentBase64: types.union(types.undefined, types.string),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class BasemapExportPackageModelSelector extends QueryBuilder {
  get filename() { return this.__attr(`filename`) }
  get contentBase64() { return this.__attr(`contentBase64`) }
}
export function selectFromBasemapExportPackage() {
  return new BasemapExportPackageModelSelector()
}

export const basemapExportPackageModelPrimitives = selectFromBasemapExportPackage().filename.contentBase64
