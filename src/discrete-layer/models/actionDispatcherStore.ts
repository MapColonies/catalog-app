/* eslint-disable @typescript-eslint/naming-convention */
import { types, getParent } from 'mobx-state-tree';
import { cloneDeep } from 'lodash'
import { ResponseState } from '../../common/models/response-state.enum';
import ACTIONS_CONFIG, { IActionGroup, IEntityActions } from '../../common/actions/entity.actions';
import { ModelBase } from './ModelBase';
import { IRootStore, RootStoreType } from './RootStore';
import CONTEXT_ACTIONS_CONFIG, { IContextActionGroup, IContextActions } from '../../common/actions/context.actions';

export interface IDispatchAction {
  action: string;
  data: Record<string, unknown>;
};

export type CombinedActionsType = (IEntityActions | IContextActions)[];

export const actionDispatcherStore = ModelBase
  .props({
    state: types.enumeration<ResponseState>(
      'State',
      Object.values(ResponseState)
    ),
    actionsConfig: types.maybe(types.frozen<CombinedActionsType>([...ACTIONS_CONFIG, ...CONTEXT_ACTIONS_CONFIG])),
    action: types.maybe(types.frozen<IDispatchAction | undefined>(undefined)),
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
    const isContextActions = (actionsGroup: IEntityActions | IContextActions): actionsGroup is IContextActions => {
      return 'context' in actionsGroup && actionsGroup.groups.every(action => 'actionsSpreadPreference' in action)
    };

    function getEntityActionGroups(entity: string): IActionGroup[] {
      const actions = self.actionsConfig?.find(entityActions => entityActions.entity === entity) as IEntityActions;
      return actions?.actions ?? [];
    };

    function getContextActionGroups(context: string): IContextActionGroup[] {
      const actions = self.actionsConfig?.find(actions => isContextActions(actions) && actions.context === context) as IContextActions;
      return actions?.groups ?? [];
    };

    function getEntityActionConfiguration(entity: string): IEntityActions | IContextActions | undefined {
      const actions = self.actionsConfig?.find(entityActions => entityActions.entity === entity);
      return actions ?? undefined;
    };

    function dispatchAction(action: IDispatchAction | undefined): void {
      self.action = cloneDeep(action);
    };

    return {
      getEntityActionGroups,
      getEntityActionConfiguration,
      getContextActionGroups,
      dispatchAction,
      isContextActions,
    };
  });
