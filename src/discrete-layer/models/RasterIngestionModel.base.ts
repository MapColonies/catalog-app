/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { RootStoreType } from "./index"


/**
 * RasterIngestionBase
 * auto generated base class for the model RasterIngestionModel.
 */
export const RasterIngestionModelBase = ModelBase
  .named('RasterIngestion')
  .props({
    __typename: types.optional(types.literal("RasterIngestion"), "RasterIngestion"),
    jobId: types.union(types.undefined, types.string),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class RasterIngestionModelSelector extends QueryBuilder {
  get jobId() { return this.__attr(`jobId`) }
}
export function selectFromRasterIngestion() {
  return new RasterIngestionModelSelector()
}

export const rasterIngestionModelPrimitives = selectFromRasterIngestion().jobId
