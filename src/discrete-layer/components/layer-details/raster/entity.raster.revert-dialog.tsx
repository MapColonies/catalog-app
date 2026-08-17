import React, { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { BBox, Feature, GeoJsonProperties, Geometry, Polygon } from 'geojson';
import { Style } from 'ol/style';
import { get } from 'lodash';
import area from '@turf/area';
import difference from '@turf/difference';
import intersect from '@turf/intersect';
import buffer from '@turf/buffer';
import bboxPolygon from '@turf/bbox-polygon';
import { Box } from '@map-colonies/react-components';
import { Switch, Typography } from '@map-colonies/react-core';
import { Mode } from '../../../../common/models/mode.enum';
import {
  isPolygonal,
  PolygonalGeometry,
  toFeature,
} from '../../../../common/utils/geojson.validation';
import { useEnums } from '../../../../common/hooks/useEnum.hook';
import CONFIG from '../../../../common/config';
import { GeojsonFeatureInput } from '../../../models/RootStore.base';
import { LayerRasterRecordModelType, RecordType, useStore } from '../../../models';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import { ActionDialogProps, DestructiveActionDialog } from '../destructive-action-dialog';
import { useRasterBackupData } from './use-raster-backup-data.hook';
import {
  FEATURE_LABEL_CONFIG,
  getCSSFromOlStyle,
  getText,
  getWFSFeatureTypeName,
  IStyleByProp,
  PPMapStyles,
  VectorLayerZIndex,
} from './pp-map.utils';
import {
  IQueryExecutorResponse,
  PolygonPartsExtentQueryVectorLayer,
} from './polygon-parts-extent-query-vector-layer';
import { OlLayerMap } from './layer-map';
import { FeatureType } from './feature-type.enum';

import './entity.raster.revert-dialog.css';

const WFS_BUFFER_DELTA = -0.2;
const NO_VALUE = '–';

export const EntityRevertRasterDialog: React.FC<ActionDialogProps> = observer(
  (props: ActionDialogProps) => {
    const intl = useIntl();
    const store = useStore();
    const ENUMS = useEnums();
    const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
    const currentLayer = props.layerRecord as LayerRasterRecordModelType;

    const [showChangedArea, setShowChangedArea] = useState(true);
    const [showBackup, setShowBackup] = useState(true);
    const [showExisting, setShowExisting] = useState(false);
    const [showLabels, setShowLabels] = useState(false);

    const {
      backupMetadata,
      outerPerimeter: changedAreaOuterPerimeter,
      loading,
      metadataError,
      outerPerimeterError,
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
      const overlapped = intersect(backupFeature, changedAreaFeature);
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

    const changedArea = useMemo(() => {
      const res = buildChangedArea(
        backupMetadata?.footprint as Geometry | undefined,
        changedAreaOuterPerimeterGeometry,
        changedAreaOuterPerimeter?.features?.[0]?.properties?.area as number | undefined
      );
      return res;
    }, [backupMetadata?.footprint, changedAreaOuterPerimeterGeometry]);

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

    const buildQueryExecutor =
      (clipFootprint: Feature<Geometry, GeoJsonProperties>, featureType: FeatureType) =>
      async (bbox: BBox, startIndex: number): Promise<IQueryExecutorResponse> => {
        const bboxFeature = bboxPolygon(bbox);
        const intersectedFeature = intersect(
          bboxFeature as Feature<any, any>,
          clipFootprint as Feature<any, any>
        );
        if (!intersectedFeature) {
          return { features: [], pageSize: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES };
        }
        const featureWithDelta = buffer(intersectedFeature as Feature<Polygon>, WFS_BUFFER_DELTA, {
          units: 'meters',
        });
        const result = await store.queryGetPolygonPartsFeature({
          data: {
            feature: featureWithDelta as GeojsonFeatureInput,
            typeName: getWFSFeatureTypeName(props.layerRecord as LayerRasterRecordModelType, ENUMS),
            count: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES,
            startIndex,
            filterProperties: [
              {
                propertyName: 'productVersion',
                propertyValue: (props.layerRecord as LayerRasterRecordModelType)
                  .productVersion as string,
              },
            ],
          },
        });
        const fetchedFeatures = get(result, 'getPolygonPartsFeature.features', []);
        const features = (Array.isArray(fetchedFeatures) ? fetchedFeatures : []).map((feature) => {
          return {
            ...feature,
            properties: {
              ...(feature?.properties ?? {}),
              _featureType: featureType,
              _featureTitle: getText(feature, 4, FEATURE_LABEL_CONFIG.polygons, ZOOM_LEVELS_TABLE),
            },
          };
        });
        return { features, pageSize: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES };
      };

    const queryExecutorOverlapped = useMemo(
      () =>
        buildQueryExecutor(
          changedArea.overlapped as Feature<Geometry, GeoJsonProperties>,
          FeatureType.CHANGED_AREA_OVERLAPPED_PP
        ),
      [changedArea]
    );

    const queryExecutorAdded = useMemo(
      () =>
        buildQueryExecutor(
          changedArea.added as Feature<Geometry, GeoJsonProperties>,
          FeatureType.CHANGED_AREA_ADDED_PP
        ),
      [changedArea]
    );

    const closeDialog = (): void => {
      props.onSetOpen(false);
    };

    const FeaturePreview: React.FC<{ stylePP: IStyleByProp | undefined; text?: string }> = (props: {
      stylePP: IStyleByProp | undefined;
      text?: string;
    }) => {
      return (
        <Box
          className={props.text ? 'featureTitlePreviewBadge' : 'featurePreviewBadge'}
          style={{ ...getCSSFromOlStyle(props.stylePP) }}
        >
          {props.text}
        </Box>
      );
    };

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
        map={
          <OlLayerMap
            layerRecord={props.layerRecord}
            showLabels={showLabels}
            style={{ height: '100%' }}
            showPolygonParts={{ value: showExisting, showCheckbox: false }}
            additionalLegends={[
              FeatureType.CHANGED_AREA_ADDED_PP,
              FeatureType.CHANGED_AREA_OVERLAPPED_PP,
              FeatureType.BACKUP_PP,
            ].map((featureType) => ({
              title: intl.formatMessage({ id: `polygon-parts.map-preview-legend.${featureType}` }),
              style: PPMapStyles.get(featureType)?.style as Style,
            }))}
          >
            <>
              {showChangedArea && (
                <>
                  <PolygonPartsExtentQueryVectorLayer
                    featureType={FeatureType.CHANGED_AREA_OVERLAPPED_PP}
                    queryExecutor={queryExecutorOverlapped}
                    showLabels={showLabels}
                    outerPerimeter={changedArea.overlapped?.geometry}
                    options={{
                      properties: { id: FeatureType.CHANGED_AREA_OVERLAPPED_PP },
                      zIndex: VectorLayerZIndex.CHANGED_AREA,
                    }}
                  />
                  <PolygonPartsExtentQueryVectorLayer
                    featureType={FeatureType.CHANGED_AREA_ADDED_PP}
                    queryExecutor={queryExecutorAdded}
                    showLabels={showLabels}
                    outerPerimeter={changedArea.added?.geometry}
                    options={{
                      properties: { id: FeatureType.CHANGED_AREA_ADDED_PP },
                      zIndex: VectorLayerZIndex.CHANGED_AREA,
                    }}
                  />
                </>
              )}
              {showBackup && (
                <PolygonPartsExtentQueryVectorLayer
                  featureType={FeatureType.BACKUP_PP}
                  queryExecutor={backupQueryExecutor}
                  showLabels={showLabels}
                  outerPerimeter={backupMetadata?.footprint}
                  options={{
                    properties: { id: FeatureType.BACKUP_PP },
                    zIndex: VectorLayerZIndex.BACKUP,
                  }}
                />
              )}
            </>
          </OlLayerMap>
        }
        sidePanel={
          <Box className="sidePanel">
            <Box className="overlaySwitches">
              <Typography tag="p" className="sectionTitle">
                {intl.formatMessage({ id: 'revert.dialog.switches.title' })}
              </Typography>
              <Box className="overlaySwitchRow">
                <Box className="overlaySwitchLabel">
                  <FeaturePreview
                    stylePP={PPMapStyles.get(FeatureType.CHANGED_AREA_OVERLAPPED_PP)}
                  />
                  <Typography tag="p" className={showChangedArea ? 'switchLabelActive' : undefined}>
                    {intl.formatMessage({ id: 'revert.dialog.checkbox.changed-area.label' })}
                  </Typography>
                </Box>
                <Switch
                  checked={showChangedArea}
                  onClick={(): void => setShowChangedArea(!showChangedArea)}
                />
              </Box>
              <Box className="overlaySwitchRow">
                <Box className="overlaySwitchLabel">
                  <FeaturePreview stylePP={PPMapStyles.get(FeatureType.BACKUP_PP)} />
                  <Typography tag="p" className={showBackup ? 'switchLabelActive' : undefined}>
                    {intl.formatMessage({ id: 'revert.dialog.checkbox.backup.label' })}
                  </Typography>
                </Box>
                <Switch checked={showBackup} onClick={(): void => setShowBackup(!showBackup)} />
              </Box>
              <Box className="overlaySwitchRow">
                <Box className="overlaySwitchLabel">
                  <FeaturePreview stylePP={PPMapStyles.get(FeatureType.EXISTING_PP)} />
                  <Typography tag="p" className={showExisting ? 'switchLabelActive' : undefined}>
                    {intl.formatMessage({ id: 'revert.dialog.checkbox.existing.label' })}
                  </Typography>
                </Box>
                <Switch
                  checked={showExisting}
                  onClick={(): void => setShowExisting(!showExisting)}
                />
              </Box>
              <Box className="overlaySeparator" />
              <Box className="overlaySwitchRow">
                <Box className="overlaySwitchLabel">
                  <Box className="overlaySwitchSpacer" />
                  <Typography tag="p" className={showLabels ? 'switchLabelActive' : undefined}>
                    {intl.formatMessage({ id: 'revert.dialog.checkbox.show-labels.label' })}
                  </Typography>
                </Box>
                <Switch checked={showLabels} onClick={(): void => setShowLabels(!showLabels)} />
              </Box>
            </Box>
            <Box className="backupInfo">
              <Typography tag="p" className="sectionTitle">
                {intl.formatMessage({ id: 'revert.dialog.backup-info.title' })}
              </Typography>
              <Box className="backupInfoField">
                <Typography tag="p" className="backupInfoLabel">
                  {intl.formatMessage({ id: 'revert.dialog.info.current-version.label' })}
                </Typography>
                <FeaturePreview
                  stylePP={PPMapStyles.get(FeatureType.EXISTING_PP)}
                  text={'v' + (currentLayer.productVersion ?? NO_VALUE)}
                />
              </Box>
              <Box className="backupInfoField">
                <Typography tag="p" className="backupInfoLabel">
                  {intl.formatMessage({ id: 'revert.dialog.info.previous-version.label' })}
                </Typography>
                <FeaturePreview
                  stylePP={PPMapStyles.get(FeatureType.BACKUP_PP)}
                  text={loading ? NO_VALUE : 'v' + (backupMetadata?.productVersion ?? NO_VALUE)}
                />
              </Box>
              <Box className="backupInfoField">
                <Typography tag="p" className="backupInfoLabel">
                  {intl.formatMessage({ id: 'revert.dialog.info.last-update-area.label' })}
                </Typography>
                <Typography tag="p" className="backupInfoValue">
                  {loading || !backupMetadata
                    ? NO_VALUE
                    : `${changedArea.areaSquareKm.toFixed(1)}${intl.formatMessage({
                        id: 'resolutionConflict.units.km2',
                      })}`}
                </Typography>
              </Box>
            </Box>
          </Box>
        }
      />
    );
  }
);
