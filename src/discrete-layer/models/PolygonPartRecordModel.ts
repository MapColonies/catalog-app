import { Instance, types } from "mobx-state-tree"
import { PolygonPartRecordModelBase } from "./PolygonPartRecordModel.base"
import { momentDateType } from "./moment-date.type"
import { ProductTypeEnumType } from "./ProductTypeEnum";
import { LinkModel } from "./LinkModel";
import { RecordTypeEnumType } from "./RecordTypeEnum";

/* The TypeScript type of an instance of PolygonPartRecordModel */
export interface PolygonPartRecordModelType extends Instance<typeof PolygonPartRecordModel.Type> {}

export interface ParsedPolygonPartError {
  codes: string[];
  label: string
}
export interface ParsedPolygonPart {
  polygonPart: PolygonPartRecordModelType;
  errors: Record<string,ParsedPolygonPartError>;
}
/* A graphql query fragment builders for PolygonPartRecordModel */
export { selectFromPolygonPartRecord, polygonPartRecordModelPrimitives, PolygonPartRecordModelSelector } from "./PolygonPartRecordModel.base"

/**
 * PolygonPartRecordModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const PolygonPartRecordModel = PolygonPartRecordModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
  .props({
    /* eslint-disable */
    /* tslint:disable */
    ingestionDateUTC: types.maybe(momentDateType),
    imagingTimeBeginUTC: types.maybe(momentDateType),
    imagingTimeEndUTC: types.maybe(momentDateType),
    /* tslint:enable */
    /* eslint-enable */

    // *** CLIENT FIELD
    uniquePartId: types.string,

    // **** DUMMY FIELDS(ENTITY LEVEL) TO NORMALIZE POLYGON PARTS RECORD (WILL BE ALWAYS EMPTY)
    id: types.identifier, //Alex change till proper deffs
    productType: types.union(types.undefined, ProductTypeEnumType),
    productName: types.union(types.undefined, types.string),
    footprint: types.union(types.undefined, types.frozen()),
    links: types.union(types.undefined, types.null, types.array(types.late((): any => LinkModel))),
    type: types.union(types.undefined, types.null, RecordTypeEnumType),
    
    // **** DUMMY FIELDS(CLENT OPERATIONAL LEVEL)
    footprintShown: types.union(types.undefined, types.null, types.boolean),
    order: types.union(types.undefined, types.null, types.number),
    layerImageShown: types.union(types.undefined, types.null, types.boolean),
    resolutionDegreeMaxValue: types.union(types.undefined, types.string),
    isDisabled: types.union(types.undefined, types.null, types.boolean),
  })
