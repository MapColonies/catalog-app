/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { RootStoreType } from "./index"


/**
 * BasemapThumbnailBase
 * auto generated base class for the model BasemapThumbnailModel.
 */
export const BasemapThumbnailModelBase = ModelBase
  .named('BasemapThumbnail')
  .props({
    __typename: types.optional(types.literal("BasemapThumbnail"), "BasemapThumbnail"),
    url: types.union(types.undefined, types.string),
    width: types.union(types.undefined, types.number),
    height: types.union(types.undefined, types.number),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class BasemapThumbnailModelSelector extends QueryBuilder {
  get url() { return this.__attr(`url`) }
  get width() { return this.__attr(`width`) }
  get height() { return this.__attr(`height`) }
}
export function selectFromBasemapThumbnail() {
  return new BasemapThumbnailModelSelector()
}

export const basemapThumbnailModelPrimitives = selectFromBasemapThumbnail().url.width.height
