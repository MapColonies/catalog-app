import { Instance, types } from 'mobx-state-tree';
import { VectorBestRecordModelBase } from './VectorBestRecordModel.base';

/* The TypeScript type of an instance of VectorBestRecordModel */
export interface VectorBestRecordModelType extends Instance<typeof VectorBestRecordModel.Type> {}

/* A graphql query fragment builders for VectorBestRecordModel */
export { selectFromVectorBestRecord, vectorBestRecordModelPrimitives, VectorBestRecordModelSelector } from './VectorBestRecordModel.base';

/**
 * VectorBestRecordModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const VectorBestRecordModel = VectorBestRecordModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
  .props({
    /* eslint-disable */
    /* tslint:disable */
    // insertDate: types.maybe(momentDateType),
    // creationDate: types.maybe(momentDateType),
    // updateDate: types.maybe(momentDateType),
    // ingestionDate: types.maybe(momentDateType),
    /* tslint:enable */
    /* eslint-enable */

    // TODO: should be removed
    footprintShown: types.union(types.undefined, types.null, types.boolean),
    order: types.union(types.undefined, types.null, types.number),
    layerImageShown: types.union(types.undefined, types.null, types.boolean),
    isDisabled: types.union(types.undefined, types.null, types.boolean),
  });
