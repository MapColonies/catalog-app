/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */
import { types } from "mobx-state-tree"

/**
 * Typescript enum
 */

export enum RecordStatus {
  PUBLISHED="PUBLISHED",
UNPUBLISHED="UNPUBLISHED",
BEING_DELETED="BEING_DELETED"
}

/**
* RecordStatus
*/
export const RecordStatusEnumType = types.enumeration("RecordStatus", [
        "PUBLISHED",
  "UNPUBLISHED",
  "BEING_DELETED",
      ])
