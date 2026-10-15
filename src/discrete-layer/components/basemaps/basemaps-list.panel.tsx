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
import { useStore } from '../../models';
import { BasemapOutput } from './XXXbasemapMockXXX';

import './basemaps-list.panel.css';

interface BasemapRowProps {
  basemap: BasemapOutput;
  isShown: boolean;
  onToggleShow: (id: string) => void;
  onEdit: (id: string) => void;
  onExport: (id: string) => void;
  onMakeDefault: (id: string) => void;
}

const BasemapRow: React.FC<BasemapRowProps> = ({
  basemap,
  isShown,
  onToggleShow,
  onEdit,
  onExport,
  onMakeDefault,
}) => {
  const intl = useIntl();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

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
            className={isShown ? 'mc-icon-Show basemapEyeActive' : 'mc-icon-Hide'}
            onClick={(): void => onToggleShow(basemap.id)}
          />
          <IconButton className="mc-icon-Edit1" onClick={(): void => onEdit(basemap.id)} />
          {/* TODO: need to think about the real structure of the actions, maybe like in entity.actions. */}
          <MenuSurfaceAnchor>
            <Menu open={isMenuOpen} focusOnOpen={false} onClose={(): void => setIsMenuOpen(false)}>
              <MenuItem
                onClick={(): void => {
                  onExport(basemap.id);
                  setIsMenuOpen(false);
                }}
              >
                <Box className="basemapMenuItem">
                  <IconButton className="mc-icon-Export" />
                  <Typography tag="span">
                    {intl.formatMessage({ id: 'basemaps.list.actions.export' })}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem
                onClick={(): void => {
                  onMakeDefault(basemap.id);
                  setIsMenuOpen(false);
                }}
              >
                <Box className="basemapMenuItem">
                  {intl.formatMessage({ id: 'basemaps.list.actions.make-default' })}
                </Box>
              </MenuItem>
            </Menu>
            <IconButton className="mc-icon-More" onClick={(): void => setIsMenuOpen(!isMenuOpen)} />
          </MenuSurfaceAnchor>
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

    useEffect(() => {
      void basemapsStore.getBasemaps();
    }, [basemapsStore]);

    const basemaps = basemapsStore.basemaps ?? [];

    return (
      <Box className="basemapsListPanel">
        <Box className="basemapsListPanelHeader">
          <Typography tag="h2">{intl.formatMessage({ id: 'basemaps.list.title' })}</Typography>
          <Box className="basemapsListPanelHeaderActions">
            <Button type="button" outlined onClick={(): void => navigation.navigate('EditBasemap')}>
              {intl.formatMessage({ id: 'basemaps.list.import' })}
            </Button>
            <Button type="button" raised onClick={(): void => navigation.navigate('EditBasemap')}>
              {intl.formatMessage({ id: 'basemaps.list.new' })}
            </Button>
          </Box>
        </Box>
        <List twoLine className="basemapsList">
          {basemaps.map((basemap) => (
            <BasemapRow
              key={basemap.id}
              basemap={basemap}
              isShown={basemapsStore.shownBasemapId === basemap.id}
              onToggleShow={(id): void => basemapsStore.showBasemap(id)}
              onEdit={(id): void => {
                basemapsStore.editBasemap(id);
                navigation.navigate('EditBasemap');
              }}
              onExport={(id): void => basemapsStore.exportBasemap(id)}
              onMakeDefault={(id): void => basemapsStore.makeDefaultBasemap(id)}
            />
          ))}
        </List>
      </Box>
    );
  }
);
