import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import { observer } from 'mobx-react-lite';
import {
  IContextMenuData,
  Box,
  CesiumCartographic,
} from '@map-colonies/react-components';
import { CircularProgress, Icon, Typography } from '@map-colonies/react-core';
import { useHeightFromTerrain } from '../../../../common/hooks/useHeightFromTerrain';
import useGetMenuProperties from '../../../../common/hooks/mapMenus/useGetMenuProperties.hook';
import TooltippedValue from '../../../../common/components/form/tooltipped.value';
import CONFIG from '../../../../common/config';
import { useStore } from '../../../models';
import { IDispatchAction } from '../../../models/actionDispatcherStore';
import { MapMenusIds } from '../../../models/mapMenusManagerStore';
import { getCoordinatesDisplayText } from '../../layer-details/utils';
import { TypeIcon } from '../../../../common/components/shared/type-icon';
import useGetMenuDimensions from '../../../../common/hooks/mapMenus/useGetMenuDimensions';
import { ContextMenu, ContextMenuItemRenderer } from './context-menu';
import ActionsMenuDimensionsContext from './contexts/actionsMenuDimensionsContext';

import './actions.context-menu.css';

interface IActionsContextMenuProps extends IContextMenuData {}

export const COORDS_DISPLAY_PRECISION = 1;
const FIRST = 0;

export const ActionsContextMenu: React.FC<IActionsContextMenuProps> = observer(
  (props) => {
    const { handleClose, coordinates } = props;
    const store = useStore();
    const intl = useIntl();
    const menuTitleIconRef = React.createRef<HTMLElement>();
    const heightsAtCoordinates = useHeightFromTerrain({
      position: [{ ...coordinates }],
    });
    const menuProperties = useGetMenuProperties(MapMenusIds.ActionsMenu, props);

    const { actionsMenuDimensions, setActionsMenuDimensions } = useContext(
      ActionsMenuDimensionsContext
    );
    const actionsContextMenuDimensions = useGetMenuDimensions(
      menuProperties,
      35
    );

    useEffect(() => {
      const areSameDimensions = _.isEqual(
        actionsMenuDimensions,
        actionsContextMenuDimensions
      );

      if (actionsContextMenuDimensions && !areSameDimensions) {
        setActionsMenuDimensions(actionsContextMenuDimensions);
      }
    }, [actionsContextMenuDimensions]);

    useEffect(() => {
      menuTitleIconRef.current?.classList.remove('loading');
    }, [props.contextEvt]);

    const dispatchAction = useCallback((action: IDispatchAction): void => {
      store.actionDispatcherStore.dispatchAction({
        action: action.action,
        data: { ...action.data, coordinates, handleClose },
      } as IDispatchAction);
    }, []);

    const MenuItemRenderer: ContextMenuItemRenderer = ({ item }) => {
      const actionToDispatch = useMemo(
        () => ({
          action: item.action.action,
          data: { ...item.payloadData },
        }),
        [item]
      );

      return (
        <Box
          className="actionsMenuItem"
          onClick={(): void => {
            dispatchAction(actionToDispatch);

            menuTitleIconRef.current?.classList.add('loading');
          }}
        >
          {typeof item.icon !== 'undefined' && (
            <Icon className={`featureIcon ${item.icon}`} />
          )}

          <TooltippedValue
            disableTooltip
            className={'actionsContextMenuItemLabel'}
          >
            {intl.formatMessage({ id: item.title })}
          </TooltippedValue>
        </Box>
      );
    };

    const getHeightText = (): string => {
      const coordinateHeight = (
        heightsAtCoordinates.newPositions?.[FIRST] as CesiumCartographic
      ).height;

      if (typeof coordinateHeight !== 'undefined' && !isNaN(coordinateHeight)) {
        return `${coordinateHeight.toFixed(
          COORDS_DISPLAY_PRECISION
        )} ${intl.formatMessage({ id: 'actions.meter.sign' })}`;
      }

      return `N/A`;
    };

    const getActiveLayersText = (): string | undefined => {
      const MAX_ACTIVE_LAYERS_TO_PRESENT =
        CONFIG.CONTEXT_MENUS.MAP.MAX_ACTIVE_LAYERS_TO_PRESENT;
      const activeLayersInPosition = menuProperties?.dynamicMenuData
        ?.ACTIVE_LAYERS_IN_POSITION as unknown[] | undefined;

      if (activeLayersInPosition) {
        if (activeLayersInPosition.length <= MAX_ACTIVE_LAYERS_TO_PRESENT)
          return;

        const title = intl.formatMessage(
          { id: 'map-context-menu.title' },
          {
            activeLayers: activeLayersInPosition.length,
            maxLayersToPresent: MAX_ACTIVE_LAYERS_TO_PRESENT,
          }
        );

        return title;
      }

      return;
    };

    const activeLayersText = useMemo(getActiveLayersText, [
      menuProperties?.dynamicMenuData,
    ]);

    return (
      <ContextMenu
        menuItems={menuProperties?.itemsList}
        ItemRenderer={MenuItemRenderer}
        menuTitleComponent={
          <Box className="coordinatesContainer">
            <Icon
              ref={menuTitleIconRef}
              className={`menuIcon mc-icon-Location-Full`}
            />
            {getCoordinatesDisplayText(
              coordinates.latitude,
              coordinates.longitude
            )}
          </Box>
        }
        dispatchAction={dispatchAction}
        {...props}
      >
        <Box className="contextMenuFooter">
          <Box className="heightContainer">
            <Icon className="menuIcon mc-icon-Height-DTM" />
            <Typography tag="p">
              {heightsAtCoordinates.isLoadingData ? (
                <CircularProgress />
              ) : (
                getHeightText()
              )}
            </Typography>
          </Box>
          {activeLayersText && (
            <Box className="activeLayersMessageContainer">
              <TypeIcon
                typeName={'ORTHOPHOTO'}
                className={'menuIcon'}
                style={{
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                }}
              />
              {activeLayersText}
            </Box>
          )}
        </Box>
      </ContextMenu>
    );
  }
);
