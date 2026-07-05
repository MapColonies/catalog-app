/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { K8SServiceModel, K8SServiceModelType } from "./K8SServiceModel"
import { K8SServiceModelSelector } from "./K8SServiceModel.base"
import { RootStoreType } from "./index"


/**
 * DeploymentWithServicesBase
 * auto generated base class for the model DeploymentWithServicesModel.
 */
export const DeploymentWithServicesModelBase = ModelBase
  .named('DeploymentWithServices')
  .props({
    __typename: types.optional(types.literal("DeploymentWithServices"), "DeploymentWithServices"),
    name: types.union(types.undefined, types.null, types.string),
    status: types.union(types.undefined, types.null, types.boolean),
    image: types.union(types.undefined, types.null, types.string),
    services: types.union(types.undefined, types.null, types.array(types.late((): any => K8SServiceModel))),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class DeploymentWithServicesModelSelector extends QueryBuilder {
  get name() { return this.__attr(`name`) }
  get status() { return this.__attr(`status`) }
  get image() { return this.__attr(`image`) }
  services(builder: string | K8SServiceModelSelector | ((selector: K8SServiceModelSelector) => K8SServiceModelSelector) | undefined) { return this.__child(`services`, K8SServiceModelSelector, builder) }
}
export function selectFromDeploymentWithServices() {
  return new DeploymentWithServicesModelSelector()
}

export const deploymentWithServicesModelPrimitives = selectFromDeploymentWithServices().name.status.image
