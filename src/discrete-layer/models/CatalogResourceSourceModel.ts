import { Instance } from "mobx-state-tree"
import { CatalogResourceSourceModelBase } from "./CatalogResourceSourceModel.base"

/* The TypeScript type of an instance of CatalogResourceSourceModel */
export interface CatalogResourceSourceModelType extends Instance<typeof CatalogResourceSourceModel.Type> {}

/* A graphql query fragment builders for CatalogResourceSourceModel */
export { selectFromCatalogResourceSource, catalogResourceSourceModelPrimitives, CatalogResourceSourceModelSelector } from "./CatalogResourceSourceModel.base"

/**
 * CatalogResourceSourceModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CatalogResourceSourceModel = CatalogResourceSourceModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
