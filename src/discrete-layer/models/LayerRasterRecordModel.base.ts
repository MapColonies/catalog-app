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
import { TransparencyEnumType } from "./TransparencyEnum"
import { RootStoreType } from "./index"


/**
 * LayerRasterRecordBase
 * auto generated base class for the model LayerRasterRecordModel.
 */
export const LayerRasterRecordModelBase = ModelBase
  .named('LayerRasterRecord')
  .props({
    __typename: types.optional(types.literal("LayerRasterRecord"), "LayerRasterRecord"),
    //id: types.union(types.undefined, types.string),
    id: types.identifier, //Alex change till proper deffs
    type: types.union(types.undefined, types.null, RecordTypeEnumType),
    classification: types.union(types.undefined, types.string),
    productName: types.union(types.undefined, types.string),
    description: types.union(types.undefined, types.null, types.string),
    srs: types.union(types.undefined, types.string),
    producerName: types.union(types.undefined, types.string),
    creationDateUTC: types.union(types.undefined, types.null, types.frozen()),
    ingestionDate: types.union(types.undefined, types.null, types.frozen()),
    updateDateUTC: types.union(types.undefined, types.null, types.frozen()),
    imagingTimeBeginUTC: types.union(types.undefined, types.frozen()),
    imagingTimeEndUTC: types.union(types.undefined, types.frozen()),
    maxHorizontalAccuracyCE90: types.union(types.undefined, types.number),
    minHorizontalAccuracyCE90: types.union(types.undefined, types.null, types.number),
    sensors: types.union(types.undefined, types.array(types.string)),
    region: types.union(types.undefined, types.array(types.string)),
    productId: types.union(types.undefined, types.null, types.string),
    productVersion: types.union(types.undefined, types.null, types.string),
    productType: types.union(types.undefined, ProductTypeEnumType),
    productSubType: types.union(types.undefined, types.null, types.string),
    srsName: types.union(types.undefined, types.string),
    maxResolutionDeg: types.union(types.undefined, types.null, types.number),
    minResolutionDeg: types.union(types.undefined, types.number),
    maxResolutionMeter: types.union(types.undefined, types.null, types.number),
    minResolutionMeter: types.union(types.undefined, types.null, types.number),
    rms: types.union(types.undefined, types.null, types.number),
    scale: types.union(types.undefined, types.null, types.number),
    footprint: types.union(types.undefined, types.frozen()),
    productBoundingBox: types.union(types.undefined, types.null, types.string),
    productStatus: types.union(types.undefined, types.null, RecordStatusEnumType),
    transparency: types.union(types.undefined, TransparencyEnumType),
    insertDate: types.union(types.undefined, types.null, types.frozen()),
    keywords: types.union(types.undefined, types.null, types.string),
    links: types.union(types.undefined, types.null, types.array(types.late((): any => LinkModel))),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class LayerRasterRecordModelSelector extends QueryBuilder {
  get id() { return this.__attr(`id`) }
  get type() { return this.__attr(`type`) }
  get classification() { return this.__attr(`classification`) }
  get productName() { return this.__attr(`productName`) }
  get description() { return this.__attr(`description`) }
  get srs() { return this.__attr(`srs`) }
  get producerName() { return this.__attr(`producerName`) }
  get creationDateUTC() { return this.__attr(`creationDateUTC`) }
  get ingestionDate() { return this.__attr(`ingestionDate`) }
  get updateDateUTC() { return this.__attr(`updateDateUTC`) }
  get imagingTimeBeginUTC() { return this.__attr(`imagingTimeBeginUTC`) }
  get imagingTimeEndUTC() { return this.__attr(`imagingTimeEndUTC`) }
  get maxHorizontalAccuracyCE90() { return this.__attr(`maxHorizontalAccuracyCE90`) }
  get minHorizontalAccuracyCE90() { return this.__attr(`minHorizontalAccuracyCE90`) }
  get sensors() { return this.__attr(`sensors`) }
  get region() { return this.__attr(`region`) }
  get productId() { return this.__attr(`productId`) }
  get productVersion() { return this.__attr(`productVersion`) }
  get productType() { return this.__attr(`productType`) }
  get productSubType() { return this.__attr(`productSubType`) }
  get srsName() { return this.__attr(`srsName`) }
  get maxResolutionDeg() { return this.__attr(`maxResolutionDeg`) }
  get minResolutionDeg() { return this.__attr(`minResolutionDeg`) }
  get maxResolutionMeter() { return this.__attr(`maxResolutionMeter`) }
  get minResolutionMeter() { return this.__attr(`minResolutionMeter`) }
  get rms() { return this.__attr(`rms`) }
  get scale() { return this.__attr(`scale`) }
  get footprint() { return this.__attr(`footprint`) }
  get productBoundingBox() { return this.__attr(`productBoundingBox`) }
  get productStatus() { return this.__attr(`productStatus`) }
  get transparency() { return this.__attr(`transparency`) }
  get insertDate() { return this.__attr(`insertDate`) }
  get keywords() { return this.__attr(`keywords`) }
  links(builder: string | LinkModelSelector | ((selector: LinkModelSelector) => LinkModelSelector) | undefined) { return this.__child(`links`, LinkModelSelector, builder) }
}
export function selectFromLayerRasterRecord() {
  return new LayerRasterRecordModelSelector()
}

export const layerRasterRecordModelPrimitives = selectFromLayerRasterRecord().type.classification.productName.description.srs.producerName.creationDateUTC.ingestionDate.updateDateUTC.imagingTimeBeginUTC.imagingTimeEndUTC.maxHorizontalAccuracyCE90.minHorizontalAccuracyCE90.sensors.region.productId.productVersion.productType.productSubType.srsName.maxResolutionDeg.minResolutionDeg.maxResolutionMeter.minResolutionMeter.rms.scale.footprint.productBoundingBox.productStatus.transparency.insertDate.keywords.id.links(linkModelPrimitives)
