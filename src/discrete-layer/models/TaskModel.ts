import { Instance } from "mobx-state-tree"
import { TaskModelBase } from "./TaskModel.base"

/* The TypeScript type of an instance of TaskModel */
export interface TaskModelType extends Instance<typeof TaskModel.Type> {}

/* A graphql query fragment builders for TaskModel */
export { selectFromTask, taskModelPrimitives, TaskModelSelector } from "./TaskModel.base"

/**
 * TaskModel
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TaskModel = TaskModelBase
  .actions(self => ({
    // This is an auto-generated example action.
    log(): void {
      console.log(JSON.stringify(self))
    }
  }))
