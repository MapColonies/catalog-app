import { Instance } from "mobx-state-tree"
import { BasemapExportPackageModelBase } from "./BasemapExportPackageModel.base"

/* The TypeScript type of an instance of BasemapExportPackageModel */
export interface BasemapExportPackageModelType extends Instance<typeof BasemapExportPackageModel.Type> {}

/* A graphql query fragment builders for BasemapExportPackageModel */
export { selectFromBasemapExportPackage, basemapExportPackageModelPrimitives, BasemapExportPackageModelSelector } from "./BasemapExportPackageModel.base"

/**
 * BasemapExportPackageModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const BasemapExportPackageModel = BasemapExportPackageModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
