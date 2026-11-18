import { Instance } from "mobx-state-tree"
import { ExternalLayerSourceModelBase } from "./ExternalLayerSourceModel.base"

/* The TypeScript type of an instance of ExternalLayerSourceModel */
export interface ExternalLayerSourceModelType extends Instance<typeof ExternalLayerSourceModel.Type> {}

/* A graphql query fragment builders for ExternalLayerSourceModel */
export { selectFromExternalLayerSource, externalLayerSourceModelPrimitives, ExternalLayerSourceModelSelector } from "./ExternalLayerSourceModel.base"

/**
 * ExternalLayerSourceModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ExternalLayerSourceModel = ExternalLayerSourceModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
