/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { FieldFeatureTypeModel, FieldFeatureTypeModelType } from "./FieldFeatureTypeModel"
import { FieldFeatureTypeModelSelector, fieldFeatureTypeModelPrimitives } from "./FieldFeatureTypeModel.base"
import { RootStoreType } from "./index"


/**
 * VectorFeatureTypeStructureBase
 * auto generated base class for the model VectorFeatureTypeStructureModel.
 */
export const VectorFeatureTypeStructureModelBase = ModelBase
  .named('VectorFeatureTypeStructure')
  .props({
    __typename: types.optional(types.literal("VectorFeatureTypeStructure"), "VectorFeatureTypeStructure"),
    layerName: types.union(types.undefined, types.null, types.string),
    aliasLayerName: types.union(types.undefined, types.null, types.string),
    fields: types.union(types.undefined, types.null, types.array(types.late((): any => FieldFeatureTypeModel))),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class VectorFeatureTypeStructureModelSelector extends QueryBuilder {
  get layerName() { return this.__attr(`layerName`) }
  get aliasLayerName() { return this.__attr(`aliasLayerName`) }
  fields(builder: string | FieldFeatureTypeModelSelector | ((selector: FieldFeatureTypeModelSelector) => FieldFeatureTypeModelSelector) | undefined) { return this.__child(`fields`, FieldFeatureTypeModelSelector, builder) }
}
export function selectFromVectorFeatureTypeStructure() {
  return new VectorFeatureTypeStructureModelSelector()
}

export const vectorFeatureTypeStructureModelPrimitives = selectFromVectorFeatureTypeStructure().layerName.aliasLayerName.fields(fieldFeatureTypeModelPrimitives)
