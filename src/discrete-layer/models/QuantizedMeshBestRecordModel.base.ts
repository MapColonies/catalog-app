/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { LinkModel, LinkModelType } from "./LinkModel"
import { LinkModelSelector, linkModelPrimitives } from "./LinkModel.base"
import { ProductTypeEnumType } from "./ProductTypeEnum"
import { RecordStatusEnumType } from "./RecordStatusEnum"
import { RecordTypeEnumType } from "./RecordTypeEnum"
import { RootStoreType } from "./index"


/**
 * QuantizedMeshBestRecordBase
 * auto generated base class for the model QuantizedMeshBestRecordModel.
 */
export const QuantizedMeshBestRecordModelBase = ModelBase
  .named('QuantizedMeshBestRecord')
  .props({
    __typename: types.optional(types.literal("QuantizedMeshBestRecord"), "QuantizedMeshBestRecord"),
    type: types.union(types.undefined, types.null, RecordTypeEnumType),
    productId: types.union(types.undefined, types.null, types.string),
    productName: types.union(types.undefined, types.string),
    // ASSAF: MUST REMAIN STRING
    productVersion: types.union(types.undefined, types.null, types.string),
    productType: types.union(types.undefined, ProductTypeEnumType),
    description: types.union(types.undefined, types.null, types.string),
    creationDate: types.union(types.undefined, types.null, types.frozen()),
    updateDate: types.union(types.undefined, types.null, types.frozen()),
    sourceDateStart: types.union(types.undefined, types.frozen()),
    sourceDateEnd: types.union(types.undefined, types.frozen()),
    minResolutionMeter: types.union(types.undefined, types.null, types.number),
    maxResolutionMeter: types.union(types.undefined, types.null, types.number),
    maxAccuracyCE90: types.union(types.undefined, types.number),
    sensors: types.union(types.undefined, types.array(types.string)),
    footprint: types.union(types.undefined, types.frozen()),
    heightRangeFrom: types.union(types.undefined, types.null, types.number),
    heightRangeTo: types.union(types.undefined, types.null, types.number),
    srsId: types.union(types.undefined, types.string),
    srsName: types.union(types.undefined, types.string),
    region: types.union(types.undefined, types.array(types.string)),
    classification: types.union(types.undefined, types.string),
    productionSystem: types.union(types.undefined, types.string),
    productionSystemVer: types.union(types.undefined, types.string),
    producerName: types.union(types.undefined, types.string),
    geographicArea: types.union(types.undefined, types.null, types.string),
    productBoundingBox: types.union(types.undefined, types.null, types.string),
    productSource: types.union(types.undefined, types.null, types.string),
    productStatus: types.union(types.undefined, types.null, RecordStatusEnumType),
    //id: types.union(types.undefined, types.string),
    id: types.identifier, //Alex change till proper deffs
    insertDate: types.union(types.undefined, types.null, types.frozen()),
    wktGeometry: types.union(types.undefined, types.null, types.string),
    keywords: types.union(types.undefined, types.null, types.string),
    links: types.union(types.undefined, types.null, types.array(types.late((): any => LinkModel))),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class QuantizedMeshBestRecordModelSelector extends QueryBuilder {
  get type() { return this.__attr(`type`) }
  get productId() { return this.__attr(`productId`) }
  get productName() { return this.__attr(`productName`) }
  get productVersion() { return this.__attr(`productVersion`) }
  get productType() { return this.__attr(`productType`) }
  get description() { return this.__attr(`description`) }
  get creationDate() { return this.__attr(`creationDate`) }
  get updateDate() { return this.__attr(`updateDate`) }
  get sourceDateStart() { return this.__attr(`sourceDateStart`) }
  get sourceDateEnd() { return this.__attr(`sourceDateEnd`) }
  get minResolutionMeter() { return this.__attr(`minResolutionMeter`) }
  get maxResolutionMeter() { return this.__attr(`maxResolutionMeter`) }
  get maxAccuracyCE90() { return this.__attr(`maxAccuracyCE90`) }
  get sensors() { return this.__attr(`sensors`) }
  get footprint() { return this.__attr(`footprint`) }
  get heightRangeFrom() { return this.__attr(`heightRangeFrom`) }
  get heightRangeTo() { return this.__attr(`heightRangeTo`) }
  get srsId() { return this.__attr(`srsId`) }
  get srsName() { return this.__attr(`srsName`) }
  get region() { return this.__attr(`region`) }
  get classification() { return this.__attr(`classification`) }
  get productionSystem() { return this.__attr(`productionSystem`) }
  get productionSystemVer() { return this.__attr(`productionSystemVer`) }
  get producerName() { return this.__attr(`producerName`) }
  get geographicArea() { return this.__attr(`geographicArea`) }
  get productBoundingBox() { return this.__attr(`productBoundingBox`) }
  get productSource() { return this.__attr(`productSource`) }
  get productStatus() { return this.__attr(`productStatus`) }
  get id() { return this.__attr(`id`) }
  get insertDate() { return this.__attr(`insertDate`) }
  get wktGeometry() { return this.__attr(`wktGeometry`) }
  get keywords() { return this.__attr(`keywords`) }
  links(builder: string | LinkModelSelector | ((selector: LinkModelSelector) => LinkModelSelector) | undefined) { return this.__child(`links`, LinkModelSelector, builder) }
}
export function selectFromQuantizedMeshBestRecord() {
  return new QuantizedMeshBestRecordModelSelector()
}

export const quantizedMeshBestRecordModelPrimitives = selectFromQuantizedMeshBestRecord().type.productId.productName.productVersion.productType.description.creationDate.updateDate.sourceDateStart.sourceDateEnd.minResolutionMeter.maxResolutionMeter.maxAccuracyCE90.sensors.footprint.heightRangeFrom.heightRangeTo.srsId.srsName.region.classification.productionSystem.productionSystemVer.producerName.geographicArea.productBoundingBox.productSource.productStatus.insertDate.wktGeometry.keywords.id.links(linkModelPrimitives)
