import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useIntl } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import {
  Button,
  Checkbox,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@map-colonies/react-core';
import type { ColDef, ICellRendererParams, ValueSetterParams } from 'ag-grid-community';
import {
  GridComponent,
  GridComponentOptions,
  GridRowDragEndEvent,
} from '../../../common/components/grid';
import {
  THUMBNAIL_128_DIMENSIONS,
  ThumbnailCapture,
  useThumbnailCapture,
} from '../../../common/components/thumbnail-capture';
import CONFIG from '../../../common/config';
import { isRtl } from '../../../common/i18n/helpers';
import { useStore } from '../../models/RootStore';
import type { CesiumViewer } from '@map-colonies/react-components';
import type { BasemapsPanelProps } from './basemaps-router';
import { BasemapLayerOutput, SourceTypeInput, SourceTypeOutput } from './XXXbasemapMockXXX';

import './basemap-composer.panel.css';
import { useMapViewer } from '../map-container/cesium-map-viewer.bridge';

interface LayerRow {
  id: string;
  name: string;
  source: string;
  opacity: number;
  isUnresolved: boolean;
}

const SOURCE_TYPE_LABEL_IDS: Record<SourceTypeOutput, string> = {
  [SourceTypeOutput.RESOLVED_CATALOG_RESOURCE]: 'basemap.composer.layers.source.catalog-resolved',
  [SourceTypeOutput.UNRESOLVED_CATALOG_RESOURCE]:
    'basemap.composer.layers.source.catalog-unresolved',
  [SourceTypeOutput.EXTERNAL]: 'basemap.composer.layers.source.external',
};

const getLayerName = (layer: BasemapLayerOutput): string => {
  switch (layer.source.type) {
    case SourceTypeOutput.RESOLVED_CATALOG_RESOURCE:
      return layer.source.layer.productName ?? layer.id;
    case SourceTypeOutput.UNRESOLVED_CATALOG_RESOURCE:
      return layer.source.uniqueness.productId;
    default:
      return layer.source.details.name;
  }
};

const clampPercent = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

const sortLayersByOrder = (layers: readonly BasemapLayerOutput[]): BasemapLayerOutput[] =>
  [...layers].sort((curr, next) => curr.order - next.order);

const BasemapThumbnail: React.FC<{
  mapViewer: CesiumViewer;
  thumbnailBlob?: Blob;
  onCaptured: (blob: Blob) => void;
}> = observer(({ mapViewer, thumbnailBlob, onCaptured }) => {
  const { basemapsStore } = useStore();
  const [thumbnailUrl, setThumbnailUrl] = useState<string>();

  useEffect(() => {
    if (!thumbnailBlob) {
      setThumbnailUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(thumbnailBlob);
    setThumbnailUrl(url);
    return (): void => URL.revokeObjectURL(url);
  }, [thumbnailBlob]);

  const capture = useThumbnailCapture({
    mapViewer,
    dimensions: THUMBNAIL_128_DIMENSIONS,
    onCaptured,
  });
  return (
    <ThumbnailCapture
      thumbnailUrl={thumbnailUrl ?? (basemapsStore.draftBasemap?.thumbnail.url || undefined)}
      capture={capture}
    />
  );
});

export const BasemapComposer: React.FC<BasemapsPanelProps<'BasemapComposer'>> = observer(
  ({ navigation, route }) => {
    const intl = useIntl();
    const { basemapsStore } = useStore();
    const [isComprehensiveChangeOpen, setIsComprehensiveChangeOpen] = useState(false);
    const [thumbnailBlob, setThumbnailBlob] = useState<Blob>();
    const mapViewer = useMapViewer();
    const basemapId = route.params?.id;

    useEffect(() => {
      setThumbnailBlob(undefined);
      basemapsStore.startDraft(basemapId);
      return (): void => basemapsStore.clearDraft();
    }, [basemapsStore, basemapId]);

    const draft = basemapsStore.draftBasemap;

    const orderedLayers = useMemo(() => {
      return sortLayersByOrder(draft?.layers ?? []);
    }, [draft?.layers]);

    const rowData: LayerRow[] = orderedLayers.map((layer) => ({
      id: layer.id,
      name: getLayerName(layer),
      source: intl.formatMessage({ id: SOURCE_TYPE_LABEL_IDS[layer.source.type] }),
      opacity: Math.round(layer.opacity * 100),
      isUnresolved: layer.source.type === SourceTypeOutput.UNRESOLVED_CATALOG_RESOURCE,
    }));

    const columnDefs: ColDef<LayerRow>[] = [
      {
        rowDrag: true,
        width: 50,
        maxWidth: 50,
        sortable: false,
        resizable: false,
      },
      {
        field: 'name',
        headerName: intl.formatMessage({ id: 'basemap.composer.layers.name' }),
        headerTooltip: intl.formatMessage({ id: 'basemap.composer.layers.name' }),
        flex: 1,
      },
      {
        field: 'source',
        headerName: intl.formatMessage({ id: 'basemap.composer.layers.source' }),
        width: 90,
        headerTooltip: intl.formatMessage({ id: 'basemap.composer.layers.source' }),
      },
      {
        field: 'opacity',
        headerName: intl.formatMessage({ id: 'basemap.composer.layers.opacity' }),
        width: 90,
        headerTooltip: intl.formatMessage({ id: 'basemap.composer.layers.opacity' }),
        editable: true,
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: { min: 0, max: 100, precision: 0 },
        valueFormatter: ({ value }): string => `${String(value)}%`,
        valueSetter: ({ data, newValue }: ValueSetterParams<LayerRow>): boolean => {
          const percent = Number(newValue);
          if (!Number.isNaN(percent)) {
            basemapsStore.setDraftLayerOpacity(data.id, clampPercent(percent) / 100);
          }
          // rows are re-fed from the store; the grid must not mutate its own copy
          return false;
        },
      },
      {
        width: 50,
        cellRenderer: ({ data }: ICellRendererParams<LayerRow>): React.ReactElement => (
          <IconButton
            className="mc-icon-Delete"
            title={intl.formatMessage({ id: 'basemap.composer.layers.remove' })}
            onClick={(): void => {
              if (data) {
                basemapsStore.removeDraftLayer(data.id);
              }
            }}
          />
        ),
      },
    ];

    const gridOptions: GridComponentOptions = {
      enableRtl: isRtl(CONFIG.I18N.DEFAULT_LANGUAGE),
      domLayout: 'autoHeight',
      headerHeight: 28,
      rowHeight: 40,
      rowDragManaged: true,
      rowDragText: (params) => {
        return params.rowNode?.data?.name ?? '';
      },
      suppressMovableColumns: true,
      suppressCellFocus: true,
      defaultColDef: {
        sortable: false,
        filter: false,
        resizable: false,
        suppressHeaderMenuButton: true,
      },
      rowClassRules: {
        basemapLayerUnresolved: ({ data }): boolean => (data as LayerRow).isUnresolved,
      },
      getRowId: ({ data }): string => (data as LayerRow).id,
      columnDefs,
      // gridOptions are applied by the grid once, so read fresh store state here
      onRowDragEnd: ({ node, overIndex }: GridRowDragEndEvent): void => {
        const currentOrderedLayers = sortLayersByOrder(basemapsStore.draftBasemap?.layers ?? []);
        const fromIndex = currentOrderedLayers.findIndex(({ id }) => id === node.data?.id);
        if (fromIndex >= 0 && overIndex >= 0 && fromIndex !== overIndex) {
          basemapsStore.moveDraftLayer(fromIndex, overIndex);
        }
      },
    };

    if (draft === undefined) {
      return null;
    }

    return (
      <Box className="basemapComposerPanel">
        <TextField
          outlined
          placeholder={intl.formatMessage({ id: 'basemap.composer.new-basemap-name' })}
          value={draft.name}
          onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
            basemapsStore.updateDraft({ name: event.currentTarget.value })
          }
        />

        <Typography tag="span" className="basemapComposerSectionTitle">
          {intl.formatMessage({ id: 'basemap.composer.thumbnail.title' })}
        </Typography>
        {mapViewer && (
          <BasemapThumbnail
            mapViewer={mapViewer}
            thumbnailBlob={thumbnailBlob}
            onCaptured={setThumbnailBlob}
          />
        )}

        <Box>
          <Button
            type="button"
            className="basemapComposerOpenComprehensiveDropdown"
            // className={`basemapComposerOpenComprehensiveDropdown ${isComprehensiveChangeOpen ? 'mc-icon-Collapce-Panel' : 'mc-icon-Expand-Panel'}`}
            icon={isComprehensiveChangeOpen ? 'expand_less' : 'expand_more'}
            onClick={(): void => setIsComprehensiveChangeOpen(!isComprehensiveChangeOpen)}
          >
            {intl.formatMessage({ id: 'basemap.composer.comprehensive-change.title' })}
          </Button>
          {isComprehensiveChangeOpen && (
            <Box className="basemapComposerComprehensiveChangeOpenBody">
              <Typography tag="h4" className="basemapComposerSectionTitle">
                {intl.formatMessage({ id: 'basemap.composer.comprehensive-change.title' })}
              </Typography>
              <Checkbox
                label={intl.formatMessage({ id: 'basemap.composer.comprehensive-change.current' })}
                checked={draft.isCurrent}
                onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
                  basemapsStore.updateDraft({ isCurrent: event.currentTarget.checked })
                }
              />
              <Checkbox
                label={intl.formatMessage({ id: 'basemap.composer.comprehensive-change.preview' })}
                checked={draft.isForPreview}
                onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
                  basemapsStore.updateDraft({ isForPreview: event.currentTarget.checked })
                }
              />
            </Box>
          )}
        </Box>

        <GridComponent gridOptions={gridOptions} rowData={rowData} style={{ width: '100%' }} />

        <Select
          id="basemap-action-selector"
          enhanced
          outlined
          onChange={(event: React.ChangeEvent<HTMLSelectElement>): void => {
            const selectedValue = event.currentTarget.value;
            if (selectedValue !== '') {
              navigation.navigate('AddLayer', {
                actionSelector: selectedValue as SourceTypeInput,
              });
            }
          }}
        >
          <MenuItem value="" disabled>
            {intl.formatMessage({ id: 'basemap.composer.add-layer' })}
          </MenuItem>
          <MenuItem value={SourceTypeInput.CATALOG_RESOURCE}>
            {intl.formatMessage({ id: 'basemap.composer.action-selector.catalog-resource' })}
          </MenuItem>
          <MenuItem value={SourceTypeInput.EXTERNAL}>
            {intl.formatMessage({ id: 'basemap.composer.action-selector.external' })}
          </MenuItem>
        </Select>

        <Box className="basemapComposerFooter">
          <Button type="button" outlined onClick={(): void => basemapsStore.exportDraftBasemap()}>
            {intl.formatMessage({ id: 'basemap.composer.export' })}
          </Button>
          <Button
            type="button"
            raised
            onClick={async (): Promise<void> => {
              try {
                await basemapsStore.saveBasemap(thumbnailBlob);
              } catch (error) {
                console.error(error);
              }
            }}
          >
            {intl.formatMessage({ id: 'general.save-btn.text' })}
          </Button>
        </Box>
      </Box>
    );
  }
);
