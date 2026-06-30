/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { LinkModel, LinkModelType } from "./LinkModel"
import { LinkModelSelector, linkModelPrimitives } from "./LinkModel.base"
import { ProductTypeEnumType } from "./ProductTypeEnum"
import { RecordTypeEnumType } from "./RecordTypeEnum"
import { VectorFeatureTypeStructureModel, VectorFeatureTypeStructureModelType } from "./VectorFeatureTypeStructureModel"
import { vectorFeatureTypeStructureModelPrimitives, VectorFeatureTypeStructureModelSelector } from "./VectorFeatureTypeStructureModel.base"
import { RootStoreType } from "./index"


/**
 * VectorBestRecordBase
 * auto generated base class for the model VectorBestRecordModel.
 */
export const VectorBestRecordModelBase = ModelBase
  .named('VectorBestRecord')
  .props({
    __typename: types.optional(types.literal("VectorBestRecord"), "VectorBestRecord"),
    // id: types.union(types.undefined, types.string),
    id: types.identifier,
    keywords: types.union(types.undefined, types.null, types.string),
    links: types.union(types.undefined, types.null, types.array(types.late((): any => LinkModel))),
    type: types.union(types.undefined, types.null, RecordTypeEnumType),
    classification: types.union(types.undefined, types.string),
    productName: types.union(types.undefined, types.string),
    description: types.union(types.undefined, types.null, types.string),
    srsId: types.union(types.undefined, types.string),
    producerName: types.union(types.undefined, types.string),
    productType: types.union(types.undefined, ProductTypeEnumType),
    srsName: types.union(types.undefined, types.string),
    footprint: types.union(types.undefined, types.frozen()),
    featureStructure: types.union(types.undefined, types.late((): any => VectorFeatureTypeStructureModel)),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class VectorBestRecordModelSelector extends QueryBuilder {
  get id() { return this.__attr(`id`) }
  get keywords() { return this.__attr(`keywords`) }
  get type() { return this.__attr(`type`) }
  get classification() { return this.__attr(`classification`) }
  get productName() { return this.__attr(`productName`) }
  get description() { return this.__attr(`description`) }
  get srsId() { return this.__attr(`srsId`) }
  get producerName() { return this.__attr(`producerName`) }
  get productType() { return this.__attr(`productType`) }
  get srsName() { return this.__attr(`srsName`) }
  get footprint() { return this.__attr(`footprint`) }
  links(builder: string | LinkModelSelector | ((selector: LinkModelSelector) => LinkModelSelector) | undefined) { return this.__child(`links`, LinkModelSelector, builder) }
  featureStructure(builder: string | VectorFeatureTypeStructureModelSelector | ((selector: VectorFeatureTypeStructureModelSelector) => VectorFeatureTypeStructureModelSelector) | undefined) { return this.__child(`featureStructure`, VectorFeatureTypeStructureModelSelector, builder) }
}
export function selectFromVectorBestRecord() {
  return new VectorBestRecordModelSelector()
}

export const vectorBestRecordModelPrimitives = selectFromVectorBestRecord().keywords.type.classification.productName.description.srsId.producerName.productType.srsName.footprint.links(linkModelPrimitives).featureStructure(vectorFeatureTypeStructureModelPrimitives)
