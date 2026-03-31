import { Instance } from "mobx-state-tree"
import { CswCatalogsModelBase } from "./CswCatalogsModel.base"

/* The TypeScript type of an instance of CswCatalogsModel */
export interface CswCatalogsModelType extends Instance<typeof CswCatalogsModel.Type> {}

/* A graphql query fragment builders for CswCatalogsModel */
export { selectFromCswCatalogs, cswCatalogsModelPrimitives, CswCatalogsModelSelector } from "./CswCatalogsModel.base"

/**
 * CswCatalogsModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CswCatalogsModel = CswCatalogsModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
