/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { CswCatalogModel, CswCatalogModelType } from "./CswCatalogModel"
import { cswCatalogModelPrimitives, CswCatalogModelSelector } from "./CswCatalogModel.base"
import { RootStoreType } from "./index"


/**
 * CswCatalogsBase
 * auto generated base class for the model CswCatalogsModel.
 */
export const CswCatalogsModelBase = ModelBase
  .named('CswCatalogs')
  .props({
    __typename: types.optional(types.literal("CSWCatalogs"), "CSWCatalogs"),
    _RASTER: types.union(types.undefined, types.null, types.late((): any => CswCatalogModel)),
    _DEM: types.union(types.undefined, types.null, types.late((): any => CswCatalogModel)),
    _VECTOR: types.union(types.undefined, types.null, types.late((): any => CswCatalogModel)),
    _3D: types.union(types.undefined, types.null, types.late((): any => CswCatalogModel)),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class CswCatalogsModelSelector extends QueryBuilder {
  _RASTER(builder?: string | CswCatalogModelSelector | ((selector: CswCatalogModelSelector) => CswCatalogModelSelector)) { return this.__child(`_RASTER`, CswCatalogModelSelector, builder) }
  _DEM(builder?: string | CswCatalogModelSelector | ((selector: CswCatalogModelSelector) => CswCatalogModelSelector)) { return this.__child(`_DEM`, CswCatalogModelSelector, builder) }
  _VECTOR(builder?: string | CswCatalogModelSelector | ((selector: CswCatalogModelSelector) => CswCatalogModelSelector)) { return this.__child(`_VECTOR`, CswCatalogModelSelector, builder) }
  _3D(builder?: string | CswCatalogModelSelector | ((selector: CswCatalogModelSelector) => CswCatalogModelSelector)) { return this.__child(`_3D`, CswCatalogModelSelector, builder) }
}
export function selectFromCswCatalogs() {
  return new CswCatalogsModelSelector()
}

export const cswCatalogsModelPrimitives = selectFromCswCatalogs()._RASTER(cswCatalogModelPrimitives)._3D(cswCatalogModelPrimitives)._DEM(cswCatalogModelPrimitives)._VECTOR(cswCatalogModelPrimitives)
