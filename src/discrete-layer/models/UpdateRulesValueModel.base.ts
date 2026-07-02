/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { UpdateRulesOperationModel, UpdateRulesOperationModelType } from "./UpdateRulesOperationModel"
import { UpdateRulesOperationModelSelector } from "./UpdateRulesOperationModel.base"
import { RootStoreType } from "./index"


/**
 * UpdateRulesValueBase
 * auto generated base class for the model UpdateRulesValueModel.
 */
export const UpdateRulesValueModelBase = ModelBase
  .named('UpdateRulesValue')
  .props({
    __typename: types.optional(types.literal("UpdateRulesValue"), "UpdateRulesValue"),
    operation: types.union(types.undefined, types.late((): any => UpdateRulesOperationModel)),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class UpdateRulesValueModelSelector extends QueryBuilder {
  operation(builder: string | UpdateRulesOperationModelSelector | ((selector: UpdateRulesOperationModelSelector) => UpdateRulesOperationModelSelector) | undefined) { return this.__child(`operation`, UpdateRulesOperationModelSelector, builder) }
}
export function selectFromUpdateRulesValue() {
  return new UpdateRulesValueModelSelector()
}

export const updateRulesValueModelPrimitives = selectFromUpdateRulesValue()
