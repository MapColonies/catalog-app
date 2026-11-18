/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { RootStoreType } from "./index"


/**
 * ImportReviewRoleConflictBase
 * auto generated base class for the model ImportReviewRoleConflictModel.
 */
export const ImportReviewRoleConflictModelBase = ModelBase
  .named('ImportReviewRoleConflict')
  .props({
    __typename: types.optional(types.literal("ImportReviewRoleConflict"), "ImportReviewRoleConflict"),
    basemapId: types.union(types.undefined, types.string),
    basemapName: types.union(types.undefined, types.string),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class ImportReviewRoleConflictModelSelector extends QueryBuilder {
  get basemapId() { return this.__attr(`basemapId`) }
  get basemapName() { return this.__attr(`basemapName`) }
}
export function selectFromImportReviewRoleConflict() {
  return new ImportReviewRoleConflictModelSelector()
}

export const importReviewRoleConflictModelPrimitives = selectFromImportReviewRoleConflict().basemapId.basemapName
