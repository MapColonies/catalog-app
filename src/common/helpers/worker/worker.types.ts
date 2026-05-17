export interface IWorkerHookBase {
  ready: boolean;
  init: {
    method: () => Promise<void>;
  };
  //["cleanup"] will be called internally
}

export interface IWorkerBase {
  ready: boolean;
  init: () => void;
  cleanup: () => void;
}

export interface IWorkerWarmupHook<T extends IWorkerHookBase> {
  api: T | null;
  onReady: () => void;
}
