/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { MSTGQLRef, QueryBuilder, withTypedRefs } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { CswQuerySummaryModel, CswQuerySummaryModelType } from "./CswQuerySummaryModel"
import { cswQuerySummaryModelPrimitives, CswQuerySummaryModelSelector } from "./CswQuerySummaryModel.base"
import { Layer3DRecordModel, Layer3DRecordModelType } from "./Layer3DRecordModel"
import { Layer3DRecordModelSelector } from "./Layer3DRecordModel.base"
import { LayerDemRecordModel, LayerDemRecordModelType } from "./LayerDemRecordModel"
import { LayerDemRecordModelSelector } from "./LayerDemRecordModel.base"
import { layerMetadataMixedModelPrimitives, LayerMetadataMixedModelSelector } from "./LayerMetadataMixedModelSelector"
import { LayerRasterRecordModel, LayerRasterRecordModelType } from "./LayerRasterRecordModel"
import { LayerRasterRecordModelSelector } from "./LayerRasterRecordModel.base"
import { QuantizedMeshBestRecordModel, QuantizedMeshBestRecordModelType } from "./QuantizedMeshBestRecordModel"
import { QuantizedMeshBestRecordModelSelector } from "./QuantizedMeshBestRecordModel.base"
import { VectorBestRecordModel, VectorBestRecordModelType } from "./VectorBestRecordModel"
import { VectorBestRecordModelSelector } from "./VectorBestRecordModel.base"
import { RootStoreType } from "./index"


/* The TypeScript type that explicits the refs to other models in order to prevent a circular refs issue */
type Refs = {
  Layer3DRecord: Layer3DRecordModelType;
  LayerRasterRecord: LayerRasterRecordModelType;
  LayerDemRecord: LayerDemRecordModelType;
  VectorBestRecord: VectorBestRecordModelType;
  QuantizedMeshBestRecord: QuantizedMeshBestRecordModelType;
}

/**
 * CswCatalogBase
 * auto generated base class for the model CswCatalogModel.
 */
export const CswCatalogModelBase = withTypedRefs<Refs>()(ModelBase
  .named('CswCatalog')
  .props({
    __typename: types.optional(types.literal("CSWCatalog"), "CSWCatalog"),
    records: types.union(types.undefined, types.array(types.union(MSTGQLRef(types.late((): any => Layer3DRecordModel)), MSTGQLRef(types.late((): any => LayerRasterRecordModel)), MSTGQLRef(types.late((): any => LayerDemRecordModel)), MSTGQLRef(types.late((): any => VectorBestRecordModel)), MSTGQLRef(types.late((): any => QuantizedMeshBestRecordModel))))),
    cswQuerySummary: types.union(types.undefined, types.null, types.late((): any => CswQuerySummaryModel)),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  })))

export class CswCatalogModelSelector extends QueryBuilder {
  records(builder: string | LayerMetadataMixedModelSelector | ((selector: LayerMetadataMixedModelSelector) => LayerMetadataMixedModelSelector) | undefined) { return this.__child(`records`, LayerMetadataMixedModelSelector, builder) }
  cswQuerySummary(builder: string | CswQuerySummaryModelSelector | ((selector: CswQuerySummaryModelSelector) => CswQuerySummaryModelSelector) | undefined) { return this.__child(`cswQuerySummary`, CswQuerySummaryModelSelector, builder) }
}
export function selectFromCswCatalog() {
  return new CswCatalogModelSelector()
}

export const cswCatalogModelPrimitives = selectFromCswCatalog().records(layerMetadataMixedModelPrimitives).cswQuerySummary(cswQuerySummaryModelPrimitives)
