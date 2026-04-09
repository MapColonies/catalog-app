/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { RootStoreType } from "./index"


/**
 * CswQuerySummaryBase
 * auto generated base class for the model CswQuerySummaryModel.
 */
export const CswQuerySummaryModelBase = ModelBase
  .named('CswQuerySummary')
  .props({
    __typename: types.optional(types.literal("CSWQuerySummary"), "CSWQuerySummary"),
    numberOfRecordsMatched: types.union(types.undefined, types.number),
    numberOfRecordsReturned: types.union(types.undefined, types.number),
    nextRecord: types.union(types.undefined, types.number),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class CswQuerySummaryModelSelector extends QueryBuilder {
  get numberOfRecordsMatched() { return this.__attr(`numberOfRecordsMatched`) }
  get numberOfRecordsReturned() { return this.__attr(`numberOfRecordsReturned`) }
  get nextRecord() { return this.__attr(`nextRecord`) }
}
export function selectFromCswQuerySummary() {
  return new CswQuerySummaryModelSelector()
}

export const cswQuerySummaryModelPrimitives = selectFromCswQuerySummary().numberOfRecordsMatched.numberOfRecordsReturned.nextRecord
