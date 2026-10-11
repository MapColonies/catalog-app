import { Instance, types } from "mobx-state-tree"
import { LayerDemRecordModelBase } from "./LayerDemRecordModel.base"
import { momentDateType } from "./moment-date.type"


/* The TypeScript type of an instance of LayerDemRecordModel */
export interface LayerDemRecordModelType extends Instance<typeof LayerDemRecordModel.Type> {}

/* A graphql query fragment builders for LayerDemRecordModel */
export { selectFromLayerDemRecord, layerDemRecordModelPrimitives, LayerDemRecordModelSelector } from "./LayerDemRecordModel.base"

/**
 * LayerDemRecordModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const LayerDemRecordModel = LayerDemRecordModelBase
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
    updateDate: types.maybe(momentDateType),
    sourceDateStart: types.maybe(momentDateType),
    sourceDateEnd: types.maybe(momentDateType),
    /* tslint:enable */
    /* eslint-enable */
    footprintShown: types.union(types.undefined, types.null, types.boolean),
    order: types.union(types.undefined, types.null, types.number),
    layerImageShown: types.union(types.undefined, types.null, types.boolean),
    isDisabled: types.union(types.undefined, types.null, types.boolean),
  })
