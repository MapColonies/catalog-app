import { Instance, types } from "mobx-state-tree"
import { LayerRasterRecordModelBase } from "./LayerRasterRecordModel.base"
import { momentDateType } from "./moment-date.type"

/* The TypeScript type of an instance of LayerRasterRecordModel */
export interface LayerRasterRecordModelType extends Instance<typeof LayerRasterRecordModel.Type> {}

/* A graphql query fragment builders for LayerRasterRecordModel */
export { selectFromLayerRasterRecord, layerRasterRecordModelPrimitives, LayerRasterRecordModelSelector } from "./LayerRasterRecordModel.base"

/**
 * LayerRasterRecordModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const LayerRasterRecordModel = LayerRasterRecordModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
  .props({
    /* eslint-disable */
    /* tslint:disable */
    insertDate: types.maybe(momentDateType),
    creationDateUTC: types.maybe(momentDateType),
    updateDateUTC: types.maybe(momentDateType),
    ingestionDate: types.maybe(momentDateType),
    imagingTimeBeginUTC: types.maybe(momentDateType),
    imagingTimeEndUTC: types.maybe(momentDateType),
    /* tslint:enable */
    /* eslint-enable */
    footprintShown: types.union(types.undefined, types.null, types.boolean),
    order: types.union(types.undefined, types.null, types.number),
    layerImageShown: types.union(types.undefined, types.null, types.boolean),
    layerURLMissing: types.union(types.undefined, types.null, types.boolean),
    isNewlyAddedToBest: types.union(types.undefined, types.null, types.boolean),
    polygonPartsShown: types.union(types.undefined, types.null, types.boolean),
    isDisabled: types.union(types.undefined, types.null, types.boolean),
  })
