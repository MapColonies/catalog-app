import { TabViews } from '../../discrete-layer/views/tab-views';
import { UserAction } from '../../discrete-layer/models/userStore';
import { RecordStatus } from '../../discrete-layer/models';
import { ExportActions } from '../../discrete-layer/components/export-layer/hooks/useDomainExportActionsConfig';
import { ContextActions } from './context.actions';

interface DependentFieldWithValue {
  field: string;
  expectedValue: unknown;
  operator?: 'equals' | 'notEquals';
}
export type DependentField = string | DependentFieldWithValue;

enum GeneralAction {
  flyTo = 'flyTo',
  viewer = 'viewer',
  export = 'export',
}

enum JobAction {
  restore = 'restore',
  abort = 'abort',
  retry = 'retry',
  download_details = 'download_details',
}

enum CRUDAction {
  delete = 'delete',
  update = 'update',
  edit = 'edit',
}

export interface IAction {
  action: ContextActions | UserAction | ExportActions | GeneralAction | JobAction | CRUDAction;
  frequent: boolean;
  symbol: {
    icon?: string;
    class?: string;
  };
  title: {
    translationId: string;
    class?: string;
  };
  views: TabViews[];
  disabled?: boolean;
  dependentField?: DependentField;
}

export interface IActionGroup {
  id: number;
  titleTranslationId: string;
  type: string;
  group: IAction[];
}

export interface IEntityActions {
  entity: string;
  childEntity?: string;
  actions: IActionGroup[];
}

export enum EntityActionsTypes {
  GENERAL_ACTIONS = 'generalActions',
  MAP_ACTIONS = 'mapActions',
  CRUD = 'CRUD',
  JOB_ACTIONS = 'jobActions',
  EXPORT_ACTIONS = 'exportActions',
}

export const isDependentFieldWithValue = (
  dependentField?: DependentField
): dependentField is DependentFieldWithValue => {
  return (
    typeof dependentField !== 'undefined' &&
    typeof dependentField !== 'string' &&
    'expectedValue' in dependentField
  );
};

export const getActionsWithDisable = (
  entityActions: IActionGroup[],
  disabledActions: Array<[string, boolean]>
): IActionGroup[] => {
  const actions = structuredClone(entityActions);

  for (const actionGroup of actions) {
    for (const [actionName, isDisabled] of disabledActions) {
      const action = actionGroup.group.find((action) => action.action === actionName);

      if (action) {
        action.disabled = isDisabled;
      }
    }
  }

  return actions;
};

const GENERAL_ACTIONS_GROUP: IActionGroup = {
  id: 0,
  titleTranslationId: 'layerCatalogToMap',
  type: EntityActionsTypes.GENERAL_ACTIONS,
  group: [
    {
      action: GeneralAction.flyTo,
      frequent: true,
      symbol: {
        class: 'mc-icon-Fly-to',
      },
      title: {
        translationId: 'action.flyTo.tooltip',
      },
      views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
    },
    {
      action: GeneralAction.viewer,
      frequent: false,
      symbol: {
        class: 'mc-icon-Earth',
      },
      title: {
        translationId: 'action.viewer.tooltip',
      },
      dependentField: {
        field: 'productStatus',
        expectedValue: RecordStatus.BEING_DELETED,
        operator: 'notEquals',
      },
      views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
    },
    {
      action: GeneralAction.export,
      frequent: false,
      symbol: {
        class: 'mc-icon-Export',
      },
      title: {
        translationId: 'action.export.tooltip',
      },
      dependentField: { field: 'layerURLMissing', expectedValue: false },
      views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
    },
  ],
};

const ACTIONS_CONFIG: IEntityActions[] = [
  {
    entity: 'LayerRasterRecord',
    actions: [
      GENERAL_ACTIONS_GROUP,
      {
        id: 1,
        titleTranslationId: 'CRUD',
        type: EntityActionsTypes.CRUD,
        group: [
          {
            action: CRUDAction.edit,
            frequent: true,
            symbol: { class: 'mc-icon-Edit1' },
            title: { translationId: 'action.edit.tooltip' },
            dependentField: { field: 'layerURLMissing', expectedValue: false },
            views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
          },
          {
            action: CRUDAction.update,
            frequent: false,
            symbol: { class: 'mc-icon-Update' },
            title: { translationId: 'action.update.tooltip' },
            dependentField: { field: 'layerURLMissing', expectedValue: false },
            views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
          },
          {
            action: CRUDAction.delete,
            frequent: false,
            symbol: { class: 'mc-icon-Delete error' },
            title: { translationId: 'action.delete.tooltip', class: 'error' },
            dependentField: { field: 'layerURLMissing', expectedValue: false },
            views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
          },
        ],
      },
    ],
  },
  {
    entity: 'Layer3DRecord',
    actions: [
      GENERAL_ACTIONS_GROUP,
      {
        id: 1,
        titleTranslationId: 'CRUD',
        type: EntityActionsTypes.CRUD,
        group: [
          {
            action: CRUDAction.edit,
            frequent: true,
            symbol: { class: 'mc-icon-Edit1' },
            title: { translationId: 'action.edit.tooltip' },
            dependentField: {
              field: 'productStatus',
              expectedValue: RecordStatus.BEING_DELETED,
              operator: 'notEquals',
            },
            views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
          },
          {
            action: CRUDAction.delete,
            frequent: false,
            symbol: { class: 'mc-icon-Delete error' },
            title: { translationId: 'action.delete.tooltip', class: 'error' },
            dependentField: {
              field: 'productStatus',
              expectedValue: RecordStatus.BEING_DELETED,
              operator: 'notEquals',
            },
            views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
          },
        ],
      },
    ],
  },
  {
    entity: 'VectorBestRecord',
    actions: [
      GENERAL_ACTIONS_GROUP,
      {
        id: 1,
        titleTranslationId: 'CRUD',
        type: EntityActionsTypes.CRUD,
        group: [
          {
            action: CRUDAction.edit,
            frequent: true,
            symbol: { class: 'mc-icon-Edit1' },
            title: { translationId: 'action.edit.tooltip' },
            views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
          },
        ],
      },
    ],
  },
  {
    entity: 'QuantizedMeshBestRecord',
    actions: [
      GENERAL_ACTIONS_GROUP,
      {
        id: 1,
        titleTranslationId: 'CRUD',
        type: EntityActionsTypes.CRUD,
        group: [
          {
            action: CRUDAction.edit,
            frequent: true,
            symbol: { class: 'mc-icon-Edit1' },
            title: { translationId: 'action.edit.tooltip' },
            views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
          },
        ],
      },
    ],
  },
  {
    entity: 'LayerDemRecord',
    actions: [
      GENERAL_ACTIONS_GROUP,
      {
        id: 1,
        titleTranslationId: 'CRUD',
        type: EntityActionsTypes.CRUD,
        group: [
          {
            action: CRUDAction.edit,
            frequent: true,
            symbol: { class: 'mc-icon-Edit1' },
            title: { translationId: 'action.edit.tooltip' },
            views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS],
          },
          // {
          //   action: 'delete',
          //   frequent: false,
          //   icon: '',
          //   class: 'mc-icon-Delete error',
          //   titleClass: 'error',
          //   titleTranslationId: 'action.delete.tooltip',
          //   views: [TabViews.CATALOG, TabViews.SEARCH_RESULTS]
          // },
        ],
      },
    ],
  },
  {
    entity: 'Job',
    actions: [
      {
        id: 0,
        titleTranslationId: 'OperationsOnJobs',
        type: EntityActionsTypes.JOB_ACTIONS,
        group: [
          {
            action: JobAction.download_details,
            frequent: false,
            symbol: { class: 'mc-icon-Download' },
            title: { translationId: 'action.job.download_details' },
            views: [],
          },
        ],
      },
      {
        id: 1,
        titleTranslationId: 'OperationsOnJobs',
        type: EntityActionsTypes.JOB_ACTIONS,
        group: [
          {
            action: JobAction.retry,
            frequent: false,
            symbol: { class: 'mc-icon-Job-Resume' },
            title: { translationId: 'action.job.retry' },
            dependentField: 'availableActions.isResumable',
            views: [],
          },
          {
            action: JobAction.abort,
            frequent: false,
            symbol: { class: 'mc-icon-Job-Abort' },
            title: { translationId: 'action.job.abort' },
            dependentField: 'availableActions.isAbortable',
            views: [],
          },
          {
            action: JobAction.restore,
            frequent: false,
            symbol: { class: 'mc-icon-Upload' },
            title: { translationId: 'action.job.restore' },
            dependentField: 'availableActions.isRestorable',
            views: [],
          },
        ],
      },
    ],
  },
];

export default ACTIONS_CONFIG;
