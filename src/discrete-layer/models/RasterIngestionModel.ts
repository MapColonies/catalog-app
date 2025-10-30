import { Instance } from "mobx-state-tree"
import { RasterIngestionModelBase } from "./RasterIngestionModel.base"

/* The TypeScript type of an instance of RasterIngestionModel */
export interface RasterIngestionModelType extends Instance<typeof RasterIngestionModel.Type> {}

/* A graphql query fragment builders for RasterIngestionModel */
export { selectFromRasterIngestion, rasterIngestionModelPrimitives, RasterIngestionModelSelector } from "./RasterIngestionModel.base"

/**
 * RasterIngestionModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const RasterIngestionModel = RasterIngestionModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
