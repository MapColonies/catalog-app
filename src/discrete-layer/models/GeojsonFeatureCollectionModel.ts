import { Instance } from "mobx-state-tree"
import { GeojsonFeatureCollectionModelBase } from "./GeojsonFeatureCollectionModel.base"

/* The TypeScript type of an instance of GeojsonFeatureCollectionModel */
export interface GeojsonFeatureCollectionModelType extends Instance<typeof GeojsonFeatureCollectionModel.Type> {}

/* A graphql query fragment builders for GeojsonFeatureCollectionModel */
export { selectFromGeojsonFeatureCollection, geojsonFeatureCollectionModelPrimitives, GeojsonFeatureCollectionModelSelector } from "./GeojsonFeatureCollectionModel.base"

/**
 * GeojsonFeatureCollectionModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const GeojsonFeatureCollectionModel = GeojsonFeatureCollectionModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
