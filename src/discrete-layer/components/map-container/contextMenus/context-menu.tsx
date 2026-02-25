import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { get } from 'lodash';
import {
  Icon,
  Tooltip,
  ContextMenu as MCContextMenu,
  Item,
  Separator,
  Submenu,
  useContextMenu,
} from '@map-colonies/react-core';
import { Box, IContextMenuData } from '@map-colonies/react-components';
import CONFIG from '../../../../common/config';
import './context-menu.css';
import { useIntl } from 'react-intl';
import {
  ActionSpreadPreference,
  SeparatorPosition,
} from '../../../../common/actions/context.actions';
import {
  MenuItem,
  MenuItemsList,
  isMenuItemGroup,
} from '../../../models/mapMenusManagerStore';
import TooltippedValue from '../../../../common/components/form/tooltipped.value';
import { IDispatchAction } from '../../../models/actionDispatcherStore';

export const TITLE_HEIGHT = 24;
export const SUB_MENU_MAX_HEIGHT = 120;
export const MENU_HEIGHT_PADDING = 20;

export type ContextMenuItemRenderer = React.FC<{ item: MenuItem }>;

interface IMapContextMenuData extends IContextMenuData {
  menuTitle?: string;
  menuTitleTooltip?: string;
  menuTitleComponent?: React.ReactNode;
  ItemRenderer: ContextMenuItemRenderer;
  menuItems?: MenuItemsList;
  contextMenuId?: string;
  dispatchAction?: (action: IDispatchAction) => void;
}

const DEFAULT_CONTEXT_MENU_ID = 'MENU_ID';

// Children prop isn't rendered as a part of the menu, but as a separated bottom section.
export const ContextMenu: React.FC<PropsWithChildren<IMapContextMenuData>> = ({
  position,
  // coordinates,
  style,
  size,
  handleClose,
  menuItems,
  ItemRenderer,
  menuTitle = '',
  menuTitleTooltip = '',
  menuTitleComponent,
  children,
  data,
  contextEvt,
  contextMenuId = DEFAULT_CONTEXT_MENU_ID,
  dispatchAction,
}) => {
  const intl = useIntl();
  const imageryContextMenuRef = useRef(null);
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const direction =
    CONFIG.I18N.DEFAULT_LANGUAGE.toUpperCase() === 'HE' ? 'rtl' : 'ltr';

  const { show, hideAll } = useContextMenu({
    id: contextMenuId,
    locale: {
      dir: direction,
    },
  });

  const handleClickOutside = useCallback(
    (event: MouseEvent): void => {
      /* eslint-disable */
      const target: any = event.target;
      const imgContextMenuRef: any = get(imageryContextMenuRef, 'current');
      if (imgContextMenuRef && !imgContextMenuRef.contains(target)) {
        document.removeEventListener('click', handleClickOutside, false);
        handleClose();
        hideAll();
      }
      /* eslint-enable */
    },
    [imageryContextMenuRef]
  );

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, false);

    if (!isContextMenuVisible) {
      setTimeout(() => {
        show({ event: contextEvt });
      }, 0);
    }
  });

  const MenuItemWithSeparator: React.FC<
    PropsWithChildren<{
      separator?: SeparatorPosition;
      separatorKeySuffix?: string;
      showSeparatorBefore?: boolean;
      showSeparatorAfter?: boolean;
    }>
  > = ({
    separator,
    separatorKeySuffix,
    showSeparatorBefore,
    showSeparatorAfter,
    children,
  }) => {
    return (
      <>
        {separator === 'BEFORE' && showSeparatorBefore && (
          <Separator key={`separator_before_${separatorKeySuffix}`} />
        )}

        {children}

        {separator === 'AFTER' && showSeparatorAfter && (
          <Separator key={`separator_after_${separatorKeySuffix}`} />
        )}
      </>
    );
  };

  const MenuContent: React.FC<{
    items?: MenuItemsList;
    isSubmenuItem?: boolean;
  }> = ({ items, isSubmenuItem }) => {
    const itemsList = items ?? menuItems;

    if (!itemsList || !itemsList.length) return null;

    return (
      <>
        {itemsList.map((menuItemOrGroup, idx) => {
          const nextItem = itemsList[idx + 1];
          const itemBefore = itemsList[idx - 1];

          // For separators logic
          const isLastItem = idx === itemsList.length - 1;
          const isFirstItem = idx === 0;
          const isNextItemEmpty =
            isMenuItemGroup(nextItem) && nextItem.items.length === 0;
          const isItemBeforeEmpty =
            isMenuItemGroup(itemBefore) && itemBefore.items.length > 0;
          const isEmptyItem =
            isMenuItemGroup(menuItemOrGroup) &&
            menuItemOrGroup.items.length === 0;

          // Not first item, item before not empty
          const showSeparatorBefore =
            !isEmptyItem && !isFirstItem && !isItemBeforeEmpty;

          // Not last item, not empty item, item after not empty
          const showSeparatorAfter =
            !isEmptyItem && !isLastItem && !isNextItemEmpty;

          const handleMouseEnter = () =>
            dispatchAction && menuItemOrGroup.mouseEnterAction && !isSubmenuItem
              ? dispatchAction(menuItemOrGroup.mouseEnterAction)
              : undefined;
          const handleMouseLeave = () =>
            dispatchAction && menuItemOrGroup.mouseLeaveAction && !isSubmenuItem
              ? dispatchAction(menuItemOrGroup.mouseLeaveAction)
              : undefined;

          if (!isMenuItemGroup(menuItemOrGroup)) {
            const itemElement = (
              <ItemRenderer item={menuItemOrGroup} key={`menuItem_${idx}`} />
            );

            const menuItemDisabled = menuItemOrGroup.disabled ?? false;

            return (
              <MenuItemWithSeparator
                separatorKeySuffix={`${idx}`}
                separator={menuItemOrGroup.action.separator}
                showSeparatorBefore={showSeparatorBefore}
                showSeparatorAfter={showSeparatorAfter}
              >
                <Item
                  className="imageryMenuItemAction"
                  key={`imageryMenuItemAction_${menuItemOrGroup.title}_${idx}`}
                  style={{ pointerEvents: menuItemDisabled ? 'none' : 'unset' }}
                  disabled={menuItemDisabled as boolean}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {itemElement}
                </Item>
              </MenuItemWithSeparator>
            );
          } else {
            const groupProps = menuItemOrGroup.groupProps;
            let groupToRender: JSX.Element = <></>;

            // Spread sections by preferences
            const shouldPresentAsMenu =
              groupProps?.actionsSpreadPreference ===
                ActionSpreadPreference.MENU &&
              menuItemOrGroup.items.length >=
                (groupProps.minimumItemsInMenu ?? 0);

            if (shouldPresentAsMenu && menuItemOrGroup.items.length > 0) {
              const menuTitle = (
                <TooltippedValue disableTooltip className={'contextMenuLabel'}>
                  {intl.formatMessage({
                    id: groupProps.titleTranslationId ?? 'Sub Menu',
                  })}
                </TooltippedValue>
              );
              groupToRender = (
                <Submenu
                  key={`imageryMenuGroupItems_${menuItemOrGroup.groupProps.id}`}
                  dir={direction}
                  label={menuTitle}
                  onMouseOver={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <MenuContent isSubmenuItem items={menuItemOrGroup.items} />
                </Submenu>
              );
            } else {
              groupToRender = (
                <>
                  <MenuContent items={menuItemOrGroup.items} />
                </>
              );
            }

            return (
              <MenuItemWithSeparator
                separatorKeySuffix={`${menuItemOrGroup.groupProps.id}`}
                separator={menuItemOrGroup.groupProps.separator}
                showSeparatorBefore={showSeparatorBefore}
                showSeparatorAfter={showSeparatorAfter}
              >
                {groupToRender}
              </MenuItemWithSeparator>
            );
          }
        })}
      </>
    );
  };

  return (
    <>
      {menuItems && (
        <div
          ref={imageryContextMenuRef}
          style={style}
          className="imageryContextMenuTheme imageryContextMenu"
          onContextMenu={(e): void => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e): void => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {(menuTitle || menuTitleComponent) && (
            <Box
              style={{ height: `${TITLE_HEIGHT}px` }}
              className="titleContainer"
            >
              <Box className="imageryContextMenuTitle">
                {menuTitleComponent ? (
                  menuTitleComponent
                ) : (
                  <>
                    {`${menuTitle} `}
                    {menuTitle && menuTitleTooltip && (
                      <Tooltip content={menuTitleTooltip}>
                        <Icon
                          className="imageryContextMenuTitleInfo"
                          icon={{ icon: 'info', size: 'small' }}
                        />
                      </Tooltip>
                    )}
                  </>
                )}
              </Box>
            </Box>
          )}

          <MCContextMenu
            isContainerized
            onVisibilityChange={setIsContextMenuVisible}
            animation={false}
            id={contextMenuId}
            dir={direction}
          >
            <MenuContent />
          </MCContextMenu>
          <Box
            style={{
              maxHeight: `${SUB_MENU_MAX_HEIGHT}px`,
              overflow: 'hidden',
            }}
            className="subMenuContainer"
          >
            {children}
          </Box>
        </div>
      )}
    </>
  );
};
