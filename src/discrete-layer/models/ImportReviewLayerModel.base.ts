/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { BasemapLayerSourceModelSelector } from "./BasemapLayerSourceModelSelector"
import { CatalogResourceSourceModel, CatalogResourceSourceModelType } from "./CatalogResourceSourceModel"
import { CatalogResourceSourceModelSelector } from "./CatalogResourceSourceModel.base"
import { ExternalLayerSourceModel, ExternalLayerSourceModelType } from "./ExternalLayerSourceModel"
import { ExternalLayerSourceModelSelector } from "./ExternalLayerSourceModel.base"
import { RootStoreType } from "./index"


/**
 * ImportReviewLayerBase
 * auto generated base class for the model ImportReviewLayerModel.
 */
export const ImportReviewLayerModelBase = ModelBase
  .named('ImportReviewLayer')
  .props({
    __typename: types.optional(types.literal("ImportReviewLayer"), "ImportReviewLayer"),
    id: types.union(types.undefined, types.string),
    order: types.union(types.undefined, types.integer),
    opacity: types.union(types.undefined, types.number),
    shouldBeUsedInModelDraping: types.union(types.undefined, types.null, types.boolean),
    source: types.union(types.undefined, types.union(types.late((): any => CatalogResourceSourceModel), types.late((): any => ExternalLayerSourceModel))),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class ImportReviewLayerModelSelector extends QueryBuilder {
  get id() { return this.__attr(`id`) }
  get order() { return this.__attr(`order`) }
  get opacity() { return this.__attr(`opacity`) }
  get shouldBeUsedInModelDraping() { return this.__attr(`shouldBeUsedInModelDraping`) }
  source(builder: string | BasemapLayerSourceModelSelector | ((selector: BasemapLayerSourceModelSelector) => BasemapLayerSourceModelSelector) | undefined) { return this.__child(`source`, BasemapLayerSourceModelSelector, builder) }
}
export function selectFromImportReviewLayer() {
  return new ImportReviewLayerModelSelector()
}

export const importReviewLayerModelPrimitives = selectFromImportReviewLayer().order.opacity.shouldBeUsedInModelDraping
