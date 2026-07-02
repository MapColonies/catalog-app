/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { DemDataTypeEnumType } from "./DemDataTypeEnum"
import { LinkModel, LinkModelType } from "./LinkModel"
import { LinkModelSelector, linkModelPrimitives } from "./LinkModel.base"
import { NoDataValueEnumType } from "./NoDataValueEnum"
import { ProductTypeEnumType } from "./ProductTypeEnum"
import { RecordStatusEnumType } from "./RecordStatusEnum"
import { RecordTypeEnumType } from "./RecordTypeEnum"
import { UndulationModelEnumType } from "./UndulationModelEnum"
import { RootStoreType } from "./index"


/**
 * LayerDemRecordBase
 * auto generated base class for the model LayerDemRecordModel.
 */
export const LayerDemRecordModelBase = ModelBase
  .named('LayerDemRecord')
  .props({
    __typename: types.optional(types.literal("LayerDemRecord"), "LayerDemRecord"),
    type: types.union(types.undefined, types.null, RecordTypeEnumType),
    classification: types.union(types.undefined, types.string),
    productName: types.union(types.undefined, types.string),
    description: types.union(types.undefined, types.null, types.string),
    srsId: types.union(types.undefined, types.string),
    srsName: types.union(types.undefined, types.string),
    producerName: types.union(types.undefined, types.string),
    updateDate: types.union(types.undefined, types.null, types.frozen()),
    sourceDateStart: types.union(types.undefined, types.frozen()),
    sourceDateEnd: types.union(types.undefined, types.frozen()),
    sensors: types.union(types.undefined, types.array(types.string)),
    region: types.union(types.undefined, types.array(types.string)),
    productId: types.union(types.undefined, types.null, types.string),
    productType: types.union(types.undefined, ProductTypeEnumType),
    footprint: types.union(types.undefined, types.frozen()),
    absoluteAccuracyLEP90: types.union(types.undefined, types.number),
    relativeAccuracyLEP90: types.union(types.undefined, types.null, types.number),
    resolutionDegree: types.union(types.undefined, types.null, types.number),
    resolutionMeter: types.union(types.undefined, types.number),
    imagingSortieAccuracyCEP90: types.union(types.undefined, types.null, types.number),
    layerPolygonParts: types.union(types.undefined, types.null, types.frozen()),
    productBoundingBox: types.union(types.undefined, types.null, types.string),
    heightRangeFrom: types.union(types.undefined, types.null, types.number),
    heightRangeTo: types.union(types.undefined, types.null, types.number),
    geographicArea: types.union(types.undefined, types.null, types.string),
    undulationModel: types.union(types.undefined, UndulationModelEnumType),
    dataType: types.union(types.undefined, DemDataTypeEnumType),
    noDataValue: types.union(types.undefined, NoDataValueEnumType),
    productStatus: types.union(types.undefined, types.null, RecordStatusEnumType),
    hasTerrain: types.union(types.undefined, types.null, types.boolean),
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

export class LayerDemRecordModelSelector extends QueryBuilder {
  get type() { return this.__attr(`type`) }
  get classification() { return this.__attr(`classification`) }
  get productName() { return this.__attr(`productName`) }
  get description() { return this.__attr(`description`) }
  get srsId() { return this.__attr(`srsId`) }
  get srsName() { return this.__attr(`srsName`) }
  get producerName() { return this.__attr(`producerName`) }
  get updateDate() { return this.__attr(`updateDate`) }
  get sourceDateStart() { return this.__attr(`sourceDateStart`) }
  get sourceDateEnd() { return this.__attr(`sourceDateEnd`) }
  get sensors() { return this.__attr(`sensors`) }
  get region() { return this.__attr(`region`) }
  get productId() { return this.__attr(`productId`) }
  get productType() { return this.__attr(`productType`) }
  get footprint() { return this.__attr(`footprint`) }
  get absoluteAccuracyLEP90() { return this.__attr(`absoluteAccuracyLEP90`) }
  get relativeAccuracyLEP90() { return this.__attr(`relativeAccuracyLEP90`) }
  get resolutionDegree() { return this.__attr(`resolutionDegree`) }
  get resolutionMeter() { return this.__attr(`resolutionMeter`) }
  get imagingSortieAccuracyCEP90() { return this.__attr(`imagingSortieAccuracyCEP90`) }
  get layerPolygonParts() { return this.__attr(`layerPolygonParts`) }
  get productBoundingBox() { return this.__attr(`productBoundingBox`) }
  get heightRangeFrom() { return this.__attr(`heightRangeFrom`) }
  get heightRangeTo() { return this.__attr(`heightRangeTo`) }
  get geographicArea() { return this.__attr(`geographicArea`) }
  get undulationModel() { return this.__attr(`undulationModel`) }
  get dataType() { return this.__attr(`dataType`) }
  get noDataValue() { return this.__attr(`noDataValue`) }
  get productStatus() { return this.__attr(`productStatus`) }
  get hasTerrain() { return this.__attr(`hasTerrain`) }
  get id() { return this.__attr(`id`) }
  get insertDate() { return this.__attr(`insertDate`) }
  get wktGeometry() { return this.__attr(`wktGeometry`) }
  get keywords() { return this.__attr(`keywords`) }
  links(builder: string | LinkModelSelector | ((selector: LinkModelSelector) => LinkModelSelector) | undefined) { return this.__child(`links`, LinkModelSelector, builder) }
}
export function selectFromLayerDemRecord() {
  return new LayerDemRecordModelSelector()
}

export const layerDemRecordModelPrimitives = selectFromLayerDemRecord().type.classification.productName.description.srsId.srsName.producerName.updateDate.sourceDateStart.sourceDateEnd.sensors.region.productId.productType.footprint.absoluteAccuracyLEP90.relativeAccuracyLEP90.resolutionDegree.resolutionMeter.imagingSortieAccuracyCEP90.layerPolygonParts.productBoundingBox.heightRangeFrom.heightRangeTo.geographicArea.undulationModel.dataType.noDataValue.productStatus.hasTerrain.insertDate.wktGeometry.keywords.id.links(linkModelPrimitives)
