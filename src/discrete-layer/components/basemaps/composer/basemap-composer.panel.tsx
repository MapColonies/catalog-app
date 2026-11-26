import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { useFormik } from 'formik';
import { useIntl } from 'react-intl';
import { Box, CesiumViewer } from '@map-colonies/react-components';
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
} from '../../../../common/components/grid';
import {
  THUMBNAIL_128_DIMENSIONS,
  ThumbnailCapture,
  useThumbnailCapture,
} from '../../../../common/components/thumbnail-capture';
import CONFIG from '../../../../common/config';
import { isRtl } from '../../../../common/i18n/helpers';
import { useStore } from '../../../models/RootStore';
import { SourceType } from '../../../models/SourceTypeEnum';
import { useMapViewer } from '../../map-container/cesium-map-viewer.bridge';
import type { BasemapsPanelProps } from '../basemaps-router';
import {
  ComposerLayer,
  useBasemapComposition,
  useLoadComposedBasemap,
} from './basemap-composition.hook';

import './basemap-composer.panel.css';

interface LayerRow {
  id: string;
  name: string;
  source: string;
  opacity: number;
  isUnresolved: boolean;
}

const SOURCE_TYPE_LABEL_IDS: Record<SourceType, string> = {
  [SourceType.CATALOG_RESOURCE]: 'basemap.composer.layers.source.catalog-resolved',
  [SourceType.EXTERNAL]: 'basemap.composer.layers.source.external',
};
const UNRESOLVED_LABEL_ID = 'basemap.composer.layers.source.catalog-unresolved';

const clampPercent = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

const BasemapThumbnail: React.FC<{
  mapViewer: CesiumViewer;
  thumbnailBlob?: Blob;
  savedThumbnailUrl?: string;
  onCaptured: (blob: Blob) => void;
}> = ({ mapViewer, thumbnailBlob, savedThumbnailUrl, onCaptured }) => {
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
      thumbnailUrl={thumbnailUrl ?? (savedThumbnailUrl || undefined)}
      capture={capture}
    />
  );
};

export const BasemapComposer: React.FC<BasemapsPanelProps<'BasemapComposer'>> = observer(
  ({ navigation, route }) => {
    const intl = useIntl();
    const { basemapsStore } = useStore();
    const [isComprehensiveChangeOpen, setIsComprehensiveChangeOpen] = useState(false);
    const [thumbnailBlob, setThumbnailBlob] = useState<Blob>();
    const mapViewer = useMapViewer();
    const basemapId = route.params?.id;

    useLoadComposedBasemap();
    const composition = useBasemapComposition();
    // `gridOptions` are applied by the grid once, so its callbacks read the latest composition from here
    const compositionRef = useRef(composition);
    compositionRef.current = composition;
    const savedBasemap = basemapsStore.composingBasemap;

    useEffect(() => {
      setThumbnailBlob(undefined);
      basemapsStore.startComposing(basemapId);
      return (): void => {
        compositionRef.current.clear();
        basemapsStore.stopComposing();
      };
    }, [basemapsStore, basemapId]);

    const formik = useFormik({
      enableReinitialize: true,
      initialValues: {
        name: savedBasemap?.name ?? '',
        isCurrent: savedBasemap?.isCurrent ?? false,
        isForPreview: savedBasemap?.isForPreview ?? false,
      },
      onSubmit: async (values): Promise<void> => {
        try {
          await basemapsStore.saveBasemap(values, composition.buildInput(), thumbnailBlob);
          composition.clear();
          await basemapsStore.getBasemaps();
          basemapsStore.stopComposing();
          navigation.goBack();
        } catch (error) {
          console.error(error);
        }
      },
    });

    const rowData: LayerRow[] = composition.layers.map((layer: ComposerLayer) => ({
      id: layer.id,
      name: layer.name,
      source: intl.formatMessage({
        id: layer.isUnresolved ? UNRESOLVED_LABEL_ID : SOURCE_TYPE_LABEL_IDS[layer.sourceType],
      }),
      opacity: Math.round(layer.opacity * 100),
      isUnresolved: layer.isUnresolved,
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
            compositionRef.current.setOpacity(data.id, clampPercent(percent) / 100);
          }
          // rows are re-read from the map; the grid must not mutate its own copy
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
                compositionRef.current.removeLayer(data.id);
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
      onRowDragEnd: ({ node, overIndex }: GridRowDragEndEvent): void => {
        if (node.data !== undefined && overIndex >= 0) {
          compositionRef.current.moveLayer(node.data.id, overIndex);
        }
      },
    };

    if (basemapsStore.composingBasemapId === undefined) {
      return null;
    }

    return (
      <Box className="basemapComposerPanel">
        <TextField
          outlined
          placeholder={intl.formatMessage({ id: 'basemap.composer.new-basemap-name' })}
          name="name"
          value={formik.values.name}
          onChange={formik.handleChange}
        />

        <GridComponent gridOptions={gridOptions} rowData={rowData} style={{ width: '100%' }} />

        <Select
          id="basemap-action-selector"
          enhanced
          outlined
          onChange={(event: React.ChangeEvent<HTMLSelectElement>): void => {
            const selectedValue = event.currentTarget.value;
            if (selectedValue !== '') {
              navigation.navigate('AddLayer', {
                actionSelector: selectedValue as SourceType,
              });
            }
          }}
        >
          <MenuItem value="" disabled>
            {intl.formatMessage({ id: 'basemap.composer.add-layer' })}
          </MenuItem>
          <MenuItem value={SourceType.CATALOG_RESOURCE}>
            {intl.formatMessage({ id: 'basemap.composer.action-selector.catalog-resource' })}
          </MenuItem>
          <MenuItem value={SourceType.EXTERNAL}>
            {intl.formatMessage({ id: 'basemap.composer.action-selector.external' })}
          </MenuItem>
        </Select>

        <Typography tag="span" className="basemapComposerSectionTitle">
          {intl.formatMessage({ id: 'basemap.composer.thumbnail.title' })}
        </Typography>
        {mapViewer && (
          <BasemapThumbnail
            mapViewer={mapViewer}
            thumbnailBlob={thumbnailBlob}
            savedThumbnailUrl={savedBasemap?.thumbnail?.url}
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
                name="isCurrent"
                checked={formik.values.isCurrent}
                onChange={formik.handleChange}
              />
              <Checkbox
                label={intl.formatMessage({ id: 'basemap.composer.comprehensive-change.preview' })}
                name="isForPreview"
                checked={formik.values.isForPreview}
                onChange={formik.handleChange}
              />
            </Box>
          )}
        </Box>

        <Box className="basemapComposerFooter">
          <Button
            type="button"
            outlined
            onClick={(): void => basemapsStore.exportComposedBasemap()}
          >
            {intl.formatMessage({ id: 'basemap.composer.export' })}
          </Button>
          <Button
            type="button"
            raised
            disabled={formik.values.name.trim() === '' || composition.layers.length === 0}
            onClick={(): void => {
              void formik.submitForm();
            }}
          >
            {intl.formatMessage({ id: 'general.save-btn.text' })}
          </Button>
        </Box>
      </Box>
    );
  }
);
