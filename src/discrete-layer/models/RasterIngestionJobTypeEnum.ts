/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */
import { types } from "mobx-state-tree"

/**
 * Typescript enum
 */

export enum RasterIngestionJobType {
  NEW="NEW",
UPDATE="UPDATE",
SWAP_UPDATE="SWAP_UPDATE"
}

/**
* RasterIngestionJobType
*/
export const RasterIngestionJobTypeEnumType = types.enumeration("RasterIngestionJobType", [
        "NEW",
  "UPDATE",
  "SWAP_UPDATE",
      ])
