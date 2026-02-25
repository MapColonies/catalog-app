import { TabViews } from '../../discrete-layer/views/tab-views';
import { IAction, IActionGroup } from './entity.actions';

export enum ApplicationContexts {
  MAP_CONTEXT = 'mapContext',
  MAP_ENTITY_CONTEXT = 'mapEntityContext',
}

export enum ContextActionsTypes {
  SERVICE_OPERATIONS = 'ServiceOperations',
  CLIENT_SIDE_OPERATIONS = 'ClientSideOperations',
}

export enum ContextActions {
  QUERY_WFS_FEATURE = 'QUERY_WFS_FEATURE',
  QUERY_DEM_HEIGHT = 'QUERY_DEM_HEIGHT',
  QUERY_POLYGON_PARTS = 'QUERY_POLYGON_PARTS',
  MOVE_LAYER_UP = 'MOVE_LAYER_UP',
  MOVE_LAYER_DOWN = 'MOVE_LAYER_DOWN',
  MOVE_LAYER_TO_BOTTOM = 'MOVE_LAYER_TO_BOTTOM',
  MOVE_LAYER_TO_TOP = 'MOVE_LAYER_TO_TOP',
  HIGHLIGHT_ACTIVE_LAYER = 'HIGHLIGHT_ACTIVE_LAYER',
}

export enum ContextActionsTemplates {
  WFS_QUERY_FEATURES = 'WFS_QUERY_FEATURES',
}

export enum ContextActionsGroupTemplates {
  ACTIVE_LAYERS_IN_POSITION = 'ACTIVE_LAYERS_IN_POSITION',
}

export enum ActionSpreadPreference {
  FLAT = 'flat',
  MENU = 'menu',
}

export type SeparatorPosition = 'BEFORE' | 'AFTER';

export interface IContextAction extends IAction {
  templateId?: ContextActionsTemplates;
  separator?: SeparatorPosition;
}

export interface IContextActionGroup extends Omit<IActionGroup, 'group'> {
  order: number;
  actionsSpreadPreference: ActionSpreadPreference;
  templateId?: ContextActionsGroupTemplates;
  minimumItemsInMenu?: number; // Ignored if spread preference is not a menu. defaults to 2.
  actions: Array<IContextAction | IContextActionGroup>;
  icon?: string;
  separator?: SeparatorPosition;
}

export type ContextActionGroupProps = Omit<IContextActionGroup, 'actions'>;

export interface IContextActions {
  context: ApplicationContexts;
  entity?: string;
  childEntity?: string;
  groups: IContextActionGroup[];
}

// A "type guard" helper function used to infer if action is a group or a single action.
export const isActionGroup = (
  action: IContextAction | IContextActionGroup
): action is IContextActionGroup => {
  return (action as IContextActionGroup).actions !== undefined;
};

const DEFAULT_MINIMUM_ITEMS_IN_MENU = 2;

const defaultContextActionProps: IAction = {
  action: '',
  class: '',
  frequent: false,
  icon: '',
  titleTranslationId: '',
  views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
};

const defaultContextActionGroupProps: Omit<IContextActionGroup, 'order'> = {
  id: 0,
  actionsSpreadPreference: ActionSpreadPreference.MENU,
  minimumItemsInMenu: DEFAULT_MINIMUM_ITEMS_IN_MENU,
  actions: [],
  titleTranslationId: '',
  type: '',
};

const CONTEXT_ACTIONS_CONFIG: IContextActions[] = [
  {
    context: ApplicationContexts.MAP_CONTEXT,
    groups: [
      {
        ...defaultContextActionGroupProps,
        order: 0,
        id: 1,
        titleTranslationId: 'map-context-menu.service-operations.group.title',
        type: ContextActionsTypes.SERVICE_OPERATIONS,
        actionsSpreadPreference: ActionSpreadPreference.MENU,
        minimumItemsInMenu: 2,
        separator: 'AFTER',
        actions: [
          {
            // Items will be generated according to store.mapMenusManagerStore.wfsFeatureTypes
            ...defaultContextActionProps,
            templateId: ContextActionsTemplates.WFS_QUERY_FEATURES,
            action: ContextActions.QUERY_WFS_FEATURE,
          },
        ],
      },
      {
        ...defaultContextActionGroupProps,
        order: 1,
        id: 2,
        titleTranslationId: '',
        type: ContextActionsTypes.SERVICE_OPERATIONS,
        actionsSpreadPreference: ActionSpreadPreference.FLAT,
        separator: 'AFTER',
        actions: [
          {
            ...defaultContextActionProps,
            titleTranslationId: 'map-context-menu.query-dem-height.title',
            action: ContextActions.QUERY_DEM_HEIGHT,
          },
        ],
      },
      {
        ...defaultContextActionGroupProps,
        order: 3,
        id: 4,
        titleTranslationId: 'Active layers',
        type: ContextActionsTypes.SERVICE_OPERATIONS,
        actionsSpreadPreference: ActionSpreadPreference.FLAT,
        actions: [
          {
            ...defaultContextActionGroupProps,
            id: 5,
            order: 4,
            titleTranslationId: 'ACTIVE_LAYERS_TEMPLATE',
            type: ContextActionsTypes.SERVICE_OPERATIONS,
            actionsSpreadPreference: ActionSpreadPreference.MENU,
            minimumItemsInMenu: 0,
            // Multiple groups will be generated according to active layers in position, via layers manager's data
            templateId: ContextActionsGroupTemplates.ACTIVE_LAYERS_IN_POSITION,
            actions: [
              {
                ...defaultContextActionProps,
                titleTranslationId: 'map-context-menu.polygon-parts.title',
                action: ContextActions.QUERY_POLYGON_PARTS,
                separator: 'AFTER',
              },
              {
                ...defaultContextActionProps,
                titleTranslationId: 'map-context-menu.layer-up.title',
                action: ContextActions.MOVE_LAYER_UP,
              },
              {
                ...defaultContextActionProps,
                titleTranslationId: 'map-context-menu.layer-down.title',
                action: ContextActions.MOVE_LAYER_DOWN,
              },
              {
                ...defaultContextActionProps,
                titleTranslationId: 'map-context-menu.layer-to-top.title',
                action: ContextActions.MOVE_LAYER_TO_TOP,
              },
              {
                ...defaultContextActionProps,
                titleTranslationId: 'map-context-menu.layer-to-bottom.title',
                action: ContextActions.MOVE_LAYER_TO_BOTTOM,
              },
            ],
          },
        ],
      },
    ],
  },
];

export default CONTEXT_ACTIONS_CONFIG;
