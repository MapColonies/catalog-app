import { Instance } from "mobx-state-tree"
import { ExternalLayerDetailsModelBase } from "./ExternalLayerDetailsModel.base"

/* The TypeScript type of an instance of ExternalLayerDetailsModel */
export interface ExternalLayerDetailsModelType extends Instance<typeof ExternalLayerDetailsModel.Type> {}

/* A graphql query fragment builders for ExternalLayerDetailsModel */
export { selectFromExternalLayerDetails, externalLayerDetailsModelPrimitives, ExternalLayerDetailsModelSelector } from "./ExternalLayerDetailsModel.base"

/**
 * ExternalLayerDetailsModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ExternalLayerDetailsModel = ExternalLayerDetailsModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
