import { Instance } from "mobx-state-tree"
import { BasemapThumbnailModelBase } from "./BasemapThumbnailModel.base"

/* The TypeScript type of an instance of BasemapThumbnailModel */
export interface BasemapThumbnailModelType extends Instance<typeof BasemapThumbnailModel.Type> {}

/* A graphql query fragment builders for BasemapThumbnailModel */
export { selectFromBasemapThumbnail, basemapThumbnailModelPrimitives, BasemapThumbnailModelSelector } from "./BasemapThumbnailModel.base"

/**
 * BasemapThumbnailModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const BasemapThumbnailModel = BasemapThumbnailModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
