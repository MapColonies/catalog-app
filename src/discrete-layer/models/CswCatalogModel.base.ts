/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { IAnyModelType, types } from "mobx-state-tree"
import { MSTGQLRef, QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { CswQuerySummaryModel, CswQuerySummaryModelType } from "./CswQuerySummaryModel"
import { cswQuerySummaryModelPrimitives, CswQuerySummaryModelSelector } from "./CswQuerySummaryModel.base"
import { Layer3DRecordModel } from "./Layer3DRecordModel"
import { LayerDemRecordModel } from "./LayerDemRecordModel"
import { layerMetadataMixedModelPrimitives, LayerMetadataMixedModelSelector } from "./LayerMetadataMixedModelSelector"
import { LayerRasterRecordModel } from "./LayerRasterRecordModel"
import { QuantizedMeshBestRecordModel } from "./QuantizedMeshBestRecordModel"
import { VectorBestRecordModel } from "./VectorBestRecordModel"
import { RootStoreType } from "./index"


/**
 * CswCatalogBase
 * auto generated base class for the model CswCatalogModel.
 */
export const CswCatalogModelBase = ModelBase
  .named('CswCatalog')
  .props({
    __typename: types.optional(types.literal("CSWCatalog"), "CSWCatalog"),
    records: types.union(types.undefined, types.array(MSTGQLRef(types.union(types.late(() => Layer3DRecordModel), types.late(() => LayerRasterRecordModel), types.late(() => LayerDemRecordModel), types.late(() => VectorBestRecordModel), types.late(() => QuantizedMeshBestRecordModel)) as unknown as IAnyModelType))),
    cswQuerySummary: types.union(types.undefined, types.null, types.late((): any => CswQuerySummaryModel)),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class CswCatalogModelSelector extends QueryBuilder {
  records(builder?: string | LayerMetadataMixedModelSelector | ((selector: LayerMetadataMixedModelSelector) => LayerMetadataMixedModelSelector)) { return this.__child(`records`, LayerMetadataMixedModelSelector, builder) }
  cswQuerySummary(builder?: string | CswQuerySummaryModelSelector | ((selector: CswQuerySummaryModelSelector) => CswQuerySummaryModelSelector)) { return this.__child(`cswQuerySummary`, CswQuerySummaryModelSelector, builder) }
}
export function selectFromCswCatalog() {
  return new CswCatalogModelSelector()
}

export const cswCatalogModelPrimitives = selectFromCswCatalog().records(layerMetadataMixedModelPrimitives).cswQuerySummary(cswQuerySummaryModelPrimitives)
