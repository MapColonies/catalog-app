import { Instance } from "mobx-state-tree"
import { CswCatalogModelBase } from "./CswCatalogModel.base"

/* The TypeScript type of an instance of CswCatalogModel */
export interface CswCatalogModelType extends Instance<typeof CswCatalogModel.Type> {}

/* A graphql query fragment builders for CswCatalogModel */
export { selectFromCswCatalog, cswCatalogModelPrimitives, CswCatalogModelSelector } from "./CswCatalogModel.base"

/**
 * CswCatalogModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CswCatalogModel = CswCatalogModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
