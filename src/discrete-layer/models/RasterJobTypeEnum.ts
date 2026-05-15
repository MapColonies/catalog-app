/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */
import { types } from "mobx-state-tree"

/**
 * Typescript enum
 */

export enum RasterJobType {
  NEW="NEW",
UPDATE="UPDATE",
SWAP_UPDATE="SWAP_UPDATE"
}

/**
* RasterJobType
*/
export const RasterJobTypeEnumType = types.enumeration("RasterJobType", [
        "NEW",
  "UPDATE",
  "SWAP_UPDATE",
      ])
