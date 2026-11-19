import { Instance } from "mobx-state-tree"
import { BasemapLayerModelBase } from "./BasemapLayerModel.base"

/* The TypeScript type of an instance of BasemapLayerModel */
export interface BasemapLayerModelType extends Instance<typeof BasemapLayerModel.Type> {}

/* A graphql query fragment builders for BasemapLayerModel */
export { selectFromBasemapLayer, basemapLayerModelPrimitives, BasemapLayerModelSelector } from "./BasemapLayerModel.base"

/**
 * BasemapLayerModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const BasemapLayerModel = BasemapLayerModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
