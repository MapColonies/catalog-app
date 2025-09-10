import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { ColDef, RowDataUpdatedEvent, ValueGetterParams } from 'ag-grid-community';
import { observer } from 'mobx-react-lite';
import { isObject, isEmpty } from 'lodash';
import { Box } from '@map-colonies/react-components';
import { 
  GridComponent,
  GridComponentOptions,
  GridValueFormatterParams,
  GridCellMouseOverEvent,
  GridCellMouseOutEvent,
  GridRowNode,
  GridReadyEvent,
  GridApi,
  GridRowClickedEvent
} from '../../../common/components/grid';
import { ActionsRenderer } from '../../../common/components/grid/cell-renderer/actions.cell-renderer';
import { FootprintRenderer } from '../../../common/components/grid/cell-renderer/footprint.cell-renderer';
import { LayerImageRenderer } from '../../../common/components/grid/cell-renderer/layer-image.cell-renderer';
import { ProductTypeRenderer } from '../../../common/components/grid/cell-renderer/product-type.cell-renderer';
import { StyledByDataRenderer } from '../../../common/components/grid/cell-renderer/styled-by-data.cell-renderer';
import { HeaderFootprintRenderer } from '../../../common/components/grid/header-renderer/footprint.header-renderer';
import CustomTooltip from '../../../common/components/grid/tooltip-renderer/name.tooltip-renderer';
import { Error } from '../../../common/components/tree/statuses/error';
import { Loading } from '../../../common/components/tree/statuses/loading';
import CONFIG from '../../../common/config';
import { getMax } from '../../../common/helpers/array';
import { dateFormatter } from '../../../common/helpers/formatters';
import { isPolygonPartsShown } from '../../../common/helpers/style';
import { usePrevious } from '../../../common/hooks/previous.hook';
import { LayerRasterRecordModelType } from '../../models';
import { IDispatchAction } from '../../models/actionDispatcherStore';
import { ILayerImage } from '../../models/layerImage';
import { useStore } from '../../models/RootStore';
import { UserAction } from '../../models/userStore';
import { TabViews } from '../../views/tab-views';

import './layers-results.css';

const PAGINATION = true;
const PAGE_SIZE = 10;
const IMMEDIATE_EXECUTION = 0;
const INITIAL_ORDER = 0;

interface LayersResultsProps {
  searchLoading: boolean;
  searchError: any;
  style?: { [key: string]: string };
}

export const LayersResults: React.FC<LayersResultsProps> = observer((props) => {
  const intl = useIntl();
  const store = useStore();
  const [layersImages, setlayersImages] = useState<ILayerImage[]>([]);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [gridApi, setGridApi] = useState<GridApi>();
  const prevLayersImages = usePrevious<ILayerImage[]>(layersImages);
  const cacheRef = useRef({} as ILayerImage[]);
  const selectedLayersRef = useRef(INITIAL_ORDER);

  const updateRow = (id: string, newData: Partial<ILayerImage>, gridApi: GridApi): void => {
    const rowNode = gridApi.getRowNode(id);
    if (rowNode) {
      rowNode.setData({ ...rowNode.data, ...newData });
      gridApi.refreshCells({ rowNodes: [rowNode], force: true });
    }
  };

  const isSameRowData = (source: ILayerImage[] | undefined, target: ILayerImage[] | undefined): boolean => {
    let res = false;
    if (source && target && source.length === target.length) {
      let matchesRes = true;
      source.forEach((srcFeat: ILayerImage) => { 
        const match = target.find((targetFeat: ILayerImage) => {
          const srcOnlyEditables = store.discreteLayersStore.getEditablePartialObject(srcFeat, ['layerURLMissing', 'polygonPartsShown', 'footprintShown', 'layerImageShown']);
          const targetOnlyEditables = store.discreteLayersStore.getEditablePartialObject(targetFeat, ['layerURLMissing', 'polygonPartsShown', 'footprintShown', 'layerImageShown']);          

          return JSON.stringify(srcOnlyEditables) === JSON.stringify(targetOnlyEditables);
        });
        matchesRes = matchesRes && isObject(match);
      });
      res = matchesRes;
    }
    return res;
  };

  const getRowData = (): ILayerImage[] | undefined => {
    if (isSameRowData(prevLayersImages, layersImages)) {
      return cacheRef.current;
    } else {
      cacheRef.current = layersImages;
      selectedLayersRef.current = INITIAL_ORDER;
      return cacheRef.current;
    }
  };

  const entityPermittedActions = useMemo(() => {
    const entityActions: Record<string, unknown> = {};
    [ 'LayerRasterRecord', 'Layer3DRecord', 'LayerDemRecord', 'VectorBestRecord', 'QuantizedMeshBestRecord' ].forEach( entityName => {
      const allGroupsActions = store.actionDispatcherStore.getEntityActionGroups(entityName);
      const permittedGroupsActions = allGroupsActions.map((actionGroup) => {
        return {
          titleTranslationId: actionGroup.titleTranslationId,
          group:
            actionGroup.group.filter(action => {
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              return store.userStore.isActionAllowed(`entity_action.${entityName}.${action.action}`) === false ? false : true && 
                     action.views.includes(TabViews.SEARCH_RESULTS);
            })
            .map((action) => {
              return {
                ...action,
                frequent: false,
                titleTranslationId: intl.formatMessage({ id: action.titleTranslationId }),
              };
            }),
        }
      });
      entityActions[entityName] = permittedGroupsActions;
    });
    return entityActions;
  }, [store.userStore.user]);

  const dispatchAction = (action: Record<string, unknown>): void => {
    store.actionDispatcherStore.dispatchAction({
      action: action.action,
      data: action.data
    } as IDispatchAction);
  };

  // Reset action value on store when unmounting
  // useEffect(() => {
  //   return (): void => {
  //     dispatchAction(undefined)
  //   };
  // }, []);
  
  const colDef = [
    {
      width: 20,
      field: 'footprintShown',
      sortable: false,
      cellRenderer: 'rowFootprintRenderer',
      cellRendererParams: {
        onClick: (id: string, value: boolean, node: GridRowNode): void => {
          store.discreteLayersStore.showFootprint(id, value);
        }
      },
      headerName: '',
    },
    {
      width: 20,
      field: 'layerImageShown',
      cellRenderer: 'rowLayerImageRenderer',
      cellRendererParams: {
        onClick: (id: string, value: boolean, node: GridRowNode): void => {
          // setTimeout(() => node.setDataValue('layerImageShown', value), immediateExecution);
          if (value) {
            selectedLayersRef.current++;
          } else {
            const orders: number[] = [];
            (node as any).beans.gridApi.forEachNode((item: GridRowNode)=> {
              const rowData = item.data as {[key: string]: string | boolean | number};
              if (rowData.layerImageShown === true && rowData.id !== id) {
                orders.push(rowData.order as number);
              }
            });
            selectedLayersRef.current = (orders.length) ? getMax(orders) : selectedLayersRef.current-1;
          }
          const order = value ? selectedLayersRef.current : null;
          // setTimeout(() => node.setDataValue('order', order), immediateExecution) ;
          store.discreteLayersStore.showLayer(id, value, order);
        }
      }
    },
    {
      headerName: '',
      width: 20,
      field: '__typename',
      cellRenderer: 'productTypeRenderer',
      cellRendererParams: {
        style: {
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '8px'
        },
        onClick: (data: ILayerImage, value: boolean, gridApi: GridApi): void => {
          const activePPLayer = store.discreteLayersStore.layersImages?.find(layer => isPolygonPartsShown(layer as unknown as Record<string, unknown>)) as LayerRasterRecordModelType;
          store.discreteLayersStore.showPolygonParts(data.id, value);
          if (activePPLayer) {
            updateRow(activePPLayer.id, {...activePPLayer, polygonPartsShown: false}, gridApi);
          }
          updateRow(data.id, {...data, polygonPartsShown: value} as LayerRasterRecordModelType, gridApi);
          dispatchAction({
            action: UserAction.SYSTEM_CALLBACK_SHOWPOLYGONPARTS,
            data: { selectedLayer: {...data, polygonPartsShown: value } }
          });
        }
      }
    },
    {
      headerName: intl.formatMessage({
        id: 'results.fields.name.label',
      }),
      minWidth: 180,
      flex: 1,
      field: 'productName',
      cellRenderer: 'styledByDataRenderer',
      tooltipField: 'productName',
      tooltipComponent: 'customTooltip',
      tooltipComponentParams: { color: '#ececec', infoTooltipMap: store.discreteLayersStore.entityTooltipFields }
    },
    {
      headerName: intl.formatMessage({
        id: 'results.fields.ingestion-date.label',
      }),
      minWidth: 140,
      flex: 1,
      field: 'ingestionDate',
      valueGetter: (params: ValueGetterParams): string => {
        const { data } = params;
        return data.ingestionDate !== undefined && data.ingestionDate !== null ? data.ingestionDate : data.insertDate;
      },
      valueFormatter: (params: GridValueFormatterParams): string => dateFormatter(params.value)
    },
    {
      headerName: intl.formatMessage({
        id: 'results.fields.order.label',
      }),
      width: 50,
      field: 'order',
      hide: true
    },
    {
      pinned: 'right',
      headerName: '',
      width: 0,
      cellRenderer: 'actionsRenderer',
      cellRendererParams: {
        actions: entityPermittedActions,
        actionHandler: dispatchAction,
      },
    }
  ];

  const gridOptions: GridComponentOptions = {
    enableRtl: CONFIG.I18N.DEFAULT_LANGUAGE.toUpperCase() === 'HE',
    pagination: PAGINATION,
    paginationPageSize: PAGE_SIZE,
    paginationPageSizeSelector: false,//[PAGE_SIZE, 20, 50, 100],
    defaultColDef: {
      suppressMovable: true, // All columns cannot be dragged
      resizable: false, // All columns cannot be resized by default
    },
    //@ts-ignore
    columnDefs: colDef,
    overlayNoRowsTemplate: intl.formatMessage({
      id: 'results.nodata',
    }),
    loadingOverlayComponent: 'customLoadingOverlay',
    components: {
      // detailsRenderer: LayerDetailsRenderer,
      headerFootprintRenderer: useCallback(HeaderFootprintRenderer, []),
      rowFootprintRenderer: useCallback(FootprintRenderer, []),
      rowLayerImageRenderer: useCallback(LayerImageRenderer, []),
      productTypeRenderer: useCallback(ProductTypeRenderer, []),
      styledByDataRenderer: useCallback(StyledByDataRenderer, []),
      customTooltip: useCallback(CustomTooltip, []),
      actionsRenderer: useCallback(ActionsRenderer, []),
      customLoadingOverlay: useCallback(Loading, []),
    },
    tooltipShowDelay: 0,
    tooltipMouseTrack: false,
    rowSelection: {
      mode: 'singleRow',
      checkboxes: false,
      enableClickSelection: true, 
    },
    suppressCellFocus: true,
    onCellMouseOver(event: GridCellMouseOverEvent) {
      store.discreteLayersStore.highlightLayer(event.data as ILayerImage);
    },
    onCellMouseOut(event: GridCellMouseOutEvent) {
      store.discreteLayersStore.highlightLayer(undefined);
    },
    onRowClicked(event: GridRowClickedEvent) {
      store.discreteLayersStore.selectLayerByID((event.data as ILayerImage).id);
    },
    onGridReady(params: GridReadyEvent) {
      setGridApi(params.api);
      params.api.forEachNode((node) => {
        if ((node.data as ILayerImage).id === store.discreteLayersStore.selectedLayer?.id) {
          params.api.setNodesSelected({nodes: [node], newValue: true});
        }
      });
    },
    onRowDataUpdated(event: RowDataUpdatedEvent) {
      const rowToUpdate: GridRowNode | undefined | null = event.api.getRowNode(store.discreteLayersStore.selectedLayer?.id as string);
      
      // Find the pinned column to update as well
      const pinnedColId = (event.api.getColumnDefs()?.find(colDef => (colDef as ColDef).pinned) as ColDef).colId as string;

      event.api.refreshCells({
        force: true,
        suppressFlash: true,
        columns:['productName', '__typename', 'updateDate', pinnedColId], 
        //@ts-ignore
        rowNodes: !isEmpty(rowToUpdate) ? [rowToUpdate] : undefined
      });
    },
  };

  useEffect(() => {
    if (store.discreteLayersStore.layersImages) {
      setlayersImages([...store.discreteLayersStore.layersImages.map(item => ({ ...item }))]);
    }
  }, [store.discreteLayersStore.layersImages]);


  return (
    <Box id="layerResults">
      {
        props.searchError ?
          <Error
            className="errorMessage"
            message={props.searchError.response?.errors[0].message}
            details={props.searchError.response?.errors[0].extensions?.exception?.config?.url}
          /> :
          <GridComponent
            gridOptions={gridOptions}
            rowData={layersImages}
            // rowData={getRowData()}
            style={props.style}
            isLoading={props.searchLoading}
          />
      }
    </Box>
  );
});
