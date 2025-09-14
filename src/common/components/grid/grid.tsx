/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { CSSProperties, useCallback, useEffect, useState } from 'react';
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
  IsFullWidthRowParams
} from 'ag-grid-community';
import { useTheme } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { GRID_MESSAGES } from '../../i18n';
import CONFIG from '../../config';
import { DetailsExpanderRenderer } from './cell-renderer/details-expander.cell-renderer';
import { GridThemes } from './themes/themes';

import 'ag-grid-community/styles/ag-theme-alpine.css';

// All Community Features
ModuleRegistry.registerModules([AllCommunityModule]);

const DEFAULT_DETAILS_ROW_HEIGHT = 150;
const EXPANDER_COLUMN_WIDTH = 60;
export const DETAILS_ROW_ID_SUFFIX = '_details';

interface GridComponentProps {
  gridOptions?: GridComponentOptions;
  rowData?: any[];
  style?: CSSProperties;
  isLoading?: boolean;
};

export interface GridApi extends AgGridApi{};
export interface GridReadyEvent extends AgGridReadyEvent{};
export interface GridCellMouseOutEvent extends CellMouseOutEvent{};
export interface GridCellMouseOverEvent extends CellMouseOverEvent{};
export interface GridRowDragEnterEvent extends RowDragEnterEvent{};
export interface GridRowDragEndEvent extends RowDragEndEvent{};
export interface GridRowSelectedEvent extends RowSelectedEvent{};
export interface GridRowClickedEvent extends RowClickedEvent{};
export interface GridValueFormatterParams extends ValueFormatterParams{};
export interface GridComponentOptions extends GridOptions {
  detailsRowCellRenderer?: string;
  detailsRowHeight?: number;
  detailsRowExpanderPosition?: 'start' | 'end';
  context?: {
    detailsRowCellRendererPresencePredicate?: (data: any) => boolean;
  }
};

export interface IGridRowDataDetailsExt {
  rowHeight: number;
  fullWidth: boolean;
  isVisible: boolean;
};
export interface GridRowNode extends IRowNode {};

export const GridComponent: React.FC<GridComponentProps> = (props) => {
  const [rowData, setRowData] = useState<any[]>()
  const theme = useTheme();
  const [gridApi, setGridApi] = useState<GridApi>();
  
  const {detailsRowExpanderPosition, ...restGridOptions} = props.gridOptions as GridComponentOptions;

  const gridOptionsFromProps: GridComponentOptions = {
    ...restGridOptions,
    columnDefs: [
      {
        field: 'isVisible',
        hide: true,
      },
      (props.gridOptions?.detailsRowExpanderPosition ===  'start' && props.gridOptions.detailsRowCellRenderer !== undefined) ? 
        {
          headerName: '',
          width: EXPANDER_COLUMN_WIDTH,
          cellRenderer: 'detailsExpanderRenderer',
          suppressMovable: true,
          sortable: false,
          cellRendererParams: {
            detailsRowCellRendererPresencePredicate: props.gridOptions.context?.detailsRowCellRendererPresencePredicate
          }
        } : 
        {
          hide: true,
        },
      ...props.gridOptions?.columnDefs as [],
      (props.gridOptions?.detailsRowExpanderPosition !==  'start' && props.gridOptions?.detailsRowCellRenderer !== undefined) ? 
        {
          headerName: '',
          width: EXPANDER_COLUMN_WIDTH,
          cellRenderer: 'detailsExpanderRenderer',
          suppressMovable: true,
          sortable: false,
          cellRendererParams: {
            detailsRowCellRendererPresencePredicate: props.gridOptions.context?.detailsRowCellRendererPresencePredicate
          }
        } : 
        {
          hide: true,
        },
   ],
   getRowHeight: props.gridOptions?.detailsRowCellRenderer !== undefined ? (params: RowHeightParams): number => {
    return (params.data as IGridRowDataDetailsExt).rowHeight;
   } : undefined,
   isExternalFilterPresent: props.gridOptions?.detailsRowCellRenderer !== undefined ? (): boolean => true : undefined,
   doesExternalFilterPass: props.gridOptions?.detailsRowCellRenderer !== undefined ? (node): boolean => {
      return (node.data as IGridRowDataDetailsExt).isVisible;
      //return gridOptions.api.getValue("isVisible", node.rowNode);
    } : undefined,
    isFullWidthRow: props.gridOptions?.detailsRowCellRenderer !== undefined ? (params: IsFullWidthRowParams): boolean => {
      // checked the fullWidth attribute that was set while creating the data
      return (params.rowNode.data as IGridRowDataDetailsExt).fullWidth;
    } : undefined,
    fullWidthCellRenderer: props.gridOptions?.detailsRowCellRenderer ?? undefined,

   components: {
    ...props.gridOptions?.components as {[key: string]: any},
    detailsExpanderRenderer: useCallback(DetailsExpanderRenderer, []),
   },
   localeText: GRID_MESSAGES[CONFIG.I18N.DEFAULT_LANGUAGE],
   onGridReady(params: GridReadyEvent) {
    if (typeof(restGridOptions.onGridReady) === 'function') {
      restGridOptions.onGridReady(params);
    } 

    setGridApi(params.api);
   },
  };

  const {detailsRowCellRenderer, detailsRowHeight, ...gridOptions} = gridOptionsFromProps;

  const getIsVisible = (id:string): boolean => {
    let res = false;

    gridApi?.forEachNode((node) => {
      const nodeData = node.data as Record<string,any>;
      if (nodeData.id === id) {
        res = nodeData.isVisible as boolean;
      }
    });
    return res;
  };


  useEffect(() => {
    const result: any[] = [];
    if (props.gridOptions?.detailsRowCellRenderer !== undefined) {
      props.rowData?.forEach((element,idx) => {
        const rowElement: Record<string, unknown> = element as Record<string, unknown>;

        result.push({
          ...rowElement,
          isVisible: true
        });
        result.push({
          ...rowElement, 
          fullWidth: true,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          id: `${rowElement.id as string}${DETAILS_ROW_ID_SUFFIX}`,
          isVisible: getIsVisible(`${rowElement.id as string}${DETAILS_ROW_ID_SUFFIX}`),
          rowHeight: props.gridOptions?.detailsRowHeight ?? DEFAULT_DETAILS_ROW_HEIGHT,
        });
      });
    } else {
      result.push(...(props.rowData as []));
    }
    if (typeof props.isLoading === 'undefined' || props.isLoading === false) {
      setRowData(result);
      if(result){
        gridApi?.setGridOption("loading", false);  
      }
    } else {
      gridApi?.setGridOption("loading", true);
    }
  
  }, [props.rowData, props.gridOptions, props.isLoading]);

  const agGridThemeOverrides = GridThemes.getTheme(theme);
  
  return (
    <Box
      className={theme.type === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine' }
      style={{
        ...props.style,
        ...agGridThemeOverrides
      }}
    >
      <AgGridReact
        gridOptions={gridOptions}
        rowData={rowData} 
      />
    </Box>
  );
};
