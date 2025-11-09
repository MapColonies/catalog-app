/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { RootStoreType } from "./index"


/**
 * AvailableActionsBase
 * auto generated base class for the model AvailableActionsModel.
 */
export const AvailableActionsModelBase = ModelBase
  .named('AvailableActions')
  .props({
    __typename: types.optional(types.literal("AvailableActions"), "AvailableActions"),
    isResumable: types.union(types.undefined, types.boolean),
    isAbortable: types.union(types.undefined, types.null, types.boolean),
    isRestorable: types.union(types.undefined, types.null, types.boolean),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class AvailableActionsModelSelector extends QueryBuilder {
  get isResumable() { return this.__attr(`isResumable`) }
  get isAbortable() { return this.__attr(`isAbortable`) }
  get isRestorable() { return this.__attr(`isRestorable`) }
}
export function selectFromAvailableActions() {
  return new AvailableActionsModelSelector()
}

export const availableActionsModelPrimitives = selectFromAvailableActions().isResumable.isAbortable.isRestorable
