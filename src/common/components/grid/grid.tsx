/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { CSSProperties, useCallback, useEffect, useState } from 'react';
import { omit } from 'lodash';
import { AgGridReact } from 'ag-grid-react';
import {
  GridReadyEvent as AgGridReadyEvent,
  GridApi as AgGridApi,
  GridOptions,
  ValueFormatterParams,
  RowSelectedEvent,
  CellMouseOverEvent,
  CellMouseOutEvent,
  RowDragEnterEvent,
  RowDragEndEvent,
  IRowNode,
  RowHeightParams,
  RowClickedEvent,
  AllCommunityModule,
  ModuleRegistry,
} from 'ag-grid-community';
import { useTheme } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { IError } from '../../../discrete-layer/components/helpers/errorUtils';
import { GRID_MESSAGES } from '../../i18n';
import CONFIG from '../../config';
import { DetailsExpanderRenderer } from './cell-renderer/details-expander.cell-renderer';
import { GridThemes } from './themes/themes';

import 'ag-grid-community/styles/ag-theme-alpine.css';

// All Community Features
ModuleRegistry.registerModules([AllCommunityModule]);

export const DEFAULT_DETAILS_ROW_HEIGHT = 234;
export const DEFAULT_NORMAL_ROW_HEIGHT = 42;
const EXPANDER_COLUMN_WIDTH = 60;

interface GridComponentProps {
  gridOptions?: GridComponentOptions;
  rowData?: any[];
  style?: CSSProperties;
  isLoading?: boolean;
  focusByRowId?: string;
  setIsRowFound?: (val: boolean) => void;
  handleFocusError?: (error: IError | undefined) => void;
}

export interface GridApi extends AgGridApi {}
export interface GridReadyEvent extends AgGridReadyEvent {}
export interface GridCellMouseOutEvent extends CellMouseOutEvent {}
export interface GridCellMouseOverEvent extends CellMouseOverEvent {}
export interface GridRowDragEnterEvent extends RowDragEnterEvent {}
export interface GridRowDragEndEvent extends RowDragEndEvent {}
export interface GridRowSelectedEvent extends RowSelectedEvent {}
export interface GridRowClickedEvent extends RowClickedEvent {}
export interface GridValueFormatterParams extends ValueFormatterParams {}

export interface GridComponentOptions extends GridOptions {
  detailsRowCellRenderer?: string;
  detailsRowHeight?: number;
  detailsRowExpanderPosition?: 'start' | 'end';
  context?: {
    detailsRowCellRendererPresencePredicate?: (data: any) => boolean;
  };
}

export const GRID_COMPONENT_OPTIONS_OWNED_KEYS = [
  'detailsRowCellRenderer',
  'detailsRowHeight',
  'detailsRowExpanderPosition',
  'context.detailsRowCellRendererPresencePredicate',
] as const;

export interface IGridRowDataDetailsExt {
  isDetailsExpanded: boolean;
}

export interface IRowPosition {
  pageNumber: number;
  rowIndex: number;
}

export interface GridRowNode extends IRowNode {}

export const GridComponent: React.FC<GridComponentProps> = (props) => {
  const [rowData, setRowData] = useState<any[]>();
  const theme = useTheme();
  const [gridApi, setGridApi] = useState<GridApi>();

  const { focusByRowId, setIsRowFound, handleFocusError } = props;

  const { detailsRowExpanderPosition, ...restGridOptions } =
    props.gridOptions as GridComponentOptions;

  const detailsRowCellRenderer = props.gridOptions?.detailsRowCellRenderer;

  const detailsComponent = detailsRowCellRenderer
    ? (props.gridOptions?.components as Record<string, any>)?.[detailsRowCellRenderer]
    : undefined;
  const normalRowHeight = restGridOptions.rowHeight ?? DEFAULT_NORMAL_ROW_HEIGHT;
  const detailsRowHeight = props.gridOptions?.detailsRowHeight ?? DEFAULT_DETAILS_ROW_HEIGHT;

  const expanderColumnDef = {
    headerName: '',
    width: EXPANDER_COLUMN_WIDTH,
    cellRenderer: 'detailsExpanderRenderer',
    suppressMovable: true,
    sortable: false,
    cellStyle: { overflow: 'visible' },
    cellRendererParams: {
      detailsComponent,
      detailsRowCellRendererPresencePredicate:
        props.gridOptions?.context?.detailsRowCellRendererPresencePredicate,
      normalRowHeight,
      detailsRowHeight,
    },
  };

  const gridOptionsFromProps: GridComponentOptions = {
    ...restGridOptions,
    columnDefs: [
      {
        field: 'isDetailsExpanded',
        hide: true,
      },
      props.gridOptions?.detailsRowExpanderPosition === 'start' &&
      props.gridOptions.detailsRowCellRenderer !== undefined
        ? expanderColumnDef
        : {
            hide: true,
          },
      ...(props.gridOptions?.columnDefs as []),
      props.gridOptions?.detailsRowExpanderPosition !== 'start' &&
      props.gridOptions?.detailsRowCellRenderer !== undefined
        ? expanderColumnDef
        : {
            hide: true,
          },
    ],
    getRowHeight:
      detailsRowCellRenderer !== undefined
        ? (params: RowHeightParams): number | undefined => {
            return (params.data as IGridRowDataDetailsExt).isDetailsExpanded
              ? normalRowHeight + detailsRowHeight
              : restGridOptions.rowHeight;
          }
        : undefined,
    components: {
      ...(props.gridOptions?.components as { [key: string]: any }),
      detailsExpanderRenderer: useCallback(DetailsExpanderRenderer, []),
    },
    localeText: GRID_MESSAGES[CONFIG.I18N.DEFAULT_LANGUAGE],
    onGridReady(params: GridReadyEvent) {
      if (typeof restGridOptions.onGridReady === 'function') {
        restGridOptions.onGridReady(params);
      }

      setGridApi(params.api);
    },
  };

  // Strip custom props before passing to ag-Grid (which doesn't know about them)
  const gridOptions = omit(gridOptionsFromProps, GRID_COMPONENT_OPTIONS_OWNED_KEYS);

  const getIsDetailsExpanded = (id: string): boolean => {
    let res = false;

    gridApi?.forEachNode((node) => {
      const nodeData = node.data as Record<string, any>;
      if (nodeData.id === id) {
        res = nodeData.isDetailsExpanded as boolean;
      }
    });
    return res;
  };

  useEffect(() => {
    const result: any[] = [];
    if (props.gridOptions?.detailsRowCellRenderer !== undefined) {
      props.rowData?.forEach((element) => {
        const rowElement: Record<string, unknown> = element as Record<string, unknown>;
        result.push({
          ...rowElement,
          isDetailsExpanded: getIsDetailsExpanded(rowElement.id as string),
        });
      });
    } else {
      result.push(...(props.rowData as []));
    }
    if (typeof props.isLoading === 'undefined' || props.isLoading === false) {
      setRowData(result);
      if (result) {
        gridApi?.setGridOption('loading', false);
      }
    } else {
      gridApi?.setGridOption('loading', true);
    }
  }, [props.rowData, props.gridOptions, props.isLoading]);

  useEffect(() => {
    if (!gridApi || !focusByRowId) {
      return;
    }

    focusAndExpandRow(gridApi, focusByRowId);
  }, [rowData]);

  const getRowPosition = (gridApi: GridApi, id: string): IRowPosition | undefined => {
    const node = gridApi.getRowNode(id);

    if (!node || node.rowIndex == null) {
      return;
    }

    const rowIndex = node.rowIndex;
    const pageSize = gridApi.paginationGetPageSize();
    const pageNumber = Math.floor(rowIndex / pageSize);

    return {
      pageNumber,
      rowIndex,
    };
  };

  const goToRowAndFocus = (gridApi: GridApi, row: IRowPosition) => {
    gridApi.paginationGoToPage(row.pageNumber);
    gridApi.ensureIndexVisible(row.rowIndex, 'middle');
    gridApi.getDisplayedRowAtIndex(row.rowIndex)?.setSelected(true);
  };

  const focusAndExpandRow = (gridApi: GridApi, id: string) => {
    const row = getRowPosition(gridApi, id);

    if (!row) {
      handleFocusError?.({
        code: 'warning.row-not-found',
        message: '',
        level: 'warning',
      });
      setIsRowFound?.(false);
      return;
    }

    handleFocusError?.(undefined);
    setIsRowFound?.(true);
    goToRowAndFocus(gridApi, row);

    const rowNode = gridApi.getRowNode(id);
    if (rowNode) {
      rowNode.setDataValue('isDetailsExpanded', true);
      gridApi.refreshCells({ rowNodes: [rowNode], force: true });
    }
    gridApi.resetRowHeights();
  };

  const agGridThemeOverrides = GridThemes.getTheme(theme);

  return (
    <Box
      className={theme.type === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}
      style={{
        ...props.style,
        ...agGridThemeOverrides,
      }}
    >
      <AgGridReact gridOptions={gridOptions} rowData={rowData} />
    </Box>
  );
};
