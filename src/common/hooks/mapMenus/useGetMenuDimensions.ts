import { get } from 'lodash';
import { useMemo } from 'react';
import { useTheme } from '@map-colonies/react-core';
import {
  TITLE_HEIGHT,
  SUB_MENU_MAX_HEIGHT,
} from '../../../discrete-layer/components/map-container/contextMenus/context-menu';
import {
  IMapMenuProperties,
  isMenuItemGroup,
} from '../../../discrete-layer/models/mapMenusManagerStore';
import { IDimensions } from '../useElementDimensions.hook';

export interface MenuDimensions extends IDimensions {
  dynamicHeightIncrement: number;
}

const useGetMenuDimensions = (
  menuProperties?: IMapMenuProperties,
  customDynamicHeightIncrement?: number
): MenuDimensions | undefined => {
  const theme = useTheme();

  const menuDimensions = useMemo((): MenuDimensions | undefined => {
    if (typeof menuProperties === 'undefined') return undefined;

    const DEFAULT_HEIGHT_BUFFER = 5;
    const themedMenuItemHeight = Number(
      (get(theme, 'gcMenuItemHeight') as string).split('px')[0]
    );
    const themedContextMenuWidth = Number(
      (get(theme, 'gcContextMenuWidth') as string).split('px')[0]
    );

    const numberOfMenuItems = menuProperties.itemsList.reduce(
      (itemsCount, menuItemOrGroup) => {
        if (!isMenuItemGroup(menuItemOrGroup)) return ++itemsCount;
        return itemsCount + menuItemOrGroup.items.length;
      },
      0
    );
    const calculatedMenuHeight =
      menuProperties.absoluteHeight ??
      numberOfMenuItems * themedMenuItemHeight +
        (menuProperties.heightBuffer ?? DEFAULT_HEIGHT_BUFFER) +
        TITLE_HEIGHT;

    return {
      width: themedContextMenuWidth,
      height: calculatedMenuHeight,
      dynamicHeightIncrement:
        customDynamicHeightIncrement ?? SUB_MENU_MAX_HEIGHT,
    };
  }, [menuProperties]);

  return menuDimensions;
};

export default useGetMenuDimensions;
