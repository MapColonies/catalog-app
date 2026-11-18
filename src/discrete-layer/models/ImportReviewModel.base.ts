/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { ImportReviewLayerModel, ImportReviewLayerModelType } from "./ImportReviewLayerModel"
import { ImportReviewLayerModelSelector } from "./ImportReviewLayerModel.base"
import { ImportReviewRoleConflictModel, ImportReviewRoleConflictModelType } from "./ImportReviewRoleConflictModel"
import { ImportReviewRoleConflictModelSelector } from "./ImportReviewRoleConflictModel.base"
import { ImportReviewThumbnailModel, ImportReviewThumbnailModelType } from "./ImportReviewThumbnailModel"
import { ImportReviewThumbnailModelSelector } from "./ImportReviewThumbnailModel.base"
import { RootStoreType } from "./index"


/**
 * ImportReviewBase
 * auto generated base class for the model ImportReviewModel.
 */
export const ImportReviewModelBase = ModelBase
  .named('ImportReview')
  .props({
    __typename: types.optional(types.literal("ImportReview"), "ImportReview"),
    name: types.union(types.undefined, types.string),
    isCurrent: types.union(types.undefined, types.boolean),
    isForPreview: types.union(types.undefined, types.boolean),
    currentRoleConflict: types.union(types.undefined, types.null, types.late((): any => ImportReviewRoleConflictModel)),
    previewRoleConflict: types.union(types.undefined, types.null, types.late((): any => ImportReviewRoleConflictModel)),
    thumbnail: types.union(types.undefined, types.late((): any => ImportReviewThumbnailModel)),
    layers: types.union(types.undefined, types.array(types.late((): any => ImportReviewLayerModel))),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class ImportReviewModelSelector extends QueryBuilder {
  get name() { return this.__attr(`name`) }
  get isCurrent() { return this.__attr(`isCurrent`) }
  get isForPreview() { return this.__attr(`isForPreview`) }
  currentRoleConflict(builder: string | ImportReviewRoleConflictModelSelector | ((selector: ImportReviewRoleConflictModelSelector) => ImportReviewRoleConflictModelSelector) | undefined) { return this.__child(`currentRoleConflict`, ImportReviewRoleConflictModelSelector, builder) }
  previewRoleConflict(builder: string | ImportReviewRoleConflictModelSelector | ((selector: ImportReviewRoleConflictModelSelector) => ImportReviewRoleConflictModelSelector) | undefined) { return this.__child(`previewRoleConflict`, ImportReviewRoleConflictModelSelector, builder) }
  thumbnail(builder: string | ImportReviewThumbnailModelSelector | ((selector: ImportReviewThumbnailModelSelector) => ImportReviewThumbnailModelSelector) | undefined) { return this.__child(`thumbnail`, ImportReviewThumbnailModelSelector, builder) }
  layers(builder: string | ImportReviewLayerModelSelector | ((selector: ImportReviewLayerModelSelector) => ImportReviewLayerModelSelector) | undefined) { return this.__child(`layers`, ImportReviewLayerModelSelector, builder) }
}
export function selectFromImportReview() {
  return new ImportReviewModelSelector()
}

export const importReviewModelPrimitives = selectFromImportReview().name.isCurrent.isForPreview
