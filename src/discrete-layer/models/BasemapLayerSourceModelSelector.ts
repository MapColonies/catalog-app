/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { QueryBuilder } from "mst-gql"
import { CatalogResourceSourceModelType } from "./CatalogResourceSourceModel"
import { CatalogResourceSourceModelSelector, catalogResourceSourceModelPrimitives } from "./CatalogResourceSourceModel.base"
import { ExternalLayerSourceModelType } from "./ExternalLayerSourceModel"
import { ExternalLayerSourceModelSelector, externalLayerSourceModelPrimitives } from "./ExternalLayerSourceModel.base"

export type BasemapLayerSourceUnion = CatalogResourceSourceModelType | ExternalLayerSourceModelType

export class BasemapLayerSourceModelSelector extends QueryBuilder {
  catalogResourceSource(builder?: string | CatalogResourceSourceModelSelector | ((selector: CatalogResourceSourceModelSelector) => CatalogResourceSourceModelSelector)) { return this.__inlineFragment(`CatalogResourceSource`, CatalogResourceSourceModelSelector, builder) }
  externalLayerSource(builder?: string | ExternalLayerSourceModelSelector | ((selector: ExternalLayerSourceModelSelector) => ExternalLayerSourceModelSelector)) { return this.__inlineFragment(`ExternalLayerSource`, ExternalLayerSourceModelSelector, builder) }
}
export function selectFromBasemapLayerSource() {
  return new BasemapLayerSourceModelSelector()
}

// provides all primitive fields of union member types combined together
export const basemapLayerSourceModelPrimitives = selectFromBasemapLayerSource().catalogResourceSource(catalogResourceSourceModelPrimitives).externalLayerSource(externalLayerSourceModelPrimitives)