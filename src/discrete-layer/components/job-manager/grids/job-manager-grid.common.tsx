import { ColDef, ColGroupDef, GetRowIdParams } from 'ag-grid-community';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import CONFIG from '../../../../common/config';
import {
  GridComponent,
  GridComponentOptions,
  GridReadyEvent,
} from '../../../../common/components/grid';
import EnumsMapContext from '../../../../common/contexts/enumsMap.context';
import { IActionGroup } from '../../../../common/actions/entity.actions';
import { ActionsRenderer } from '../../../../common/components/grid/cell-renderer/actions.cell-renderer';
import { JobProductTypeRenderer } from '../../../../common/components/grid/cell-renderer/job-product-type.cell-renderer';
import { Loading } from '../../../../common/components/tree/statuses/loading';
import { Domain } from '../../../../common/models/domain';
import { JobModelType, ProductType, useStore } from '../../../models';
import { IError } from '../../helpers/errorUtils';
import { getProductDomain } from '../../layer-details/utils';
import { DateCellRenderer } from '../cell-renderer/date.cell-renderer';
import { JobDetailsRenderer } from '../cell-renderer/job-details/job-details.cell-renderer';
import { JobDetailsStatusFilter } from '../cell-renderer/job-details/job-details.status.filter';
import { PriorityRenderer } from '../cell-renderer/priority.cell-renderer';
import PlaceholderCellRenderer from '../cell-renderer/placeholder.cell-renderer';
import { StatusRenderer } from '../cell-renderer/status.cell-renderer';
import { TooltippedCellRenderer } from '../cell-renderer/tool-tipped.cell-renderer';
import { JOB_ENTITY } from '../job.types';

export interface ICommonJobManagerGridProps {
  rowData: unknown[];
  dispatchAction: (action: Record<string, unknown> | undefined) => void;
  getJobActions: { [JOB_ENTITY]: IActionGroup[] };
  updateJobCB: (updateParam: Record<string, unknown>) => void;
  rowDataChangeCB?: () => void;
  gridOptionsOverride?: Partial<GridComponentOptions>;
  gridStyleOverride?: React.CSSProperties;
  onGridReadyCB?: (params: GridReadyEvent) => void;
  customColDef?: (ColDef | ColGroupDef)[];
  omitColDefsByRenderer?: { renderers: string[]; preserveColWidth?: boolean };
  areJobsLoading?: boolean;
  focusOnJob?: Partial<Pick<JobModelType, 'id' | 'resourceId' | 'updated'>>;
  setFocusOnJob?: (
    job:
      | Partial<Pick<JobModelType, 'id' | 'resourceId' | 'updated'>>
      | undefined
  ) => void;
  handleFocusError?: (error: IError | undefined) => void;
}

const pagination = true;
const pageSize = 10;

const JobManagerGrid: React.FC<ICommonJobManagerGridProps> = (props) => {
  const {
    rowData,
    dispatchAction,
    getJobActions,
    updateJobCB,
    customColDef,
    gridOptionsOverride = {},
    gridStyleOverride = {},
    onGridReadyCB = (params): void => {
      return;
    },
    rowDataChangeCB = (): void => {
      return;
    },
    omitColDefsByRenderer,
    areJobsLoading,
    focusOnJob,
    setFocusOnJob,
    handleFocusError,
  } = props;

  const store = useStore();
  const intl = useIntl();
  const { enumsMap } = useContext(EnumsMapContext);
  const [focusJobId, setFocusJobId] = useState<string | undefined>(undefined);
  const [isRowFound, setIsRowFound] = useState<boolean>(false);

  useEffect(() => {
    if (!focusOnJob?.id) {
      return;
    }
    setFocusJobId(focusOnJob?.id);
  }, [focusOnJob]);

  useEffect(() => {
    if (isRowFound) {
      setFocusOnJob?.(undefined);
      setFocusJobId('');
    }
  }, [isRowFound]);

  const onGridReady = (params: GridReadyEvent): void => {
    onGridReadyCB(params);

    params.api.applyColumnState({
      state: [{ colId: 'updated', sort: 'desc' }],
    });
    params.api.sizeColumnsToFit();
  };

  useEffect(() => {
    rowDataChangeCB();
    store.jobsStore.updateReloadDataCounter();
  }, [rowData]);

  const getPriorityOptions = useMemo(() => {
    const priorityList = CONFIG.SYSTEM_JOBS_PRIORITY_OPTIONS;

    return priorityList.map((option) => {
      const optionCpy = { ...option };
      optionCpy.label = intl.formatMessage({
        id: option.label,
      });
      return optionCpy;
    });
  }, [intl]);

  const primitiveValueFormatter = (params: Record<string, unknown>): string =>
    (params.value as string) || '';
  const defaultColDef = useMemo(
    () => [
      {
        headerName: '',
        width: 48,
        field: 'productType',
        cellRenderer: 'productTypeRenderer',
        cellRendererParams: {
          style: {
            height: '48px',
            width: '48px',
            display: 'flex',
            alignItems: 'center',
          },
        },
        sortable: false,
      },
      {
        headerName: intl.formatMessage({
          id: 'system-status.job.fields.resource-id.label',
        }),
        width: 120,
        field: 'productName',
        cellRenderer: 'tooltippedCellRenderer',
        cellRendererParams: {
          tag: 'p',
        },
        filter: true,
      },
      {
        headerName: intl.formatMessage({
          id: 'system-status.job.fields.version.label',
        }),
        width: 100,
        field: 'version',
        valueFormatter: primitiveValueFormatter,
      },
      {
        headerName: intl.formatMessage({
          id: 'system-status.job.fields.type.label',
        }),
        width: 120,
        field: 'type',
        filter: true,
        sortable: true,
        valueFormatter: primitiveValueFormatter,
      },
      {
        headerName: intl.formatMessage({
          id: 'system-status.job.fields.priority.label',
        }),
        width: 150,
        // Binding status field to priority col, in order to keep it updated when status is changed.
        field: 'status',
        cellRenderer: 'priorityRenderer',
        cellRendererParams: {
          optionsData: getPriorityOptions,
          onChange: (
            evt: React.FormEvent<HTMLInputElement>,
            jobData: JobModelType
          ): void => {
            const { id, productType } = jobData;
            const chosenPriority: string | number = evt.currentTarget.value;
            const updateTaskDomain = getProductDomain(
              productType as ProductType,
              enumsMap ?? undefined
            );

            updateJobCB({
              id: id,
              domain: updateTaskDomain,
              data: {
                priority: parseInt(chosenPriority),
              },
            });
          },
          readOnly: (jobData: JobModelType): boolean => {
            return jobData.domain !== Domain.RASTER;
          },
        },
      },
      {
        headerName: intl.formatMessage({
          id: 'system-status.job.fields.created.label',
        }),
        width: 140,
        field: 'created',
        cellRenderer: 'dateCellRenderer',
        cellRendererParams: {
          field: 'created',
        },
        valueFormatter: primitiveValueFormatter,
        sortable: true,
        // @ts-ignore
        comparator: (valueA, valueB, nodeA, nodeB, isInverted): number =>
          valueA - valueB,
      },
      {
        headerName: intl.formatMessage({
          id: 'system-status.job.fields.updated.label',
        }),
        width: 140,
        field: 'updated',
        cellRenderer: 'dateCellRenderer',
        cellRendererParams: {
          field: 'updated',
        },
        valueFormatter: primitiveValueFormatter,
        sortable: true,
        // @ts-ignore
        comparator: (valueA, valueB, nodeA, nodeB, isInverted): number =>
          valueA - valueB,
      },
      // {
      //   headerName: intl.formatMessage({
      //     id: 'system-status.job.fields.expirationDate.label',
      //   }),
      //   width: 160,
      //   field: 'expirationDate',
      //   sortable: true,
      //   cellRenderer: 'dateCellRenderer',
      //   cellRendererParams: {
      //     field: 'expirationDate',
      //     comingSoonDaysIndication: 10,
      //     shouldShowPredicate: (data: JobModelType): boolean => {
      //       return (data.type as string).toLowerCase().includes('export');
      //     },
      //     onChange: (
      //       updatedExpirationDate: Date,
      //       jobData: JobModelType
      //     ): void => {
      //       const { id, productType } = jobData;
      //       const updateTaskDomain = getProductDomain(
      //         productType as ProductType,
      //         enumsMap ?? undefined
      //       );

      //       updateJobCB({
      //         id,
      //         domain: updateTaskDomain,
      //         data: {
      //           parameters: {
      //             cleanupData: {
      //               cleanupExpirationTime: updatedExpirationDate
      //             }
      //           },
      //         },
      //       });
      //     },
      //     datePickerProps: {
      //       disablePast: true,
      //       disableFuture: false,
      //       minDate: moment().add(1,'day').toDate(),
      //     }
      //   },
      //   // @ts-ignore
      //   comparator: (valueA, valueB, nodeA, nodeB, isInverted): number =>
      //     valueA - valueB,
      // },
      {
        headerName: intl.formatMessage({
          id: 'system-status.job.fields.status.label',
        }),
        width: 160,
        field: 'status',
        cellRenderer: 'statusRenderer',
        filter: {
          component: JobDetailsStatusFilter,
          doesFilterPass: (params: any) => {
            return params.model === params.handlerParams.getValue(params.node);
          },
        },
      },
      {
        pinned: 'right',
        headerName: '',
        width: 0,
        cellRenderer: 'actionsRenderer',
        cellRendererParams: {
          actions: getJobActions,
          actionHandler: dispatchAction,
        },
      },
    ],
    []
  );

  const getColDef = (gridOptions: GridComponentOptions): ColDef[] => {
    const firstColumnPadding = 120;
    let colDef: ColDef[];

    if (typeof omitColDefsByRenderer !== 'undefined') {
      const renderersList = omitColDefsByRenderer.renderers;

      if (!(omitColDefsByRenderer.preserveColWidth ?? false)) {
        colDef = defaultColDef.filter(
          (colDef) => !renderersList.includes(colDef.cellRenderer as string)
        ) as ColDef[];
      } else {
        colDef = defaultColDef.map((colDef) => {
          if (renderersList.includes(colDef.cellRenderer as string)) {
            return {
              ...colDef,
              cellRenderer: 'placeholderRenderer',
              headerName: '',
              pinned: undefined,
            };
          }
          return colDef;
        }) as ColDef[];
      }
    } else {
      colDef = defaultColDef as ColDef[];
    }

    if (typeof gridOptions.detailsRowCellRenderer === 'undefined') {
      colDef[0].width = firstColumnPadding;
    }

    return colDef;
  };

  const baseGridOption: GridComponentOptions = {
    enableRtl: CONFIG.I18N.DEFAULT_LANGUAGE.toUpperCase() === 'HE',
    enableFilterHandlers: true,
    suppressRowTransform: true,
    pagination: pagination,
    paginationPageSize: pageSize,
    paginationPageSizeSelector: false, //[pageSize, 20, 50, 100],
    getRowId: (params: GetRowIdParams): string => {
      return (params.data as JobModelType).id;
    },
    detailsRowCellRenderer: 'detailsRenderer',
    detailsRowHeight: 230,
    detailsRowExpanderPosition: 'start',
    overlayNoRowsTemplate: intl.formatMessage({
      id: 'results.nodata',
    }),
    loadingOverlayComponent: 'customLoadingOverlay',
    components: {
      jobDetailsStatusFilter: useCallback(JobDetailsStatusFilter, []),
      detailsRenderer: useCallback(JobDetailsRenderer, []),
      statusRenderer: useCallback(StatusRenderer, []),
      actionsRenderer: useCallback(ActionsRenderer, []),
      priorityRenderer: useCallback(PriorityRenderer, []),
      productTypeRenderer: useCallback(JobProductTypeRenderer, []),
      dateCellRenderer: useCallback(DateCellRenderer, []),
      tooltippedCellRenderer: useCallback(TooltippedCellRenderer, []),
      placeholderRenderer: useCallback(PlaceholderCellRenderer, []),
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
    singleClickEdit: true,
    suppressMenuHide: true, // Used to show filter icon at all times (not only when hovering the header).
    defaultColDef: {
      unSortIcon: true,
    },
    onGridReady,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: {
      detailsRowCellRendererPresencePredicate: (rowData: any) => {
        const jobData = rowData as JobModelType;
        return jobData.domain === Domain.RASTER;
      },
    },
  };

  const gridOptions = useMemo(() => {
    const combinedOptions = { ...baseGridOption, ...gridOptionsOverride };
    const colDefs = customColDef ?? getColDef(combinedOptions);
    return { ...combinedOptions, columnDefs: colDefs };
  }, []);

  const defaultGridStyle: React.CSSProperties = {
    height: '100%',
    padding: '12px',
  };

  return (
    <GridComponent
      gridOptions={gridOptions}
      rowData={rowData}
      style={{ ...defaultGridStyle, ...gridStyleOverride }}
      isLoading={areJobsLoading}
      focusByRowId={focusJobId}
      setIsRowFound={setIsRowFound}
      handleFocusError={handleFocusError}
    />
  );
};

export default JobManagerGrid;
