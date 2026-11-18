/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { BasemapLayerModel, BasemapLayerModelType } from "./BasemapLayerModel"
import { BasemapLayerModelSelector } from "./BasemapLayerModel.base"
import { BasemapThumbnailModel, BasemapThumbnailModelType } from "./BasemapThumbnailModel"
import { BasemapThumbnailModelSelector } from "./BasemapThumbnailModel.base"
import { RootStoreType } from "./index"


/**
 * BasemapBase
 * auto generated base class for the model BasemapModel.
 */
export const BasemapModelBase = ModelBase
  .named('Basemap')
  .props({
    __typename: types.optional(types.literal("Basemap"), "Basemap"),
    name: types.union(types.undefined, types.string),
    thumbnail: types.union(types.undefined, types.late((): any => BasemapThumbnailModel)),
    isCurrent: types.union(types.undefined, types.boolean),
    isForPreview: types.union(types.undefined, types.boolean),
    layers: types.union(types.undefined, types.array(types.late((): any => BasemapLayerModel))),
    //id: types.union(types.undefined, types.string),
    id: types.identifier, //Alex change till proper deffs
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class BasemapModelSelector extends QueryBuilder {
  get name() { return this.__attr(`name`) }
  get isCurrent() { return this.__attr(`isCurrent`) }
  get isForPreview() { return this.__attr(`isForPreview`) }
  get id() { return this.__attr(`id`) }
  thumbnail(builder: string | BasemapThumbnailModelSelector | ((selector: BasemapThumbnailModelSelector) => BasemapThumbnailModelSelector) | undefined) { return this.__child(`thumbnail`, BasemapThumbnailModelSelector, builder) }
  layers(builder: string | BasemapLayerModelSelector | ((selector: BasemapLayerModelSelector) => BasemapLayerModelSelector) | undefined) { return this.__child(`layers`, BasemapLayerModelSelector, builder) }
}
export function selectFromBasemap() {
  return new BasemapModelSelector()
}

export const basemapModelPrimitives = selectFromBasemap().name.isCurrent.isForPreview
