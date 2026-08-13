/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { RootStoreType } from "./index"


/**
 * GeojsonFeatureBase
 * auto generated base class for the model GeojsonFeatureModel.
 */
export const GeojsonFeatureModelBase = ModelBase
  .named('GeojsonFeature')
  .props({
    __typename: types.optional(types.literal("GeojsonFeature"), "GeojsonFeature"),
    type: types.union(types.undefined, types.string),
    geometry: types.union(types.undefined, types.frozen()),
    id: types.union(types.undefined, types.null, types.string),
    bbox: types.union(types.undefined, types.null, types.array(types.number)),
    properties: types.union(types.undefined, types.frozen()),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class GeojsonFeatureModelSelector extends QueryBuilder {
  get type() { return this.__attr(`type`) }
  get geometry() { return this.__attr(`geometry`) }
  get id() { return this.__attr(`id`) }
  get bbox() { return this.__attr(`bbox`) }
  get properties() { return this.__attr(`properties`) }
}
export function selectFromGeojsonFeature() {
  return new GeojsonFeatureModelSelector()
}

export const geojsonFeatureModelPrimitives = selectFromGeojsonFeature().type.geometry.bbox.properties
