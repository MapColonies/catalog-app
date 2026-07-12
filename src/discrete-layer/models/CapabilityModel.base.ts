/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { ResourceUrlModel, ResourceUrlModelType } from "./ResourceUrlModel"
import { ResourceUrlModelSelector, resourceUrlModelPrimitives } from "./ResourceUrlModel.base"
import { StyleModel, StyleModelType } from "./StyleModel"
import { StyleModelSelector, styleModelPrimitives } from "./StyleModel.base"
import { TileMatrixSetModel, TileMatrixSetModelType } from "./TileMatrixSetModel"
import { TileMatrixSetModelSelector, tileMatrixSetModelPrimitives } from "./TileMatrixSetModel.base"
import { RootStoreType } from "./index"


/**
 * CapabilityBase
 * auto generated base class for the model CapabilityModel.
 */
export const CapabilityModelBase = ModelBase
  .named('Capability')
  .props({
    __typename: types.optional(types.literal("Capability"), "Capability"),
    //id: types.union(types.undefined, types.string),
    id: types.identifier, //Alex change till proper deffs
    style: types.union(types.undefined, types.array(types.late((): any => StyleModel))),
    format: types.union(types.undefined, types.array(types.string)),
    tileMatrixSet: types.union(types.undefined, types.array(types.late((): any => TileMatrixSetModel))),
    url: types.union(types.undefined, types.array(types.late((): any => ResourceUrlModel))),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class CapabilityModelSelector extends QueryBuilder {
  get id() { return this.__attr(`id`) }
  get format() { return this.__attr(`format`) }
  style(builder: string | StyleModelSelector | ((selector: StyleModelSelector) => StyleModelSelector) | undefined) { return this.__child(`style`, StyleModelSelector, builder) }
  tileMatrixSet(builder: string | TileMatrixSetModelSelector | ((selector: TileMatrixSetModelSelector) => TileMatrixSetModelSelector) | undefined) { return this.__child(`tileMatrixSet`, TileMatrixSetModelSelector, builder) }
  url(builder: string | ResourceUrlModelSelector | ((selector: ResourceUrlModelSelector) => ResourceUrlModelSelector) | undefined) { return this.__child(`url`, ResourceUrlModelSelector, builder) }
}
export function selectFromCapability() {
  return new CapabilityModelSelector()
}

export const capabilityModelPrimitives = selectFromCapability().format.id.style(styleModelPrimitives).tileMatrixSet(tileMatrixSetModelPrimitives).url(resourceUrlModelPrimitives)
