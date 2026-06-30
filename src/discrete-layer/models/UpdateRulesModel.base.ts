/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { UpdateRulesValueModel, UpdateRulesValueModelType } from "./UpdateRulesValueModel"
import { UpdateRulesValueModelSelector } from "./UpdateRulesValueModel.base"
import { RootStoreType } from "./index"


/**
 * UpdateRulesBase
 * auto generated base class for the model UpdateRulesModel.
 */
export const UpdateRulesModelBase = ModelBase
  .named('UpdateRules')
  .props({
    __typename: types.optional(types.literal("UpdateRules"), "UpdateRules"),
    freeze: types.union(types.undefined, types.null, types.boolean),
    value: types.union(types.undefined, types.null, types.late((): any => UpdateRulesValueModel)),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class UpdateRulesModelSelector extends QueryBuilder {
  get freeze() { return this.__attr(`freeze`) }
  value(builder: string | UpdateRulesValueModelSelector | ((selector: UpdateRulesValueModelSelector) => UpdateRulesValueModelSelector) | undefined) { return this.__child(`value`, UpdateRulesValueModelSelector, builder) }
}
export function selectFromUpdateRules() {
  return new UpdateRulesModelSelector()
}

export const updateRulesModelPrimitives = selectFromUpdateRules().freeze
