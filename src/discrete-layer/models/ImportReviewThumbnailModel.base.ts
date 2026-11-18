/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { RootStoreType } from "./index"


/**
 * ImportReviewThumbnailBase
 * auto generated base class for the model ImportReviewThumbnailModel.
 */
export const ImportReviewThumbnailModelBase = ModelBase
  .named('ImportReviewThumbnail')
  .props({
    __typename: types.optional(types.literal("ImportReviewThumbnail"), "ImportReviewThumbnail"),
    included: types.union(types.undefined, types.boolean),
    width: types.union(types.undefined, types.null, types.integer),
    height: types.union(types.undefined, types.null, types.integer),
    mimeType: types.union(types.undefined, types.null, types.string),
    dataBase64: types.union(types.undefined, types.null, types.string),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class ImportReviewThumbnailModelSelector extends QueryBuilder {
  get included() { return this.__attr(`included`) }
  get width() { return this.__attr(`width`) }
  get height() { return this.__attr(`height`) }
  get mimeType() { return this.__attr(`mimeType`) }
  get dataBase64() { return this.__attr(`dataBase64`) }
}
export function selectFromImportReviewThumbnail() {
  return new ImportReviewThumbnailModelSelector()
}

export const importReviewThumbnailModelPrimitives = selectFromImportReviewThumbnail().included.width.height.mimeType.dataBase64
