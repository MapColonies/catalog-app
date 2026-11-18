import { Instance } from "mobx-state-tree"
import { RasterUniquenessModelBase } from "./RasterUniquenessModel.base"

/* The TypeScript type of an instance of RasterUniquenessModel */
export interface RasterUniquenessModelType extends Instance<typeof RasterUniquenessModel.Type> {}

/* A graphql query fragment builders for RasterUniquenessModel */
export { selectFromRasterUniqueness, rasterUniquenessModelPrimitives, RasterUniquenessModelSelector } from "./RasterUniquenessModel.base"

/**
 * RasterUniquenessModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const RasterUniquenessModel = RasterUniquenessModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
