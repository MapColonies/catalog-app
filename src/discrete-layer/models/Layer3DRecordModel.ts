import { Instance, types } from "mobx-state-tree"
import { Layer3DRecordModelBase } from "./Layer3DRecordModel.base"
import { momentDateType } from "./moment-date.type"

/* The TypeScript type of an instance of Layer3DRecordModel */
export interface Layer3DRecordModelType extends Instance<typeof Layer3DRecordModel.Type> {}

/* A graphql query fragment builders for Layer3DRecordModel */
export { selectFromLayer3DRecord, layer3DRecordModelPrimitives, Layer3DRecordModelSelector } from "./Layer3DRecordModel.base"

/**
 * Layer3DRecordModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const Layer3DRecordModel = Layer3DRecordModelBase
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
    footprintShown: types.union(types.undefined, types.null, types.boolean),
    order: types.union(types.undefined, types.null, types.number),
    layerImageShown: types.union(types.undefined, types.null, types.boolean),
  })
