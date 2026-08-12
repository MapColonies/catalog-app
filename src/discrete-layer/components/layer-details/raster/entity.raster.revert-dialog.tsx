import React, { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { Feature, Geometry } from 'geojson';
import { Fill, Stroke, Style } from 'ol/style';
import area from '@turf/area';
import difference from '@turf/difference';
import { Box, GeoJSONFeature, VectorLayer, VectorSource } from '@map-colonies/react-components';
import { Checkbox } from '@map-colonies/react-core';
import { Mode } from '../../../../common/models/mode.enum';
import {
  isPolygonal,
  PolygonalGeometry,
  toFeature,
} from '../../../../common/utils/geojson.validation';
import { LayerRasterRecordModelType, RecordType } from '../../../models';
import { ActionDialogProps, DestructiveActionDialog } from '../destructive-action-dialog';
import { useRasterBackupData } from './use-raster-backup-data.hook';

import './entity.raster.revert-dialog.css';
import { OlLayerMap } from './layer-map';

type OverlayId = 'existing' | 'backup' | 'changedArea';

const DEFAULT_OVERLAY_VISIBILITY: Record<OverlayId, boolean> = {
  existing: true,
  backup: true,
  changedArea: false,
};

enum RevertOverlayZIndex {
  EXISTING = 21,
  BACKUP = 22,
  CHANGES_AREA = 23,
}

const EXISTING_COLOR = '#22C55E';
const BACKUP_COLOR = '#3B82F6';
const CHANGES_ADDED_COLOR = '#FF7F00'; // #FF3401
const CHANGES_REMOVED_COLOR = '#C62828';

const strokeAndFillStyle = (color: string): Style =>
  new Style({
    stroke: new Stroke({ width: 3, color }),
    fill: new Fill({ color: `${color}33` }),
  });

export const EXISTING_STYLE = strokeAndFillStyle(EXISTING_COLOR);
export const BACKUP_STYLE = strokeAndFillStyle(BACKUP_COLOR);
export const CHANGES_ADDED_STYLE = strokeAndFillStyle(CHANGES_ADDED_COLOR);
export const CHANGES_REMOVED_STYLE = strokeAndFillStyle(CHANGES_REMOVED_COLOR);

export const EntityRevertRasterDialog: React.FC<ActionDialogProps> = observer(
  (props: ActionDialogProps) => {
    const intl = useIntl();
    const currentLayer = props.layerRecord as LayerRasterRecordModelType;

    const [isExistingVisible, setIsExistingVisible] = useState(DEFAULT_OVERLAY_VISIBILITY.existing);
    const [isBackupVisible, setIsBackupVisible] = useState(DEFAULT_OVERLAY_VISIBILITY.backup);
    const [isChangedAreaVisible, setIsChangedAreaVisible] = useState(
      DEFAULT_OVERLAY_VISIBILITY.changedArea
    );

    const {
      backupMetadata,
      backupPolygonParts,
      changedAreaOuterPerimeter,
      loading,
      metadataError,
    } = useRasterBackupData(props.layerRecord);

    const SQUARE_METERS_PER_SQUARE_KM = 1_000_000;

    interface ChangedArea {
      added: Feature<PolygonalGeometry> | null;
      removed: Feature<PolygonalGeometry> | null;
      areaSquareKm: number;
    }

    const EMPTY_CHANGES_AREA: ChangedArea = { added: null, removed: null, areaSquareKm: 0 };

    const buildChangedArea = (
      existingFootprint: Geometry | undefined | null,
      changedAreaOuterPerimeter: Geometry | undefined | null
    ): ChangedArea => {
      if (!isPolygonal(existingFootprint) || !isPolygonal(changedAreaOuterPerimeter)) {
        return EMPTY_CHANGES_AREA;
      }

      const existingFeature = toFeature(existingFootprint);
      const backupFeature = toFeature(changedAreaOuterPerimeter);

      const added = difference(backupFeature, existingFeature);
      const removed = difference(existingFeature, backupFeature);

      const areaSquareMeters = (added ? area(added) : 0) + (removed ? area(removed) : 0);

      return {
        added,
        removed,
        areaSquareKm: areaSquareMeters / SQUARE_METERS_PER_SQUARE_KM,
      };
    };

    const backupFeatures = useMemo<Feature[]>(
      () =>
        (backupPolygonParts?.features ?? []).map((feature) => ({
          type: 'Feature',
          geometry: feature.geometry as Geometry,
          properties: feature.properties ?? null,
        })),
      [backupPolygonParts]
    );

    const changedAreaOuterPerimeterGeometry = changedAreaOuterPerimeter?.features?.[0]?.geometry as
      | Geometry
      | undefined;

    const changedArea = useMemo(
      () =>
        buildChangedArea(
          currentLayer.footprint as Geometry | undefined,
          changedAreaOuterPerimeterGeometry
        ),
      [currentLayer.footprint, changedAreaOuterPerimeterGeometry]
    );

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
        badgeBackground: BACKUP_COLOR,
      },
      {
        id: 'changedArea',
        labelId: 'revert.dialog.checkbox.changes-area.label',
        checked: isChangedAreaVisible,
        onChange: setIsChangedAreaVisible,
        badge: `${changedArea.areaSquareKm.toFixed(1)}${intl.formatMessage({
          id: 'resolutionConflict.units.km2',
        })}`,
        badgeBackground: `linear-gradient(to right, ${CHANGES_REMOVED_COLOR} 50%, ${CHANGES_ADDED_COLOR} 50%)`,
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
            <VectorLayer options={{ zIndex: RevertOverlayZIndex.EXISTING }}>
              <VectorSource>
                <GeoJSONFeature
                  geometry={currentLayer.footprint as Geometry}
                  featureStyle={EXISTING_STYLE}
                  fit={false}
                />
              </VectorSource>
            </VectorLayer>
          )}
        {isBackupVisible && backupFeatures.length > 0 && (
          <VectorLayer options={{ zIndex: RevertOverlayZIndex.BACKUP }}>
            <VectorSource>
              {backupFeatures.map((feature, index) => (
                <GeoJSONFeature
                  key={feature.properties?.id ?? index}
                  geometry={feature}
                  featureStyle={BACKUP_STYLE}
                  fit={false}
                />
              ))}
            </VectorSource>
          </VectorLayer>
        )}
        {isChangedAreaVisible && (
          <VectorLayer options={{ zIndex: RevertOverlayZIndex.CHANGES_AREA }}>
            <VectorSource>
              {changedArea.added && (
                <GeoJSONFeature
                  geometry={changedArea.added}
                  featureStyle={CHANGES_ADDED_STYLE}
                  fit={false}
                />
              )}
              {changedArea.removed && (
                <GeoJSONFeature
                  geometry={changedArea.removed}
                  featureStyle={CHANGES_REMOVED_STYLE}
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
