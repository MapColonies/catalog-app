import { Instance } from "mobx-state-tree"
import { ImportReviewModelBase } from "./ImportReviewModel.base"

/* The TypeScript type of an instance of ImportReviewModel */
export interface ImportReviewModelType extends Instance<typeof ImportReviewModel.Type> {}

/* A graphql query fragment builders for ImportReviewModel */
export { selectFromImportReview, importReviewModelPrimitives, ImportReviewModelSelector } from "./ImportReviewModel.base"

/**
 * ImportReviewModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ImportReviewModel = ImportReviewModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
