/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { CategoryConfigModel, CategoryConfigModelType } from "./CategoryConfigModel"
import { CategoryConfigModelSelector } from "./CategoryConfigModel.base"
import { RootStoreType } from "./index"


/**
 * EntityDescriptorBase
 * auto generated base class for the model EntityDescriptorModel.
 */
export const EntityDescriptorModelBase = ModelBase
  .named('EntityDescriptor')
  .props({
    __typename: types.optional(types.literal("EntityDescriptor"), "EntityDescriptor"),
    type: types.union(types.undefined, types.string),
    categories: types.union(types.undefined, types.array(types.late((): any => CategoryConfigModel))),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class EntityDescriptorModelSelector extends QueryBuilder {
  get type() { return this.__attr(`type`) }
  categories(builder: string | CategoryConfigModelSelector | ((selector: CategoryConfigModelSelector) => CategoryConfigModelSelector) | undefined) { return this.__child(`categories`, CategoryConfigModelSelector, builder) }
}
export function selectFromEntityDescriptor() {
  return new EntityDescriptorModelSelector()
}

export const entityDescriptorModelPrimitives = selectFromEntityDescriptor().type
