/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { ExternalLayerDetailsModel, ExternalLayerDetailsModelType } from "./ExternalLayerDetailsModel"
import { ExternalLayerDetailsModelSelector } from "./ExternalLayerDetailsModel.base"
import { ResourceResolutionStatusEnumType } from "./ResourceResolutionStatusEnum"
import { SourceTypeEnumType } from "./SourceTypeEnum"
import { RootStoreType } from "./index"


/**
 * ExternalLayerSourceBase
 * auto generated base class for the model ExternalLayerSourceModel.
 */
export const ExternalLayerSourceModelBase = ModelBase
  .named('ExternalLayerSource')
  .props({
    __typename: types.optional(types.literal("ExternalLayerSource"), "ExternalLayerSource"),
    type: types.union(types.undefined, SourceTypeEnumType),
    details: types.union(types.undefined, types.late((): any => ExternalLayerDetailsModel)),
    status: types.union(types.undefined, ResourceResolutionStatusEnumType),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class ExternalLayerSourceModelSelector extends QueryBuilder {
  get type() { return this.__attr(`type`) }
  get status() { return this.__attr(`status`) }
  details(builder: string | ExternalLayerDetailsModelSelector | ((selector: ExternalLayerDetailsModelSelector) => ExternalLayerDetailsModelSelector) | undefined) { return this.__child(`details`, ExternalLayerDetailsModelSelector, builder) }
}
export function selectFromExternalLayerSource() {
  return new ExternalLayerSourceModelSelector()
}

export const externalLayerSourceModelPrimitives = selectFromExternalLayerSource().type.status
