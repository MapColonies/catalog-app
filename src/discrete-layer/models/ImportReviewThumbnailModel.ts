import { Instance } from "mobx-state-tree"
import { ImportReviewThumbnailModelBase } from "./ImportReviewThumbnailModel.base"

/* The TypeScript type of an instance of ImportReviewThumbnailModel */
export interface ImportReviewThumbnailModelType extends Instance<typeof ImportReviewThumbnailModel.Type> {}

/* A graphql query fragment builders for ImportReviewThumbnailModel */
export { selectFromImportReviewThumbnail, importReviewThumbnailModelPrimitives, ImportReviewThumbnailModelSelector } from "./ImportReviewThumbnailModel.base"

/**
 * ImportReviewThumbnailModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ImportReviewThumbnailModel = ImportReviewThumbnailModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
