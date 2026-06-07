/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { WfsFeatureModel, WfsFeatureModelType } from "./WfsFeatureModel"
import { WfsFeatureModelSelector } from "./WfsFeatureModel.base"
import { RootStoreType } from "./index"


/**
 * GetFeatureBase
 * auto generated base class for the model GetFeatureModel.
 */
export const GetFeatureModelBase = ModelBase
  .named('GetFeature')
  .props({
    __typename: types.optional(types.literal("GetFeature"), "GetFeature"),
    type: types.union(types.undefined, types.null, types.string),
    bbox: types.union(types.undefined, types.null, types.array(types.number)),
    features: types.union(types.undefined, types.null, types.array(types.late((): any => WfsFeatureModel))),
    totalFeatures: types.union(types.undefined, types.null, types.number),
    numberMatched: types.union(types.undefined, types.null, types.number),
    numberReturned: types.union(types.undefined, types.null, types.number),
    timeStamp: types.union(types.undefined, types.null, types.string),
    crs: types.union(types.undefined, types.null, types.frozen()),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class GetFeatureModelSelector extends QueryBuilder {
  get type() { return this.__attr(`type`) }
  get bbox() { return this.__attr(`bbox`) }
  get totalFeatures() { return this.__attr(`totalFeatures`) }
  get numberMatched() { return this.__attr(`numberMatched`) }
  get numberReturned() { return this.__attr(`numberReturned`) }
  get timeStamp() { return this.__attr(`timeStamp`) }
  get crs() { return this.__attr(`crs`) }
  features(builder?: string | WfsFeatureModelSelector | ((selector: WfsFeatureModelSelector) => WfsFeatureModelSelector)) { return this.__child(`features`, WfsFeatureModelSelector, builder) }
}
export function selectFromGetFeature() {
  return new GetFeatureModelSelector()
}

export const getFeatureModelPrimitives = selectFromGetFeature().features(selector => selector.geometry.id.properties.type).type.bbox.totalFeatures.numberMatched.numberReturned.timeStamp.crs
