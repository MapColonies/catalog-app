/* eslint-disable @typescript-eslint/naming-convention */
import { types, getParent } from 'mobx-state-tree';
import { ResponseState } from '../../common/models/response-state.enum';
import CONFIG from '../../common/config';
import { ModelBase } from './ModelBase';
import { IRootStore, RootStoreType } from './RootStore';
import { ContextActions } from '../../common/actions/context.actions';
import { currentSite } from '../../common/helpers/siteUrl';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum UserAction {
  SYSTEM_ACTION_JOBS = 'system_action.jobs',
  SYSTEM_ACTION_COREINFO = 'system_action.coreInfo',
  SYSTEM_ACTION_TOOLS = 'system_action.tools',
  SYSTEM_ACTION_FILTER = 'system_action.filter',
  SYSTEM_ACTION_FREETEXTSEARCH = 'system_action.freeTextSearch',
  SYSTEM_ACTION_SIDEBARCOLLAPSEEXPAND = 'system_action.sidebarCollapseExapnd',

  ENTITY_ACTION_LAYERRASTERRECORD_CREATE = 'entity_action.LayerRasterRecord.create',
  ENTITY_ACTION_LAYER3DRECORD_CREATE = 'entity_action.Layer3DRecord.create',
  ENTITY_ACTION_LAYERDEMRECORD_CREATE = 'entity_action.LayerDemRecord.create',
  ENTITY_ACTION_LAYERRASTERRECORD_EDIT = 'entity_action.LayerRasterRecord.edit',
  ENTITY_ACTION_LAYER3DRECORD_EDIT = 'entity_action.Layer3DRecord.edit',
  ENTITY_ACTION_LAYERDEMRECORD_EDIT = 'entity_action.LayerDemRecord.edit',
  ENTITY_ACTION_VECTORBESTRECORD_EDIT = 'entity_action.VectorBestRecord.edit',
  ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_EDIT = 'entity_action.QuantizedMeshBestRecord.edit',
  ENTITY_ACTION_LAYERRASTERRECORD_UPDATE = 'entity_action.LayerRasterRecord.update',
  ENTITY_ACTION_LAYERRASTERRECORD_DELETE = 'entity_action.LayerRasterRecord.delete',
  ENTITY_ACTION_LAYER3DRECORD_DELETE = 'entity_action.Layer3DRecord.delete',
  ENTITY_ACTION_LAYERDEMRECORD_DELETE = 'entity_action.LayerDemRecord.delete',
  ENTITY_ACTION_LAYERRASTERRECORD_PUBLISH = 'entity_action.LayerRasterRecord.publish',
  ENTITY_ACTION_LAYER3DRECORD_PUBLISH = 'entity_action.Layer3DRecord.publish',
  ENTITY_ACTION_LAYERRASTERRECORD_VIEWER = 'entity_action.LayerRasterRecord.viewer',
  ENTITY_ACTION_LAYER3DRECORD_VIEWER = 'entity_action.Layer3DRecord.viewer',
  ENTITY_ACTION_LAYERDEMRECORD_VIEWER = 'entity_action.LayerDemRecord.viewer',
  ENTITY_ACTION_VECTORBESTRECORD_VIEWER = 'entity_action.VectorBestRecord.viewer',
  ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_VIEWER = 'entity_action.QuantizedMeshBestRecord.viewer',
  ENTITY_ACTION_LAYERRASTERRECORD_SAVEMETADATA = 'entity_action.LayerRasterRecord.saveMetadata',
  ENTITY_ACTION_LAYER3DRECORD_SAVEMETADATA = 'entity_action.Layer3DRecord.saveMetadata',
  ENTITY_ACTION_LAYERDEMRECORD_SAVEMETADATA = 'entity_action.LayerDemRecord.saveMetadata',
  ENTITY_ACTION_VECTORBESTRECORD_SAVEMETADATA = 'entity_action.VectorBestRecord.saveMetadata',
  ENTITY_ACTION_LAYERRASTERRECORD_FLYTO = 'entity_action.LayerRasterRecord.flyTo',
  ENTITY_ACTION_LAYER3DRECORD_FLYTO = 'entity_action.Layer3DRecord.flyTo',
  ENTITY_ACTION_LAYERDEMRECORD_FLYTO = 'entity_action.LayerDemRecord.flyTo',
  ENTITY_ACTION_VECTORBESTRECORD_FLYTO = 'entity_action.VectorBestRecord.flyTo',
  ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_FLYTO = 'entity_action.QuantizedMeshBestRecord.flyTo',
  ENTITY_ACTION_LAYERRASTERRECORD_MOVETOTOP = 'entity_action.LayerRasterRecord.moveToTop',
  ENTITY_ACTION_LAYERRASTERRECORD_MOVEUP = 'entity_action.LayerRasterRecord.moveUp',
  ENTITY_ACTION_LAYERRASTERRECORD_MOVEDOWN = 'entity_action.LayerRasterRecord.moveDown',
  ENTITY_ACTION_LAYERRASTERRECORD_MOVETOBOTTOM = 'entity_action.LayerRasterRecord.moveToBottom',
  ENTITY_ACTION_LAYERRASTERRECORD_EXPORT = 'entity_action.LayerRasterRecord.export',
  ENTITY_ACTION_LAYER3DRECORD_EXPORT = 'entity_action.Layer3DRecord.export',
  ENTITY_ACTION_LAYERDEMRECORD_EXPORT = 'entity_action.LayerDemRecord.export',
  ENTITY_ACTION_VECTORBESTRECORD_EXPORT = 'entity_action.VectorBestRecord.export',
  ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_EXPORT= 'entity_action.QuantizedMeshBestRecord.export',

  FEATURE_SWITCH_USER_ROLE = "featureSwitchUserRole",

  SYSTEM_CALLBACK_EDIT = 'system_callback.editEntity',
  SYSTEM_CALLBACK_PUBLISH = 'system_callback.publish',
  SYSTEM_CALLBACK_DELETE = 'system_callback.delete',
  SYSTEM_CALLBACK_FLYTO = 'system_callback.flyToEntity',
  SYSTEM_CALLBACK_SHOWFOOTPRINT = 'system_callback.showFootprint',
  SYSTEM_CALLBACK_SHOWLAYERIMAGE = 'system_callback.showLayerImage',
  SYSTEM_CALLBACK_SHOWPOLYGONPARTS = 'system_callback.showPolygonParts',
  SYSTEM_CALLBACK_SHOW_PPERROR_ON_UPDATE = 'system_callback.showPPErrorOnUpdate',
}
export type site = {dns: string, isAlias: boolean};

export type siteName = 'master'|'slave'|'generic'|'undefined';

type permissionRule = {
  sites?: siteName[],
  enabled:boolean,
}

type UserActionKeys = { [K in UserAction]?: permissionRule; }
type ContextActionKeys = { [K in ContextActions]?: permissionRule; }

interface IUser {
  userName: string;
  firstName?: string;
  secondName?: string;
  eMail?: string;
  role: UserRole;
}

interface IRole {
  role: UserRole;
  permissions: UserActionKeys | ContextActionKeys;
}

const ROLES: IRole[] = [
  {
    role: UserRole.ADMIN,
    permissions: {
      [UserAction.SYSTEM_ACTION_JOBS]: {enabled: true},
      [UserAction.SYSTEM_ACTION_COREINFO]: {enabled: true},
      [UserAction.SYSTEM_ACTION_TOOLS]: {enabled: true},
      [UserAction.SYSTEM_ACTION_FILTER]: {enabled: false},
      [UserAction.SYSTEM_ACTION_FREETEXTSEARCH]: {enabled: true},
      [UserAction.SYSTEM_ACTION_SIDEBARCOLLAPSEEXPAND]: {enabled: true},
      [UserAction.SYSTEM_CALLBACK_SHOW_PPERROR_ON_UPDATE]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_CREATE]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_CREATE]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_CREATE]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_EDIT]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_EDIT]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_EDIT]: {enabled: false},
      [UserAction.ENTITY_ACTION_VECTORBESTRECORD_EDIT]: {enabled: false},
      [UserAction.ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_EDIT]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_UPDATE]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_DELETE]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_DELETE]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_DELETE]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_PUBLISH]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_PUBLISH]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_VIEWER]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_VIEWER]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_VIEWER]: {enabled: false},
      [UserAction.ENTITY_ACTION_VECTORBESTRECORD_VIEWER]: {enabled: false},
      [UserAction.ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_VIEWER]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_SAVEMETADATA]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_SAVEMETADATA]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_SAVEMETADATA]: {enabled: true},
      [UserAction.ENTITY_ACTION_VECTORBESTRECORD_SAVEMETADATA]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_FLYTO]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_FLYTO]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_FLYTO]: {enabled: true},
      [UserAction.ENTITY_ACTION_VECTORBESTRECORD_FLYTO]: {enabled: true},
      [UserAction.ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_FLYTO]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_MOVETOTOP]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_MOVEUP]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_MOVEDOWN]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_MOVETOBOTTOM]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_EXPORT]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_EXPORT]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_EXPORT]: {enabled: false},
      [UserAction.ENTITY_ACTION_VECTORBESTRECORD_EXPORT]: {enabled: false},
      [UserAction.ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_EXPORT]: {enabled: false},
      [UserAction.FEATURE_SWITCH_USER_ROLE]: {sites:['master','slave'], enabled: true},
      [ContextActions.QUERY_WFS_FEATURE]: {enabled: true},
      [ContextActions.QUERY_DEM_HEIGHT]: {enabled: true},
      [ContextActions.QUERY_POLYGON_PARTS]: {enabled: true},
      [ContextActions.MOVE_LAYER_UP]: {enabled: true},
      [ContextActions.MOVE_LAYER_DOWN]: {enabled: true},
      [ContextActions.MOVE_LAYER_TO_TOP]: {enabled: true},
      [ContextActions.MOVE_LAYER_TO_BOTTOM]: {enabled: true},
    },
  },
  {
    role: UserRole.USER,
    permissions: {
      [UserAction.SYSTEM_ACTION_JOBS]: {enabled: false},
      [UserAction.SYSTEM_ACTION_COREINFO]: {enabled: false},
      [UserAction.SYSTEM_ACTION_TOOLS]: {enabled: true},
      [UserAction.SYSTEM_ACTION_FILTER]: {enabled: false},
      [UserAction.SYSTEM_ACTION_FREETEXTSEARCH]: {enabled: true},
      [UserAction.SYSTEM_ACTION_SIDEBARCOLLAPSEEXPAND]: {enabled: true},
      [UserAction.SYSTEM_CALLBACK_SHOW_PPERROR_ON_UPDATE]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_CREATE]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_CREATE]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_CREATE]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_EDIT]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_EDIT]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_EDIT]: {enabled: false},
      [UserAction.ENTITY_ACTION_VECTORBESTRECORD_EDIT]: {enabled: false},
      [UserAction.ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_EDIT]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_UPDATE]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_DELETE]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_DELETE]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_DELETE]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_PUBLISH]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_PUBLISH]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_VIEWER]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_VIEWER]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_VIEWER]: {enabled: false},
      [UserAction.ENTITY_ACTION_VECTORBESTRECORD_VIEWER]: {enabled: false},
      [UserAction.ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_VIEWER]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_SAVEMETADATA]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_SAVEMETADATA]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_SAVEMETADATA]: {enabled: true},
      [UserAction.ENTITY_ACTION_VECTORBESTRECORD_SAVEMETADATA]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_FLYTO]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_FLYTO]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_FLYTO]: {enabled: true},
      [UserAction.ENTITY_ACTION_VECTORBESTRECORD_FLYTO]: {enabled: true},
      [UserAction.ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_FLYTO]: {enabled: true},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_MOVETOTOP]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_MOVEUP]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_MOVEDOWN]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_MOVETOBOTTOM]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERRASTERRECORD_EXPORT]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYER3DRECORD_EXPORT]: {enabled: false},
      [UserAction.ENTITY_ACTION_LAYERDEMRECORD_EXPORT]: {enabled: false},
      [UserAction.ENTITY_ACTION_VECTORBESTRECORD_EXPORT]: {enabled: false},
      [UserAction.ENTITY_ACTION_QUANTIZEDMESHBESTRECORD_EXPORT]: {enabled: false},
      [UserAction.FEATURE_SWITCH_USER_ROLE]: {sites:['master','slave'], enabled: true},
      [ContextActions.QUERY_WFS_FEATURE]: {enabled: true},
      [ContextActions.QUERY_DEM_HEIGHT]: {enabled: true},
      [ContextActions.QUERY_POLYGON_PARTS]: {enabled: true},
      [ContextActions.MOVE_LAYER_UP]: {enabled: true},
      [ContextActions.MOVE_LAYER_DOWN]: {enabled: true},
      [ContextActions.MOVE_LAYER_TO_TOP]: {enabled: true},
      [ContextActions.MOVE_LAYER_TO_BOTTOM]: {enabled: true},
    },
  },
];

export const userStore = ModelBase
  .props({
    state: types.enumeration<ResponseState>(
      'State',
      Object.values(ResponseState)
    ),
    user: types.maybe(types.frozen<IUser>({userName: 'user', role: CONFIG.DEFAULT_USER.ROLE as UserRole })), /*UserRole.ADMIN*/
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
    const store = self.root;


    function isActionAllowed(action: UserActionKeys | ContextActionKeys | string): boolean{
      const role = ROLES.find(item => item.role === self.user?.role);
      const permissionRules = role && role.permissions[(action as keyof (UserActionKeys | ContextActionKeys))] as permissionRule;

      if (permissionRules) {
        if (permissionRules.enabled && permissionRules.sites) {
          return permissionRules.sites.includes(currentSite());
        }
        return permissionRules.enabled;
      } else {
        return false;
      }
    }

    function changeUserRole(role: UserRole): void {
      self.user = {...self.user, role} as IUser;

      const PRESERVE_STATE_FOR_FIELDS = ['baseMaps', 'entityDescriptors', 'searchParams', 'mapViewerExtentPolygon'];
      store.discreteLayersStore.resetAppState(PRESERVE_STATE_FOR_FIELDS);
      void store.catalogTreeStore.initTree();
    }

    function isUserAdmin(): boolean {
      return self.user?.role === UserRole.ADMIN
    }

    return {
      isActionAllowed,
      changeUserRole,
      isUserAdmin,
    };
  });
  