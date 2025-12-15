import { getParent, types } from "mobx-state-tree";
import { ResponseState } from "../../common/models/response-state.enum";
import { ModelBase } from "./ModelBase";
import { IRootStore, RootStoreType } from ".";

export const jobsStore = ModelBase
  .props({
    state: types.enumeration<ResponseState>(
      'State',
      Object.values(ResponseState)
    ),
    reloadDataCounter: types.frozen<number>(0),
  })
  .views((self) => ({
    get store(): IRootStore {
      return self.__getStore<RootStoreType>()
    },
    get root(): IRootStore {
      return getParent(self);
    },
  }))
  .actions((self) => {
    function updateReloadDataCounter(reload: number = 1) {
      self.reloadDataCounter += reload;
    }

    return {
      updateReloadDataCounter
    };
  });
