/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { MSTGQLRef, QueryBuilder, withTypedRefs } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { CapabilityModel, CapabilityModelType } from "./CapabilityModel"
import { CapabilityModelSelector } from "./CapabilityModel.base"
import { DomainEnumType } from "./DomainEnum"
import { LayerRasterRecordModel, LayerRasterRecordModelType } from "./LayerRasterRecordModel"
import { LayerRasterRecordModelSelector } from "./LayerRasterRecordModel.base"
import { RasterUniquenessModel, RasterUniquenessModelType } from "./RasterUniquenessModel"
import { RasterUniquenessModelSelector } from "./RasterUniquenessModel.base"
import { ResourceResolutionStatusEnumType } from "./ResourceResolutionStatusEnum"
import { SourceTypeEnumType } from "./SourceTypeEnum"
import { RootStoreType } from "./index"


/* The TypeScript type that explicits the refs to other models in order to prevent a circular refs issue */
type Refs = {
  layer: LayerRasterRecordModelType;
}

/**
 * CatalogResourceSourceBase
 * auto generated base class for the model CatalogResourceSourceModel.
 */
export const CatalogResourceSourceModelBase = withTypedRefs<Refs>()(ModelBase
  .named('CatalogResourceSource')
  .props({
    __typename: types.optional(types.literal("CatalogResourceSource"), "CatalogResourceSource"),
    type: types.union(types.undefined, SourceTypeEnumType),
    domain: types.union(types.undefined, DomainEnumType),
    uniqueness: types.union(types.undefined, types.late((): any => RasterUniquenessModel)),
    status: types.union(types.undefined, ResourceResolutionStatusEnumType),
    layer: types.union(types.undefined, types.null, MSTGQLRef(types.late((): any => LayerRasterRecordModel))),
    capabilities: types.union(types.undefined, types.null, types.late((): any => CapabilityModel)),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  })))

export class CatalogResourceSourceModelSelector extends QueryBuilder {
  get type() { return this.__attr(`type`) }
  get domain() { return this.__attr(`domain`) }
  get status() { return this.__attr(`status`) }
  uniqueness(builder: string | RasterUniquenessModelSelector | ((selector: RasterUniquenessModelSelector) => RasterUniquenessModelSelector) | undefined) { return this.__child(`uniqueness`, RasterUniquenessModelSelector, builder) }
  layer(builder: string | LayerRasterRecordModelSelector | ((selector: LayerRasterRecordModelSelector) => LayerRasterRecordModelSelector) | undefined) { return this.__child(`layer`, LayerRasterRecordModelSelector, builder) }
  capabilities(builder: string | CapabilityModelSelector | ((selector: CapabilityModelSelector) => CapabilityModelSelector) | undefined) { return this.__child(`capabilities`, CapabilityModelSelector, builder) }
}
export function selectFromCatalogResourceSource() {
  return new CatalogResourceSourceModelSelector()
}

export const catalogResourceSourceModelPrimitives = selectFromCatalogResourceSource().type.domain.status
