/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */
import { types } from "mobx-state-tree"

/**
 * Typescript enum
 */

export enum Domain {
  RASTER="RASTER",
DEM="DEM",
VECTOR="VECTOR"
}

/**
* Domain
*/
export const DomainEnumType = types.enumeration("Domain", [
        "RASTER",
  "DEM",
  "VECTOR",
      ])
