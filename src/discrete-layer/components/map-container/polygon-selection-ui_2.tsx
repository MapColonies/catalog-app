import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip, useTheme } from '@map-colonies/react-core';
import { Box, DrawType, IDrawingEvent } from '@map-colonies/react-components';
import { useStore } from '../../models/RootStore';
import { FilterField } from '../../models/RootStore.base';
import { BBoxCorners, BBoxDialog } from './bbox.dialog';
import { CatalogFilterPanel } from './catalogFilter/catalog-filter-panel.component';
import { FreeTextSearch } from './freeTextSearch.component';
import { IPOI, PoiDialog } from './poi.dialog';

import './polygon-selection-ui.css';

export const Divider: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      style={{
        width: '1px',
        borderWidth: '0 0 0 1px',
        borderColor: theme.textIconOnDark as string,
        borderStyle: 'solid',
        height: '70%',
      }}
    />
  );
};

export interface PolygonSelectionUiProps {
  isSelectionEnabled: boolean;
  onStartDraw: (type: DrawType) => void;
  onCancelDraw: () => void;
  onReset: () => void;
  onPolygonUpdate: (polygon: IDrawingEvent) => void;
  onPoiUpdate: (longitude: number, latitude: number) => void;
  onFiltersApply: (filters: FilterField[]) => void;
  onFiltersReset: () => void;
  poi?: IPOI;
  corners?: BBoxCorners;
  disabled?: boolean;
}

enum PolygonSelectionsLabels {
  BOX = 'BOX',
  POLYGON = 'POLYGON',
  BBOX = 'BBOX',
  POI = 'POI',
  FILTER = 'FILTER',
}

export const PolygonSelectionUi: React.FC<PolygonSelectionUiProps> = (
  props
) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isSelectionEnabled,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onCancelDraw,
    onStartDraw,
    onReset,
    onPolygonUpdate,
    onPoiUpdate,
    onFiltersApply,
    onFiltersReset,
    poi,
    corners,
    disabled,
  } = props;

  const intl = useIntl();
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [openPoiDialog, setOpenPoiDialog] = useState(false);
  const [activeSelection, setActiveSelection] = useState<
    PolygonSelectionsLabels | ''
  >('');
  const [lastDrawingSelectionType, setLastDrawingSelectionType] = useState<
    PolygonSelectionsLabels | ''
  >('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isCatalogFiltersEnabled, setIsCatalogFiltersEnabled] = useState(false);

  useEffect(() => {
    setIsFilterPanelOpen(false);
  }, [disabled]);

  useEffect(() => {
    setIsFilterPanelOpen(false);
    setActiveSelection('');
    setLastDrawingSelectionType('');
  }, [store.userStore.user?.role]);

  useEffect(() => {
    if (poi) {
      setActiveSelection(PolygonSelectionsLabels.POI);
    } else if (corners) {
      setActiveSelection(PolygonSelectionsLabels.BBOX);
    } else if (isSelectionEnabled && lastDrawingSelectionType) {
      setActiveSelection(lastDrawingSelectionType);
      setLastDrawingSelectionType('');
    }
  }, [isSelectionEnabled, poi, corners]);

  const getActiveClass = (
    className: string,
    selectionLabel: PolygonSelectionsLabels
  ) => {
    return `${className} ${activeSelection === selectionLabel ? 'active' : ''}`;
  };

  return (
    <>
      <Box
        id="searchContainer"
        position="relative"
        style={{
          opacity: (disabled as boolean) ? '0.3' : '1',
          pointerEvents: (disabled as boolean) ? 'none' : 'unset',
        }}
      >
        <Tooltip content={intl.formatMessage({ id: 'action.clear.tooltip' })}>
          <IconButton
            className="mc-icon-Delete"
            label="CLEAR"
            onClick={() => {
              setActiveSelection('');
              onReset();
            }}
          />
        </Tooltip>
        <Divider />
        <Tooltip content={intl.formatMessage({ id: 'action.point.tooltip' })}>
          <IconButton
            className={getActiveClass(
              'mc-icon-POI',
              PolygonSelectionsLabels.POI
            )}
            label={PolygonSelectionsLabels.POI}
            onClick={(): void => {
              setOpenPoiDialog(true);
            }}
          />
        </Tooltip>
        <Tooltip content={intl.formatMessage({ id: 'action.box.tooltip' })}>
          <IconButton
            className={getActiveClass(
              'mc-icon-Rectangle',
              PolygonSelectionsLabels.BOX
            )}
            label={PolygonSelectionsLabels.BOX}
            onClick={(): void => {
              setLastDrawingSelectionType(PolygonSelectionsLabels.BOX);
              onStartDraw(DrawType.BOX);
            }}
          />
        </Tooltip>
        <Tooltip content={intl.formatMessage({ id: 'action.polygon.tooltip' })}>
          <IconButton
            className={getActiveClass(
              'mc-icon-Polygon',
              PolygonSelectionsLabels.POLYGON
            )}
            label={PolygonSelectionsLabels.POLYGON}
            onClick={(): void => {
              setLastDrawingSelectionType(PolygonSelectionsLabels.POLYGON);
              onStartDraw(DrawType.POLYGON);
            }}
          />
        </Tooltip>
        <Tooltip
          content={intl.formatMessage({ id: 'action.bbox-corners.tooltip' })}
        >
          <IconButton
            className={getActiveClass(
              'mc-icon-Coordinates',
              PolygonSelectionsLabels.BBOX
            )}
            label={PolygonSelectionsLabels.BBOX}
            onClick={(): void => {
              setOpen(true);
            }}
          />
        </Tooltip>
        <Divider />
        <Tooltip content={intl.formatMessage({ id: 'action.filter.tooltip' })}>
          <IconButton
            className={`mc-icon-Filter ${
              isCatalogFiltersEnabled ? 'active' : ''
            }`}
            label={PolygonSelectionsLabels.FILTER}
            onClick={() => {
              setIsFilterPanelOpen((currFilterOpen) => !currFilterOpen);
            }}
          />
        </Tooltip>
        <FreeTextSearch
          isCatalogFiltersEnabled={isCatalogFiltersEnabled}
          onFiltersReset={onFiltersReset}
          onFiltersApply={(filters) => {
            setIsFilterPanelOpen(false);
            setIsCatalogFiltersEnabled(false);
            onFiltersApply(filters);
          }}
        />
        {open && (
          <BBoxDialog
            isOpen={open}
            onSetOpen={setOpen}
            onPolygonUpdate={onPolygonUpdate}
            corners={corners}
          />
        )}
        {openPoiDialog && (
          <PoiDialog
            isOpen={openPoiDialog}
            onSetOpen={setOpenPoiDialog}
            onPoiUpdate={onPoiUpdate}
            poi={poi}
          />
        )}
        <CatalogFilterPanel
          onFiltersReset={() => {
            setIsCatalogFiltersEnabled(false);
            onFiltersReset();
          }}
          onFiltersSubmit={(filters) => {
            setIsCatalogFiltersEnabled(true);
            onFiltersApply(filters);
          }}
          isOpen={isFilterPanelOpen}
          closePanel={() => setIsFilterPanelOpen(false)}
        />
      </Box>
    </>
  );
};
