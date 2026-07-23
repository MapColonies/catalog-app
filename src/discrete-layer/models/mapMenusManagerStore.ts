/* eslint-disable @typescript-eslint/naming-convention */
import { types, getParent } from 'mobx-state-tree';
import { ApplicationContexts, ContextActionGroupProps, ContextActionsGroupTemplates, ContextActionsTemplates, IContextAction, IContextActionGroup, isActionGroup } from '../../common/actions/context.actions';
import { ResponseState } from '../../common/models/response-state.enum';
import { ModelBase } from './ModelBase';
import { IRootStore, RootStoreType } from './RootStore';
import {GetFeatureModelType} from './GetFeatureModel';
import { WfsGetFeatureParams, WfsPolygonPartsGetFeatureParams } from './RootStore.base';
import { IFeatureConfig, IFeatureConfigs } from '../views/components/data-fetchers/wfs-features-fetcher.component';
import { PositionWithHeightModelType } from './PositionWithHeightModel';
import { IPosition } from '../../common/hooks/useHeightFromTerrain';
import { IDispatchAction } from './actionDispatcherStore';
import { BBox } from 'geojson';

interface CommonMenuItem {
  templateId?: ContextActionsTemplates | ContextActionsGroupTemplates;
  mouseEnterAction?: IDispatchAction;
  mouseLeaveAction?: IDispatchAction;
}
export interface MenuItem extends CommonMenuItem {
  title: string;
  action: IContextAction;
  disabled?: boolean;
  icon?: string;
  payloadData?: Record<string, unknown>;
}

export type MenuItemsList = Array<MenuItem | MenuItemsGroup>;

export interface MenuItemsGroup extends CommonMenuItem {
  title: string;
  groupProps: ContextActionGroupProps;
  items: MenuItemsList;
  icon?: string;
}


// A "type guard" helper function to infer if a menu item is a group or a single menu item.
export const isMenuItemGroup = (menuItem: MenuItem | MenuItemsGroup): menuItem is MenuItemsGroup => {
  return (menuItem as MenuItemsGroup)?.items !== undefined;
}

export type DynamicMenuData = { 
  [K in ContextActionsGroupTemplates | ContextActionsTemplates]: unknown;
}

export interface IMapMenuProperties {
  itemsList: MenuItemsList;
  dynamicMenuData?: DynamicMenuData,
  heightBuffer?: number;
  absoluteHeight?: number;
};

export enum MapMenusIds {
    ActionsMenu = 'ActionsMenu',
    // BestsMenu = 'BestsMenu',
}

export type MapMenus = {
    [key in MapMenusIds]? : IMapMenuProperties;
}

export type WfsFeatureInfo = GetFeatureModelType & Pick<WfsGetFeatureParams, 'pointCoordinates' | 'typeName'> & { config: IFeatureConfig };
export type PolygonPartsWfsFeatureInfo = GetFeatureModelType & Pick<WfsPolygonPartsGetFeatureParams, 'feature'>;

export const mapMenusManagerStore = ModelBase
  .props({
    state: types.enumeration<ResponseState>(
      'State',
      Object.values(ResponseState)
    ),
    mapMenus: types.maybe(types.frozen<MapMenus>()),
    wfsFeatureTypes: types.maybe(types.frozen<string[]>()),
    wfsFeatureConfigs: types.maybe(types.frozen<IFeatureConfigs>()),
    currentWfsFeatureInfo: types.maybe(types.frozen<WfsFeatureInfo>()),
    currentPolygonPartsInfo: types.maybe(types.frozen<PolygonPartsWfsFeatureInfo>()),
    multiplePolygonPartsBBox: types.maybe(types.frozen<BBox>()),
    currentPositionDemHeight: types.maybe(types.frozen<PositionWithHeightModelType>()),
    lastMenuCoordinate: types.maybe(types.frozen<IPosition>()),
    total: types.maybe(types.frozen<number>()),
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


    function getActionsMenuProperties(): MapMenus {
      const mapContextActions = store.actionDispatcherStore.getContextActionGroups(ApplicationContexts.MAP_CONTEXT);

      const buildGroupItemsList = (actions: (IContextActionGroup | IContextAction)[]): MenuItemsList => {
        const itemsList: MenuItemsList = [];

        actions.forEach(groupOrAction => {
          if (!isActionGroup(groupOrAction)) {
            if (!store.userStore.isActionAllowed(groupOrAction.action) as boolean) return;
            
            const item: MenuItem = {
              action: {...groupOrAction},
              title: groupOrAction.title.translationId,
              icon: groupOrAction.symbol.icon,
              templateId: groupOrAction.templateId,
              disabled: !store.servicesAvailabilityStore.isActionAvailable(groupOrAction.action)
            };

            itemsList.push(item);
          } else {
            const {actions, ...groupWithoutActions} = groupOrAction;
            const group: MenuItemsGroup = {
              title: groupOrAction.titleTranslationId,
              icon: groupOrAction.icon,
              groupProps: groupWithoutActions,
              templateId: groupOrAction.templateId,
              items: buildGroupItemsList(actions)
            };

            itemsList.push(group);
          }
        });

        return itemsList;
      }
      
      return {
        ActionsMenu: {
          itemsList: buildGroupItemsList(mapContextActions),
          heightBuffer: 70
        }
      }

  }

    function initStore(): void {
      self.mapMenus = {
          ...getActionsMenuProperties(),
          // ...getBestMenuProperties(),
      }
    }

    function setWfsTotal(total: number): void {
      self.total = total;
    }

    function setWfsFeatureConfigs(wfsFeatureConfigs: IFeatureConfigs): void {
      self.wfsFeatureTypes = Object.keys(wfsFeatureConfigs);
      self.wfsFeatureConfigs = wfsFeatureConfigs;
    }

    function setCurrentWfsFeatureInfo(currentFeatureInfo: Omit<WfsFeatureInfo , 'config'>): void {
      const featureInfoWithConfig: WfsFeatureInfo = {...currentFeatureInfo, config: getFeatureConfig(currentFeatureInfo.typeName)};
      
      self.currentWfsFeatureInfo = featureInfoWithConfig;
    }
    
    function setCurrentPositionDemHeight(currentPositionDemHeight: PositionWithHeightModelType): void {
      self.currentPositionDemHeight = currentPositionDemHeight;
    }

    function setCurrentPolygonPartsInfo(currentPositionDemHeight: PolygonPartsWfsFeatureInfo): void {
      self.currentPolygonPartsInfo = currentPositionDemHeight;
    }

    function setLastMenuCoordinate(menuCoordinate: IPosition): void {
      self.lastMenuCoordinate = menuCoordinate;
    }
    
    function setMultiplePolygonPartsBBox(polygonPartsBBox: BBox): void {
      self.multiplePolygonPartsBBox = polygonPartsBBox;
    }


    function getFeatureConfig(typeName: string): IFeatureConfig {
      return self.wfsFeatureConfigs?.[typeName] as IFeatureConfig;
    }

    function resetWfsInfo(): void {
      self.currentWfsFeatureInfo = undefined;
    }

    function resetDemHeightInfo(): void {
      self.currentPositionDemHeight = undefined;
    }

    function resetMultiplePolygonPartsBBox(): void {
      self.multiplePolygonPartsBBox = undefined;
    }

    function resetPolygonPartsInfo(): void {
      self.currentPolygonPartsInfo = undefined;
      resetMultiplePolygonPartsBBox();
    }

    function resetMapMenusFeatures(): void {
      resetPolygonPartsInfo();
      resetWfsInfo();
      resetDemHeightInfo();

    }

    return {
      setCurrentWfsFeatureInfo,
      setCurrentPositionDemHeight,
      setCurrentPolygonPartsInfo,
      setWfsFeatureConfigs,
      setLastMenuCoordinate,
      setMultiplePolygonPartsBBox,
      getFeatureConfig,
      resetMapMenusFeatures,
      initStore,
      setWfsTotal,
    }
  });
