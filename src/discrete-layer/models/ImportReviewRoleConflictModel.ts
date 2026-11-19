import { Instance } from "mobx-state-tree"
import { ImportReviewRoleConflictModelBase } from "./ImportReviewRoleConflictModel.base"

/* The TypeScript type of an instance of ImportReviewRoleConflictModel */
export interface ImportReviewRoleConflictModelType extends Instance<typeof ImportReviewRoleConflictModel.Type> {}

/* A graphql query fragment builders for ImportReviewRoleConflictModel */
export { selectFromImportReviewRoleConflict, importReviewRoleConflictModelPrimitives, ImportReviewRoleConflictModelSelector } from "./ImportReviewRoleConflictModel.base"

/**
 * ImportReviewRoleConflictModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ImportReviewRoleConflictModel = ImportReviewRoleConflictModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
