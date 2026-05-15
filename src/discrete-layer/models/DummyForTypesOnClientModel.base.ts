/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { RasterJobTypeEnumType } from "./RasterJobTypeEnum"
import { RootStoreType } from "./index"


/**
 * DummyForTypesOnClientBase
 * auto generated base class for the model DummyForTypesOnClientModel.
 */
export const DummyForTypesOnClientModelBase = ModelBase
  .named('DummyForTypesOnClient')
  .props({
    __typename: types.optional(types.literal("DummyForTypesOnClient"), "DummyForTypesOnClient"),
    dummy1: types.union(types.undefined, types.null, RasterJobTypeEnumType),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class DummyForTypesOnClientModelSelector extends QueryBuilder {
  get dummy1() { return this.__attr(`dummy1`) }
}
export function selectFromDummyForTypesOnClient() {
  return new DummyForTypesOnClientModelSelector()
}

export const dummyForTypesOnClientModelPrimitives = selectFromDummyForTypesOnClient().dummy1
