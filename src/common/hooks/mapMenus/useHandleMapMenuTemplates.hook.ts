import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import { IContextMenuData } from '@map-colonies/react-components';
import {
  DynamicMenuData,
  IMapMenuProperties,
  MenuItem,
  MenuItemsGroup,
  MenuItemsList,
  isMenuItemGroup,
} from '../../../discrete-layer/models/mapMenusManagerStore';
import { useStore } from '../../../discrete-layer/models';
import { IDispatchAction } from '../../../discrete-layer/models/actionDispatcherStore';
import { DEFAULT_LAYER_HUE_FACTOR } from '../../../discrete-layer/views/components/map-action-resolver.component';
import {
  ContextActionGroupProps,
  ContextActions,
  ContextActionsGroupTemplates,
  ContextActionsTemplates,
} from '../../actions/context.actions';
import CONFIG from '../../config';

export const useHandleMapMenuTemplates = (
  menuProperties?: IMapMenuProperties,
  contextProps?: IContextMenuData
): IMapMenuProperties | undefined => {
  /**
   *  The hook should be able to generate the menu properties passed as an argument,
   *  using some dynamic data based on the specific logic for each template (Action template / Group Template).
   *
   * - A template should be used to duplicate the same logic / actions multiple times according to a dynamic data.
   * - How dynamic the template is? when should we re-template the data? it could be an expensive process and we must be able to declare how often to re process.
   * - Here we need to contain all of the logic for the templates based on a templateId inside either a group or an action.
   */

  const generatedMenuRef = useRef<IMapMenuProperties>();
  const intl = useIntl();
  const [generatedMenu, setGeneratedMenu] = useState<IMapMenuProperties>();

  // Gather all of the data to be used in the process to build the complete menu. store / contexts / hooks / etc.
  const store = useStore();
  const activeLayersInPosition = contextProps?.data as Record<
    string,
    unknown
  >[];
  const wfsFeatureTypesList = store.mapMenusManagerStore.wfsFeatureTypes ?? [];

  // This object holds the data that used to generate menu items from templates.

  const dynamicMenuData: DynamicMenuData = useMemo(
    () => ({
      [ContextActionsGroupTemplates.ACTIVE_LAYERS_IN_POSITION]:
        activeLayersInPosition,
      [ContextActionsTemplates.WFS_QUERY_FEATURES]: wfsFeatureTypesList,
    }),
    [activeLayersInPosition, wfsFeatureTypesList]
  );

  const handleActionTemplates = (
    actionTemplateMenuItem: MenuItem
  ): MenuItemsList => {
    switch (actionTemplateMenuItem.templateId) {
      case ContextActionsTemplates.WFS_QUERY_FEATURES: {
        const wfsFeatureTypesList = dynamicMenuData[
          ContextActionsTemplates.WFS_QUERY_FEATURES
        ] as string[];
        const wfsQueryMenuItems: MenuItem[] = wfsFeatureTypesList.map(
          (feature) => {
            const featureConfig =
              store.mapMenusManagerStore.getFeatureConfig(feature);
            const featureTitle = featureConfig.translationId ?? feature;

            return {
              title: featureTitle,
              icon: featureConfig.icon,
              action: { ...actionTemplateMenuItem.action },
              payloadData: { feature },
            };
          }
        );
        return wfsQueryMenuItems;
      }
      default:
        return [actionTemplateMenuItem];
    }
  };

  const handleGroupTemplates = (
    groupTemplateMenuItem: MenuItemsGroup
  ): MenuItemsList => {
    const generatedGroups: MenuItemsList = [];

    switch (groupTemplateMenuItem.templateId) {
      case ContextActionsGroupTemplates.ACTIVE_LAYERS_IN_POSITION: {
        const activeLayersInPosition = dynamicMenuData[
          ContextActionsGroupTemplates.ACTIVE_LAYERS_IN_POSITION
        ] as Record<string, unknown>[];
        const templateProps = groupTemplateMenuItem.groupProps;
        const MAX_ACTIVE_LAYERS_TO_PRESENT =
          CONFIG.CONTEXT_MENUS.MAP.MAX_ACTIVE_LAYERS_TO_PRESENT;
        const slicedActiveLayers = activeLayersInPosition.slice(
          0,
          MAX_ACTIVE_LAYERS_TO_PRESENT
        );

        // Some pinkish color
        const HOVERED_LAYER_HUE_FACTOR = 30;

        slicedActiveLayers.forEach((activeLayer) => {
          const groupProp: ContextActionGroupProps = {
            ...templateProps,
            id: templateProps.id + 1,
            // @ts-ignore
            titleTranslationId: activeLayer.meta?.layerRecord
              ?.productName as string,
          };

          const mouseEnterAction: IDispatchAction = {
            action: ContextActions.HIGHLIGHT_ACTIVE_LAYER,
            data: {
              ...(activeLayer.meta as Record<string, unknown>),
              hue: HOVERED_LAYER_HUE_FACTOR,
            },
          };

          const mouseLeaveAction: IDispatchAction = {
            action: ContextActions.HIGHLIGHT_ACTIVE_LAYER,
            data: {
              ...(activeLayer.meta as Record<string, unknown>),
              hue: DEFAULT_LAYER_HUE_FACTOR,
            },
          };

          const generatedGroup: MenuItemsGroup = {
            ...groupTemplateMenuItem,
            groupProps: groupProp,
            title: groupProp.titleTranslationId,
            items: groupTemplateMenuItem.items.map((item) => {
              if (!isMenuItemGroup(item)) {
                return {
                  ...item,
                  payloadData: activeLayer.meta as Record<string, unknown>,
                };
              }

              return item;
            }),
            mouseEnterAction,
            mouseLeaveAction,
          };

          generatedGroups.push(generatedGroup);
        });

        return generatedGroups;
      }
      default:
        const tempGroup = { ...groupTemplateMenuItem };
        // Check if group holds WFS actions by presence at least one such item
        const wfsFeature = groupTemplateMenuItem.items.find((item) => {
          const menuItem = item as MenuItem;
          return menuItem.action
            ? menuItem.action.action === ContextActions.QUERY_WFS_FEATURE
            : false;
        });
        if (wfsFeature) {
          tempGroup.groupProps.titleTranslationId = intl.formatMessage(
            {
              id: tempGroup.groupProps.titleTranslationId,
            },
            {
              extraInfo: `(${groupTemplateMenuItem.items.length}/${store.mapMenusManagerStore.total})`,
            }
          );
        }
        return [tempGroup];
    }
  };

  // Iterate through the menu (and sub-menu) properties and handle the templates logic based on the templateId.
  // Returns the menu after the processing.
  const getGeneratedMenu = (items?: MenuItemsList): IMapMenuProperties => {
    const menuItems: MenuItemsList = [];
    const itemsList = items ?? menuProperties?.itemsList;

    itemsList?.forEach((item) => {
      if (!isMenuItemGroup(item)) {
        // Handle action templates
        const generatedActions: MenuItemsList = handleActionTemplates(item);
        menuItems.push(...generatedActions);
        return;
      } else {
        // Handle group templates
        const generatedGroups: MenuItemsList = handleGroupTemplates({
          ...item,
          items: getGeneratedMenu(item.items).itemsList,
        });

        menuItems.push(...generatedGroups);
        return;
      }
    });

    return { ...menuProperties, itemsList: menuItems };
  };

  useEffect(() => {
    if (
      typeof menuProperties !== 'undefined' &&
      typeof contextProps !== 'undefined'
    ) {
      const newMenu = { ...getGeneratedMenu(), dynamicMenuData };
      const arePrvMenuEqual = _.isEqual(newMenu, generatedMenuRef.current);
      if (!arePrvMenuEqual) {
        generatedMenuRef.current = newMenu;
        setGeneratedMenu(newMenu);
      }
    }
  }, [contextProps?.contextEvt]);

  return generatedMenu;
};
