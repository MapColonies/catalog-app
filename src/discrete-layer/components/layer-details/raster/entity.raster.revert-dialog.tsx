import React, { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { BBox, Feature, Geometry } from 'geojson';
import { get } from 'lodash';
import { Fill, Stroke, Style } from 'ol/style';
import area from '@turf/area';
import bboxPolygon from '@turf/bbox-polygon';
import difference from '@turf/difference';
import { Box, GeoJSONFeature, VectorLayer, VectorSource } from '@map-colonies/react-components';
import { Checkbox } from '@map-colonies/react-core';
import { useEnums } from '../../../../common/hooks/useEnum.hook';
import { Mode } from '../../../../common/models/mode.enum';
import {
  isPolygonal,
  PolygonalGeometry,
  toFeature,
} from '../../../../common/utils/geojson.validation';
import CONFIG from '../../../../common/config';
import { LayerRasterRecordModelType, RecordType, useStore } from '../../../models';
import { GeojsonFeatureInput } from '../../../models/RootStore.base';
import { ActionDialogProps, DestructiveActionDialog } from '../destructive-action-dialog';
import { useRasterBackupData } from './use-raster-backup-data.hook';
import { FeatureType } from './feature-type.enum';
import {
  IQueryExecutorResponse,
  PolygonPartsExtentQueryVectorLayer,
} from './polygon-parts-extent-query-vector-layer';
import { VectorLayerZIndex, getWFSFeatureTypeName } from './pp-map.utils';

import './entity.raster.revert-dialog.css';
import { OlLayerMap } from './layer-map';

type OverlayId = 'existing' | 'backup' | 'changedArea';

const DEFAULT_OVERLAY_VISIBILITY: Record<OverlayId, boolean> = {
  existing: true,
  backup: true,
  changedArea: false,
};

const EXISTING_COLOR = '#22C55E';
const BACKUP_PP_COLOR = '#3B82F6';
const CHANGES_OVERLAPPED_COLOR = '#C62828';
const CHANGES_ADDED_COLOR = '#FF7F00';

const strokeAndFillStyle = (color: string): Style =>
  new Style({
    stroke: new Stroke({ width: 3, color }),
    fill: new Fill({ color: `${color}33` }),
  });

export const EXISTING_STYLE = strokeAndFillStyle(EXISTING_COLOR);
export const CHANGES_ADDED_STYLE = strokeAndFillStyle(CHANGES_ADDED_COLOR);
export const CHANGES_OVERLAPPED_STYLE = strokeAndFillStyle(CHANGES_OVERLAPPED_COLOR);

export const EntityRevertRasterDialog: React.FC<ActionDialogProps> = observer(
  (props: ActionDialogProps) => {
    const intl = useIntl();
    const store = useStore();
    const ENUMS = useEnums();
    const currentLayer = props.layerRecord as LayerRasterRecordModelType;

    const [isExistingVisible, setIsExistingVisible] = useState(DEFAULT_OVERLAY_VISIBILITY.existing);
    const [isBackupVisible, setIsBackupVisible] = useState(DEFAULT_OVERLAY_VISIBILITY.backup);
    const [isChangedAreaVisible, setIsChangedAreaVisible] = useState(
      DEFAULT_OVERLAY_VISIBILITY.changedArea
    );

    const {
      backupMetadata,
      outerPerimeter: changedAreaOuterPerimeter,
      loading,
      metadataError,
    } = useRasterBackupData(props.layerRecord);

    const SQUARE_METERS_PER_SQUARE_KM = 1_000_000;

    interface ChangedArea {
      overlapped: Feature<PolygonalGeometry> | null;
      added: Feature<PolygonalGeometry> | null;
      areaSquareKm: number;
    }

    const EMPTY_CHANGED_AREA: ChangedArea = { overlapped: null, added: null, areaSquareKm: 0 };

    const buildChangedArea = (
      backupFootprint: Geometry | undefined | null,
      changedAreaOuterPerimeter: Geometry | undefined | null,
      changedAreaOuterPerimeterArea: number | undefined
    ): ChangedArea => {
      if (!isPolygonal(backupFootprint) || !isPolygonal(changedAreaOuterPerimeter)) {
        return EMPTY_CHANGED_AREA;
      }
      const backupFeature = toFeature(backupFootprint);
      const changedAreaFeature = toFeature(changedAreaOuterPerimeter);
      const overlapped = difference(backupFeature, changedAreaFeature);
      const added = difference(changedAreaFeature, backupFeature);
      const areaSquareMeters = (added ? area(added) : 0) + (overlapped ? area(overlapped) : 0);
      const areaSquareKm =
        changedAreaOuterPerimeterArea ?? areaSquareMeters / SQUARE_METERS_PER_SQUARE_KM;
      return {
        overlapped,
        added,
        areaSquareKm,
      };
    };

    const changedAreaOuterPerimeterGeometry = changedAreaOuterPerimeter?.features?.[0]?.geometry as
      | Geometry
      | undefined;

    const changedArea = useMemo(
      () =>
        buildChangedArea(
          backupMetadata?.footprint as Geometry | undefined,
          changedAreaOuterPerimeterGeometry,
          changedAreaOuterPerimeter?.features?.[0]?.properties?.area as number | undefined
        ),
      [backupMetadata?.footprint, changedAreaOuterPerimeterGeometry]
    );

    const backupQueryExecutor = async (
      bbox: BBox,
      startIndex: number
    ): Promise<IQueryExecutorResponse> => {
      if (!backupMetadata) {
        return { features: [], pageSize: -1 };
      }
      const result = await store.queryGetRasterBackupPolygonPartsFeature({
        data: {
          feature: bboxPolygon(bbox) as GeojsonFeatureInput,
          typeName: getWFSFeatureTypeName(backupMetadata, ENUMS),
          count: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES,
          startIndex,
        },
      });
      const fetchedFeatures = get(result, 'getRasterBackupPolygonPartsFeature.features', []);
      const features = (Array.isArray(fetchedFeatures) ? fetchedFeatures : []).map((feature) => ({
        ...feature,
        properties: {
          ...(feature?.properties ?? {}),
          _featureType: FeatureType.BACKUP_PP,
        },
      }));
      return { features, pageSize: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES };
    };

    const closeDialog = (): void => {
      props.onSetOpen(false);
    };

    const overlayCheckboxes: {
      id: OverlayId;
      labelId: string;
      checked: boolean;
      onChange: (checked: boolean) => void;
      badge: string;
      badgeBackground: string;
    }[] = [
      {
        id: 'existing',
        labelId: 'revert.dialog.checkbox.existing.label',
        checked: isExistingVisible,
        onChange: setIsExistingVisible,
        badge: currentLayer.productVersion ? `v${currentLayer.productVersion}` : '',
        badgeBackground: EXISTING_COLOR,
      },
      {
        id: 'backup',
        labelId: 'revert.dialog.checkbox.backup.label',
        checked: isBackupVisible,
        onChange: setIsBackupVisible,
        badge: backupMetadata?.productVersion ? `v${backupMetadata.productVersion}` : '',
        badgeBackground: BACKUP_PP_COLOR,
      },
      {
        id: 'changedArea',
        labelId: 'revert.dialog.checkbox.changed-area.label',
        checked: isChangedAreaVisible,
        onChange: setIsChangedAreaVisible,
        badge: `${changedArea.areaSquareKm.toFixed(1)}${intl.formatMessage({
          id: 'resolutionConflict.units.km2',
        })}`,
        badgeBackground: `linear-gradient(to right, ${CHANGES_OVERLAPPED_COLOR} 50%, ${CHANGES_ADDED_COLOR} 50%)`,
      },
    ];

    const sidePanel = (
      <Box className="overlayCheckboxes" role="group">
        {overlayCheckboxes.map((cfg) => (
          <Box key={cfg.id} className="overlayCheckboxRow">
            <Checkbox
              className="overlayCheckbox"
              label={intl.formatMessage({ id: cfg.labelId })}
              checked={cfg.checked}
              onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
                evt.stopPropagation();
                cfg.onChange(evt.currentTarget.checked);
              }}
            />
            <Box className="overlayCheckboxBadge" style={{ background: cfg.badgeBackground }}>
              {cfg.badge}
            </Box>
          </Box>
        ))}
      </Box>
    );

    const mapChildren = (
      <>
        {isExistingVisible &&
          currentLayer.footprint !== undefined &&
          currentLayer.footprint !== null && (
            <VectorLayer options={{ zIndex: VectorLayerZIndex.EXISTING }}>
              <VectorSource>
                <GeoJSONFeature
                  geometry={currentLayer.footprint as Geometry}
                  featureStyle={EXISTING_STYLE}
                  fit={false}
                />
              </VectorSource>
            </VectorLayer>
          )}
        {isBackupVisible && backupMetadata && (
          <PolygonPartsExtentQueryVectorLayer
            featureType={FeatureType.BACKUP_PP}
            queryExecutor={backupQueryExecutor}
            outerPerimeter={backupMetadata.footprint as Geometry | undefined}
            options={{
              properties: { id: FeatureType.BACKUP_PP },
              zIndex: VectorLayerZIndex.BACKUP,
            }}
          />
        )}
        {isChangedAreaVisible && (
          <VectorLayer
            options={{
              maxZoom: CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL,
              zIndex: VectorLayerZIndex.CHANGED_AREA,
            }}
          >
            <VectorSource>
              {changedArea.added && (
                <GeoJSONFeature
                  geometry={changedArea.added}
                  featureStyle={CHANGES_ADDED_STYLE}
                  fit={false}
                />
              )}
              {changedArea.overlapped && (
                <GeoJSONFeature
                  geometry={changedArea.overlapped}
                  featureStyle={CHANGES_OVERLAPPED_STYLE}
                  fit={false}
                />
              )}
            </VectorSource>
          </VectorLayer>
        )}
      </>
    );

    const revertLayer = (approverName: string, approvalCode: string): void => {
      // eslint-disable-next-line no-console
      console.log('[EntityRevertRasterDialog] mock revert submit', {
        id: props.layerRecord.id,
        type: props.layerRecord.type as RecordType,
        approverName,
        approvalCode,
      });
      props.onSuccess?.();
      props.onSetOpen(false);
    };

    const map = (
      <OlLayerMap
        layerRecord={props.layerRecord}
        showBaseMap={{ value: true, showToggleButton: false }}
        style={{ position: 'relative', direction: 'ltr', height: '100%' }}
      >
        {mapChildren}
      </OlLayerMap>
    );

    return (
      <DestructiveActionDialog
        elementId="rasterRevertDialog"
        action={Mode.REVERT}
        isOpen={props.isOpen}
        layerRecord={props.layerRecord}
        recordType={RecordType.RECORD_RASTER}
        disclaimerActionId="action.dialog.revert"
        onClose={closeDialog}
        onSubmit={revertLayer}
        loading={loading}
        error={metadataError ?? null}
        map={map}
        // map={
        //   <Box style={{ height: '100%', backgroundColor: 'lightgray', color: 'red' }}>
        //     MAP PLACEHOLDER
        //   </Box>
        // }
        sidePanel={sidePanel}
        // sidePanel={
        //   <Box style={{ width: '100%', height: '25%', backgroundColor: 'lightgray', color: 'red' }}>
        //     SWITCHES PLACEHOLDER
        //   </Box>
        // }
      />
    );
  }
);
