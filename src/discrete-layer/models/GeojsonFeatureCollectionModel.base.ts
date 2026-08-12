/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { GeojsonFeatureModel, GeojsonFeatureModelType } from "./GeojsonFeatureModel"
import { GeojsonFeatureModelSelector, geojsonFeatureModelPrimitives } from "./GeojsonFeatureModel.base"
import { RootStoreType } from "./index"


/**
 * GeojsonFeatureCollectionBase
 * auto generated base class for the model GeojsonFeatureCollectionModel.
 */
export const GeojsonFeatureCollectionModelBase = ModelBase
  .named('GeojsonFeatureCollection')
  .props({
    __typename: types.optional(types.literal("GeojsonFeatureCollection"), "GeojsonFeatureCollection"),
    type: types.union(types.undefined, types.string),
    features: types.union(types.undefined, types.array(types.late((): any => GeojsonFeatureModel))),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class GeojsonFeatureCollectionModelSelector extends QueryBuilder {
  get type() { return this.__attr(`type`) }
  features(builder: string | GeojsonFeatureModelSelector | ((selector: GeojsonFeatureModelSelector) => GeojsonFeatureModelSelector) | undefined) { return this.__child(`features`, GeojsonFeatureModelSelector, builder) }
}
export function selectFromGeojsonFeatureCollection() {
  return new GeojsonFeatureCollectionModelSelector()
}

export const geojsonFeatureCollectionModelPrimitives = selectFromGeojsonFeatureCollection().type.features(geojsonFeatureModelPrimitives)
