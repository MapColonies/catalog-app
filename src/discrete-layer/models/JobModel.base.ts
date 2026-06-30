/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { AvailableActionsModel, AvailableActionsModelType } from "./AvailableActionsModel"
import { AvailableActionsModelSelector, availableActionsModelPrimitives } from "./AvailableActionsModel.base"
import { ProductTypeEnumType } from "./ProductTypeEnum"
import { StatusEnumType } from "./StatusEnum"
import { RootStoreType } from "./index"


/**
 * JobBase
 * auto generated base class for the model JobModel.
 */
export const JobModelBase = ModelBase
  .named('Job')
  .props({
    __typename: types.optional(types.literal("Job"), "Job"),
    //id: types.union(types.undefined, types.string),
    id: types.identifier, //Alex change till proper deffs
    resourceId: types.union(types.undefined, types.null, types.string),
    version: types.union(types.undefined, types.null, types.string),
    description: types.union(types.undefined, types.null, types.string),
    parameters: types.union(types.undefined, types.null, types.frozen()),
    status: types.union(types.undefined, types.null, StatusEnumType),
    reason: types.union(types.undefined, types.null, types.string),
    type: types.union(types.undefined, types.null, types.string),
    percentage: types.union(types.undefined, types.null, types.number),
    priority: types.union(types.undefined, types.null, types.number),
    expirationDate: types.union(types.undefined, types.null, types.frozen()),
    internalId: types.union(types.undefined, types.null, types.string),
    producerName: types.union(types.undefined, types.null, types.string),
    productName: types.union(types.undefined, types.null, types.string),
    productType: types.union(types.undefined, types.null, ProductTypeEnumType),
    created: types.union(types.undefined, types.null, types.frozen()),
    updated: types.union(types.undefined, types.null, types.frozen()),
    taskCount: types.union(types.undefined, types.null, types.number),
    completedTasks: types.union(types.undefined, types.null, types.number),
    failedTasks: types.union(types.undefined, types.null, types.number),
    expiredTasks: types.union(types.undefined, types.null, types.number),
    pendingTasks: types.union(types.undefined, types.null, types.number),
    inProgressTasks: types.union(types.undefined, types.null, types.number),
    isCleaned: types.union(types.undefined, types.null, types.boolean),
    domain: types.union(types.undefined, types.null, types.string),
    availableActions: types.union(types.undefined, types.null, types.late((): any => AvailableActionsModel)),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class JobModelSelector extends QueryBuilder {
  get id() { return this.__attr(`id`) }
  get resourceId() { return this.__attr(`resourceId`) }
  get version() { return this.__attr(`version`) }
  get description() { return this.__attr(`description`) }
  get parameters() { return this.__attr(`parameters`) }
  get status() { return this.__attr(`status`) }
  get reason() { return this.__attr(`reason`) }
  get type() { return this.__attr(`type`) }
  get percentage() { return this.__attr(`percentage`) }
  get priority() { return this.__attr(`priority`) }
  get expirationDate() { return this.__attr(`expirationDate`) }
  get internalId() { return this.__attr(`internalId`) }
  get producerName() { return this.__attr(`producerName`) }
  get productName() { return this.__attr(`productName`) }
  get productType() { return this.__attr(`productType`) }
  get created() { return this.__attr(`created`) }
  get updated() { return this.__attr(`updated`) }
  get taskCount() { return this.__attr(`taskCount`) }
  get completedTasks() { return this.__attr(`completedTasks`) }
  get failedTasks() { return this.__attr(`failedTasks`) }
  get expiredTasks() { return this.__attr(`expiredTasks`) }
  get pendingTasks() { return this.__attr(`pendingTasks`) }
  get inProgressTasks() { return this.__attr(`inProgressTasks`) }
  get isCleaned() { return this.__attr(`isCleaned`) }
  get domain() { return this.__attr(`domain`) }
  availableActions(builder: string | AvailableActionsModelSelector | ((selector: AvailableActionsModelSelector) => AvailableActionsModelSelector) | undefined) { return this.__child(`availableActions`, AvailableActionsModelSelector, builder) }
}
export function selectFromJob() {
  return new JobModelSelector()
}

export const jobModelPrimitives = selectFromJob().availableActions(availableActionsModelPrimitives).resourceId.version.description.parameters.status.reason.type.percentage.priority.expirationDate.internalId.producerName.productName.productType.created.updated.taskCount.completedTasks.failedTasks.expiredTasks.pendingTasks.inProgressTasks.isCleaned.domain
