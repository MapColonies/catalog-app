import { Instance } from "mobx-state-tree"
import { DummyForTypesOnClientModelBase } from "./DummyForTypesOnClientModel.base"

/* The TypeScript type of an instance of DummyForTypesOnClientModel */
export interface DummyForTypesOnClientModelType extends Instance<typeof DummyForTypesOnClientModel.Type> {}

/* A graphql query fragment builders for DummyForTypesOnClientModel */
export { selectFromDummyForTypesOnClient, dummyForTypesOnClientModelPrimitives, DummyForTypesOnClientModelSelector } from "./DummyForTypesOnClientModel.base"

/**
 * DummyForTypesOnClientModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DummyForTypesOnClientModel = DummyForTypesOnClientModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
