import { Instance } from "mobx-state-tree"
import { BasemapModelBase } from "./BasemapModel.base"

/* The TypeScript type of an instance of BasemapModel */
export interface BasemapModelType extends Instance<typeof BasemapModel.Type> {}

/* A graphql query fragment builders for BasemapModel */
export { selectFromBasemap, basemapModelPrimitives, BasemapModelSelector } from "./BasemapModel.base"

/**
 * BasemapModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const BasemapModel = BasemapModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
