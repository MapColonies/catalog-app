import { Instance } from "mobx-state-tree"
import { GeojsonFeatureModelBase } from "./GeojsonFeatureModel.base"

/* The TypeScript type of an instance of GeojsonFeatureModel */
export interface GeojsonFeatureModelType extends Instance<typeof GeojsonFeatureModel.Type> {}

/* A graphql query fragment builders for GeojsonFeatureModel */
export { selectFromGeojsonFeature, geojsonFeatureModelPrimitives, GeojsonFeatureModelSelector } from "./GeojsonFeatureModel.base"

/**
 * GeojsonFeatureModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const GeojsonFeatureModel = GeojsonFeatureModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
