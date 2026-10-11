import { Instance, types } from "mobx-state-tree"
import { momentDateType } from "./moment-date.type"
import { QuantizedMeshBestRecordModelBase } from "./QuantizedMeshBestRecordModel.base"

/* The TypeScript type of an instance of QuantizedMeshBestRecordModel */
export interface QuantizedMeshBestRecordModelType extends Instance<typeof QuantizedMeshBestRecordModel.Type> {}

/* A graphql query fragment builders for QuantizedMeshBestRecordModel */
export { selectFromQuantizedMeshBestRecord, quantizedMeshBestRecordModelPrimitives, QuantizedMeshBestRecordModelSelector } from "./QuantizedMeshBestRecordModel.base"

/**
 * QuantizedMeshBestRecordModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const QuantizedMeshBestRecordModel = QuantizedMeshBestRecordModelBase
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
    creationDate: types.maybe(momentDateType),
    updateDate: types.maybe(momentDateType),
    ingestionDate: types.maybe(momentDateType),
    sourceDateStart: types.maybe(momentDateType),
    sourceDateEnd: types.maybe(momentDateType),
    validationDate: types.maybe(momentDateType),
    /* tslint:enable */
    /* eslint-enable */

    // TODO: should be removed
    footprintShown: types.union(types.undefined, types.null, types.boolean),
    order: types.union(types.undefined, types.null, types.number),
    layerImageShown: types.union(types.undefined, types.null, types.boolean),
    isDisabled: types.union(types.undefined, types.null, types.boolean),
  })
