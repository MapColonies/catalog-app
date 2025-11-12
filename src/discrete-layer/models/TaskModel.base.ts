/* This is a mst-gql generated file, don't modify it manually */
/* eslint-disable */
/* tslint:disable */

import { types } from "mobx-state-tree"
import { QueryBuilder } from "mst-gql"
import { ModelBase } from "./ModelBase"
import { StatusEnumType } from "./StatusEnum"
import { RootStoreType } from "./index"


/**
 * TaskBase
 * auto generated base class for the model TaskModel.
 */
export const TaskModelBase = ModelBase
  .named('Task')
  .props({
    __typename: types.optional(types.literal("Task"), "Task"),
    // id: types.union(types.undefined, types.string),
    id: types.identifier,
    jobId: types.union(types.undefined, types.null, types.string),
    type: types.union(types.undefined, types.null, types.string),
    description: types.union(types.undefined, types.null, types.string),
    parameters: types.union(types.undefined, types.null, types.frozen()),
    created: types.union(types.undefined, types.null, types.frozen()),
    updated: types.union(types.undefined, types.null, types.frozen()),
    status: types.union(types.undefined, types.null, StatusEnumType),
    percentage: types.union(types.undefined, types.null, types.number),
    reason: types.union(types.undefined, types.null, types.string),
    attempts: types.union(types.undefined, types.null, types.number),
  })
  .views(self => ({
    get store() {
      return self.__getStore<RootStoreType>()
    }
  }))

export class TaskModelSelector extends QueryBuilder {
  get id() { return this.__attr(`id`) }
  get jobId() { return this.__attr(`jobId`) }
  get type() { return this.__attr(`type`) }
  get description() { return this.__attr(`description`) }
  get parameters() { return this.__attr(`parameters`) }
  get created() { return this.__attr(`created`) }
  get updated() { return this.__attr(`updated`) }
  get status() { return this.__attr(`status`) }
  get percentage() { return this.__attr(`percentage`) }
  get reason() { return this.__attr(`reason`) }
  get attempts() { return this.__attr(`attempts`) }
}
export function selectFromTask() {
  return new TaskModelSelector()
}

export const taskModelPrimitives = selectFromTask().jobId.type.description.parameters.created.updated.status.percentage.reason.attempts
