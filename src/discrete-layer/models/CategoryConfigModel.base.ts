/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { FieldCategoryEnumType } from "./FieldCategoryEnum"
import { FieldConfigModel, FieldConfigModelType } from "./FieldConfigModel"
import { FieldConfigModelSelector } from "./FieldConfigModel.base"
import { RootStoreType } from "./index"


/**
 * CategoryConfigBase
 * auto generated base class for the model CategoryConfigModel.
 */
export const CategoryConfigModelBase = ModelBase
  .named('CategoryConfig')
  .props({
    __typename: types.optional(types.literal("CategoryConfig"), "CategoryConfig"),
    category: types.union(types.undefined, FieldCategoryEnumType),
    categoryTitle: types.union(types.undefined, types.string),
    fields: types.union(types.undefined, types.array(types.late((): any => FieldConfigModel))),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class CategoryConfigModelSelector extends QueryBuilder {
  get category() { return this.__attr(`category`) }
  get categoryTitle() { return this.__attr(`categoryTitle`) }
  fields(builder: string | FieldConfigModelSelector | ((selector: FieldConfigModelSelector) => FieldConfigModelSelector) | undefined) { return this.__child(`fields`, FieldConfigModelSelector, builder) }
}
export function selectFromCategoryConfig() {
  return new CategoryConfigModelSelector()
}

export const categoryConfigModelPrimitives = selectFromCategoryConfig().category.categoryTitle
