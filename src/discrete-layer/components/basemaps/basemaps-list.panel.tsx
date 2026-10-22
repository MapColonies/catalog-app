import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useIntl } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import type { BasemapsPanelProps } from './basemaps-router.component';
import {
  Button,
  IconButton,
  List,
  ListDivider,
  ListItem,
  ListItemGraphic,
  ListItemMeta,
  ListItemPrimaryText,
  ListItemSecondaryText,
  ListItemText,
  Menu,
  MenuItem,
  MenuSurfaceAnchor,
  Tooltip,
  Typography,
} from '@map-colonies/react-core';
import { shouldRenderSeparator } from '../../../common/helpers/actionsHelper';
import {
  BASEMAP_ENTITY,
  BasemapAction,
  CRUDAction,
  GeneralAction,
  IAction,
  IActionGroup,
} from '../../../common/actions/entity.actions';
import { useStore } from '../../models';
import { BasemapOutput } from './XXXbasemapMockXXX';

import './basemaps-list.panel.css';

interface BasemapRowProps {
  basemap: BasemapOutput;
  isShown: boolean;
  onToggleShow: (id: string) => void;
  actions: IActionGroup[];
  onAction: (action: IAction['action'], id: string) => void;
  scrollTick: number;
}

const BasemapRow: React.FC<BasemapRowProps> = ({
  basemap,
  isShown,
  onToggleShow,
  actions,
  onAction,
  scrollTick,
}) => {
  const intl = useIntl();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [scrollTick]);

  const frequentActions = actions.flatMap((actionGroup) =>
    actionGroup.group.filter((action) => action.frequent)
  );
  const menuActions = actions
    .map((actionGroup) => ({
      ...actionGroup,
      group: actionGroup.group.filter((action) => !action.frequent),
    }))
    .filter((actionGroup) => actionGroup.group.length > 0);

  return (
    <>
      <ListItem className="basemapListItem">
        <ListItemGraphic
          icon={<img className="basemapThumbnail" src={basemap.thumbnail.url} alt={basemap.name} />}
        />
        <ListItemText className="basemapListItemText">
          <ListItemPrimaryText>{basemap.name}</ListItemPrimaryText>
          {basemap.isCurrent && (
            <ListItemSecondaryText className="basemapBadge basemapBadgeCurrent">
              {intl.formatMessage({ id: 'basemaps.list.current-map' })}
            </ListItemSecondaryText>
          )}
          {basemap.isForPreview && (
            <ListItemSecondaryText className="basemapBadge basemapBadgePreview">
              {intl.formatMessage({ id: 'basemaps.list.preview-map' })}
            </ListItemSecondaryText>
          )}
        </ListItemText>
        <ListItemMeta className="basemapListItemActions">
          <IconButton
            className={isShown ? 'mc-icon-Show' : 'mc-icon-Hide'}
            onClick={(): void => onToggleShow(basemap.id)}
          />
          {frequentActions.map((action) => (
            <IconButton
              key={action.action}
              className={action.symbol.class}
              onClick={(): void => onAction(action.action, basemap.id)}
            />
          ))}
          {menuActions.length > 0 && (
            <MenuSurfaceAnchor>
              <Menu
                renderToPortal=".app-container"
                fixed
                open={isMenuOpen}
                focusOnOpen={false}
                onClose={(): void => setIsMenuOpen(false)}
              >
                {menuActions.map((actionGroup, groupIdx) => (
                  <React.Fragment key={actionGroup.id}>
                    {shouldRenderSeparator(actionGroup, groupIdx) && (
                      <Box className="menuSeparator" />
                    )}
                    {actionGroup.group.map((action) => (
                      <MenuItem
                        key={action.action}
                        onClick={(): void => {
                          onAction(action.action, basemap.id);
                          setIsMenuOpen(false);
                        }}
                      >
                        <Box className="basemapMenuItem">
                          {(action.symbol.class || action.symbol.icon) && (
                            <IconButton className={action.symbol.class} icon={action.symbol.icon} />
                          )}
                          <Typography tag="span">
                            {intl.formatMessage({ id: action.title.translationId })}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </React.Fragment>
                ))}
              </Menu>
              <IconButton
                className="mc-icon-More"
                onClick={(): void => setIsMenuOpen(!isMenuOpen)}
              />
            </MenuSurfaceAnchor>
          )}
        </ListItemMeta>
      </ListItem>
      <ListDivider />
    </>
  );
};

export const BasemapsListPanel: React.FC<BasemapsPanelProps<'BasemapsList'>> = observer(
  ({ navigation }) => {
    const intl = useIntl();
    const store = useStore();
    const { basemapsStore } = store;
    const basemapActions = store.actionDispatcherStore.getEntityActionGroups(BASEMAP_ENTITY);
    const [scrollTick, setScrollTick] = useState<number>(0);

    useEffect(() => {
      void basemapsStore.getBasemaps();
    }, [basemapsStore]);

    const basemaps = basemapsStore.basemaps ?? [];

    return (
      <Box className="basemapsListPanel">
        <Box className="basemapsListPanelHeader">
          <Typography tag="h2">{intl.formatMessage({ id: 'basemaps.list.title' })}</Typography>
          <Box className="basemapsListPanelHeaderActions">
            <Tooltip content={intl.formatMessage({ id: 'basemaps.list.import.tooltip' })}>
              <Button
                type="button"
                className="actionButton"
                outlined
                onClick={(): void => navigation.navigate('EditBasemap')}
              >
                {intl.formatMessage({ id: 'basemaps.list.import' })}
              </Button>
            </Tooltip>
            <Tooltip content={intl.formatMessage({ id: 'basemaps.list.new.tooltip' })}>
              <Button
                type="button"
                className="actionButton"
                raised
                onClick={(): void => navigation.navigate('EditBasemap')}
              >
                {intl.formatMessage({ id: 'basemaps.list.new' })}
              </Button>
            </Tooltip>
          </Box>
        </Box>
        <List className="basemapsList" onScroll={(): void => setScrollTick((tick) => tick + 1)}>
          {basemaps.map((basemap) => (
            <BasemapRow
              key={basemap.id}
              basemap={basemap}
              isShown={basemapsStore.shownBasemapId === basemap.id}
              actions={basemapActions}
              scrollTick={scrollTick}
              onToggleShow={(id): void => basemapsStore.showBasemap(id)}
              onAction={(action, id): void => {
                switch (action) {
                  case CRUDAction.edit:
                    basemapsStore.editBasemap(id);
                    navigation.navigate('EditBasemap');
                    break;
                  case GeneralAction.export:
                    basemapsStore.exportBasemap(id);
                    break;
                  case BasemapAction.makeDefault:
                    basemapsStore.makeDefaultBasemap(id);
                    break;
                  default:
                    break;
                }
              }}
            />
          ))}
        </List>
      </Box>
    );
  }
);
