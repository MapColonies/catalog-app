import React from 'react';
import { FormattedMessage } from 'react-intl';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  Drawer,
  DrawerContent,
  List,
  ListItem,
  ListItemGraphic,
  ListItemText,
} from '@map-colonies/react-core';
import { Box, DrawType, IDrawingEvent } from '@map-colonies/react-components';
import { BBoxDialog } from './bbox.dialog';

import './polygon-selection-ui.css';

const WIDTH_SPACING_FACTOR = 18;
const useStyle = makeStyles((theme: Theme) =>
  createStyles({
    drawingButton: {
      width: theme.spacing(WIDTH_SPACING_FACTOR),
    },
    fullWidth: {
      width: '100%',
    },
  })
);

export interface PolygonSelectionUiProps {
  isSelectionEnabled: boolean;
  mapActionsWidth: string;
  onStartDraw: (type: DrawType) => void;
  onCancelDraw: () => void;
  onReset: () => void;
  onPolygonUpdate: (polygon: IDrawingEvent) => void;
  handleOtherDrawers?: () => void;
}

export const PolygonSelectionUi: React.FC<PolygonSelectionUiProps> = (
  props
) => {
  const classes = useStyle();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const {
    isSelectionEnabled,
    onCancelDraw,
    onStartDraw,
    onReset,
    onPolygonUpdate,
    handleOtherDrawers,
    mapActionsWidth,
  } = props;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(!menuOpen);
    if (handleOtherDrawers) handleOtherDrawers();
  };

  const handleClose = (): void => {
    setAnchorEl(null);
    setMenuOpen(!menuOpen);
  };

  const [open, setOpen] = React.useState(false);

  if (isSelectionEnabled) {
    return (
      <Button className={classes.drawingButton} raised onClick={onCancelDraw}>
        <FormattedMessage id="polygon-selection.cancel-btn.text" />
      </Button>
    );
  } else {
    return (
      <Box position="relative">
        <Button
          className={classes.drawingButton}
          outlined
          theme={['primaryBg', 'onPrimary']}
          onClick={handleClick}
          icon="category"
        >
          <FormattedMessage id="polygon-selection.draw-btn.text" />
        </Button>
        <BBoxDialog
          isOpen={open}
          onSetOpen={setOpen}
          onPolygonUpdate={onPolygonUpdate}
        />
        {menuOpen && (
          <Box
            style={{
              height: '210px',
              width: mapActionsWidth,
            }}
            className="drawerContainer"
          >
            <Drawer
              dismissible
              style={{ width: '100%' }}
              open={Boolean(anchorEl) && menuOpen}
            >
              <DrawerContent>
                <List>
                  <ListItem
                    onClick={(): void => {
                      onStartDraw(DrawType.BOX);
                      handleClose();
                    }}
                  >
                    <ListItemGraphic icon="crop_square" />
                    <ListItemText>
                      <FormattedMessage id="polygon-selection.box-menu_option.text" />
                    </ListItemText>
                  </ListItem>
                  <ListItem
                    onClick={(): void => {
                      onStartDraw(DrawType.POLYGON);
                      handleClose();
                    }}
                  >
                    <ListItemGraphic icon="format_shapes" />
                    <ListItemText>
                      <FormattedMessage id="polygon-selection.polygon-menu_option.text" />
                    </ListItemText>
                  </ListItem>
                  <ListItem
                    onClick={(): void => {
                      setOpen(true);
                      handleClose();
                    }}
                  >
                    <ListItemGraphic icon="settings_overscan" />
                    <ListItemText>
                      <FormattedMessage id="polygon-selection.box_coorinate-menu_option.text" />
                    </ListItemText>
                  </ListItem>
                  <ListItem
                    onClick={(): void => {
                      onReset();
                      handleClose();
                    }}
                  >
                    <ListItemGraphic icon="delete" />
                    <ListItemText>
                      <FormattedMessage id="polygon-selection.clear-menu_option.text" />
                    </ListItemText>
                  </ListItem>
                </List>
              </DrawerContent>
            </Drawer>
          </Box>
        )}
      </Box>
    );
  }
};
