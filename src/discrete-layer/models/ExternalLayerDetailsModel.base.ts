/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { RootStoreType } from "./index"


/**
 * ExternalLayerDetailsBase
 * auto generated base class for the model ExternalLayerDetailsModel.
 */
export const ExternalLayerDetailsModelBase = ModelBase
  .named('ExternalLayerDetails')
  .props({
    __typename: types.optional(types.literal("ExternalLayerDetails"), "ExternalLayerDetails"),
    protocol: types.union(types.undefined, types.string),
    name: types.union(types.undefined, types.string),
    url: types.union(types.undefined, types.string),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class ExternalLayerDetailsModelSelector extends QueryBuilder {
  get protocol() { return this.__attr(`protocol`) }
  get name() { return this.__attr(`name`) }
  get url() { return this.__attr(`url`) }
}
export function selectFromExternalLayerDetails() {
  return new ExternalLayerDetailsModelSelector()
}

export const externalLayerDetailsModelPrimitives = selectFromExternalLayerDetails().protocol.name.url
