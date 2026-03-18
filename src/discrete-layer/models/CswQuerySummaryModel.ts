import { Instance } from "mobx-state-tree"
import { CswQuerySummaryModelBase } from "./CswQuerySummaryModel.base"

/* The TypeScript type of an instance of CswQuerySummaryModel */
export interface CswQuerySummaryModelType extends Instance<typeof CswQuerySummaryModel.Type> {}

/* A graphql query fragment builders for CswQuerySummaryModel */
export { selectFromCswQuerySummary, cswQuerySummaryModelPrimitives, CswQuerySummaryModelSelector } from "./CswQuerySummaryModel.base"

/**
 * CswQuerySummaryModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CswQuerySummaryModel = CswQuerySummaryModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
