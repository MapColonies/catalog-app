/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { RootStoreType } from "./index"


/**
 * RasterUniquenessBase
 * auto generated base class for the model RasterUniquenessModel.
 */
export const RasterUniquenessModelBase = ModelBase
  .named('RasterUniqueness')
  .props({
    __typename: types.optional(types.literal("RasterUniqueness"), "RasterUniqueness"),
    productId: types.union(types.undefined, types.null, types.string),
    productType: types.union(types.undefined, types.null, types.string),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class RasterUniquenessModelSelector extends QueryBuilder {
  get productId() { return this.__attr(`productId`) }
  get productType() { return this.__attr(`productType`) }
}
export function selectFromRasterUniqueness() {
  return new RasterUniquenessModelSelector()
}

export const rasterUniquenessModelPrimitives = selectFromRasterUniqueness().productId.productType
