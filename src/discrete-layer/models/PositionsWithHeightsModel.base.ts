/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { PositionWithHeightModel, PositionWithHeightModelType } from "./PositionWithHeightModel"
import { PositionWithHeightModelSelector } from "./PositionWithHeightModel.base"
import { RootStoreType } from "./index"


/**
 * PositionsWithHeightsBase
 * auto generated base class for the model PositionsWithHeightsModel.
 */
export const PositionsWithHeightsModelBase = ModelBase
  .named('PositionsWithHeights')
  .props({
    __typename: types.optional(types.literal("PositionsWithHeights"), "PositionsWithHeights"),
    data: types.union(types.undefined, types.array(types.late((): any => PositionWithHeightModel))),
    products: types.union(types.undefined, types.frozen()),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class PositionsWithHeightsModelSelector extends QueryBuilder {
  get products() { return this.__attr(`products`) }
  data(builder: string | PositionWithHeightModelSelector | ((selector: PositionWithHeightModelSelector) => PositionWithHeightModelSelector) | undefined) { return this.__child(`data`, PositionWithHeightModelSelector, builder) }
}
export function selectFromPositionsWithHeights() {
  return new PositionsWithHeightsModelSelector()
}

export const positionsWithHeightsModelPrimitives = selectFromPositionsWithHeights().products
