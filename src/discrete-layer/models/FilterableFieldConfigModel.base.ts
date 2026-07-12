/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { FilterFieldValidationModel, FilterFieldValidationModelType } from "./FilterFieldValidationModel"
import { FilterFieldValidationModelSelector } from "./FilterFieldValidationModel.base"
import { RootStoreType } from "./index"


/**
 * FilterableFieldConfigBase
 * auto generated base class for the model FilterableFieldConfigModel.
 */
export const FilterableFieldConfigModelBase = ModelBase
  .named('FilterableFieldConfig')
  .props({
    __typename: types.optional(types.literal("FilterableFieldConfig"), "FilterableFieldConfig"),
    participateInFilterPanel: types.union(types.undefined, types.null, types.boolean),
    operation: types.union(types.undefined, types.null, types.string),
    order: types.union(types.undefined, types.null, types.number),
    validation: types.union(types.undefined, types.null, types.late((): any => FilterFieldValidationModel)),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class FilterableFieldConfigModelSelector extends QueryBuilder {
  get participateInFilterPanel() { return this.__attr(`participateInFilterPanel`) }
  get operation() { return this.__attr(`operation`) }
  get order() { return this.__attr(`order`) }
  validation(builder: string | FilterFieldValidationModelSelector | ((selector: FilterFieldValidationModelSelector) => FilterFieldValidationModelSelector) | undefined) { return this.__child(`validation`, FilterFieldValidationModelSelector, builder) }
}
export function selectFromFilterableFieldConfig() {
  return new FilterableFieldConfigModelSelector()
}

export const filterableFieldConfigModelPrimitives = selectFromFilterableFieldConfig().participateInFilterPanel.operation.order
