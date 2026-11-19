import { Instance } from "mobx-state-tree"
import { ImportReviewLayerModelBase } from "./ImportReviewLayerModel.base"

/* The TypeScript type of an instance of ImportReviewLayerModel */
export interface ImportReviewLayerModelType extends Instance<typeof ImportReviewLayerModel.Type> {}

/* A graphql query fragment builders for ImportReviewLayerModel */
export { selectFromImportReviewLayer, importReviewLayerModelPrimitives, ImportReviewLayerModelSelector } from "./ImportReviewLayerModel.base"

/**
 * ImportReviewLayerModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ImportReviewLayerModel = ImportReviewLayerModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
