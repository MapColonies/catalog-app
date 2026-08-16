import React, { useMemo } from 'react';
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

// type OverlayId = 'existing' | 'backup' | 'changedArea';

// const DEFAULT_OVERLAY_VISIBILITY: Record<OverlayId, boolean> = {
//   existing: true,
//   backup: true,
//   changedArea: false,
// };

// const EXISTING_COLOR = '#22C55E';
// // const BACKUP_PP_COLOR = '#3B82F6';
// const CHANGES_OVERLAPPED_COLOR = '#C62828';
// const CHANGES_ADDED_COLOR = '#FF7F00';

// const strokeAndFillStyle = (color: string): Style =>
//   new Style({
//     stroke: new Stroke({ width: 3, color }),
//     fill: new Fill({ color: `${color}33` }),
//   });

// export const EXISTING_STYLE = strokeAndFillStyle(EXISTING_COLOR);
// export const CHANGES_ADDED_STYLE = strokeAndFillStyle(CHANGES_ADDED_COLOR);
// export const CHANGES_OVERLAPPED_STYLE = strokeAndFillStyle(CHANGES_OVERLAPPED_COLOR);

const WFS_BUFFER_DELTA = -0.2;

export const EntityRevertRasterDialog: React.FC<ActionDialogProps> = observer(
  (props: ActionDialogProps) => {
    const intl = useIntl();
    const store = useStore();
    const ENUMS = useEnums();
    const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
    // const currentLayer = props.layerRecord as LayerRasterRecordModelType;

    // const [isExistingVisible, setIsExistingVisible] = useState(DEFAULT_OVERLAY_VISIBILITY.existing);
    // const [isBackupVisible, setIsBackupVisible] = useState(DEFAULT_OVERLAY_VISIBILITY.backup);
    // const [isChangedAreaVisible, setIsChangedAreaVisible] = useState(
    //   DEFAULT_OVERLAY_VISIBILITY.changedArea
    // );

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
      const asdf = buildChangedArea(
        backupMetadata?.footprint as Geometry | undefined,
        changedAreaOuterPerimeterGeometry,
        changedAreaOuterPerimeter?.features?.[0]?.properties?.area as number | undefined
      );
      return asdf;
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

    // const overlayCheckboxes: {
    //   id: OverlayId;
    //   labelId: string;
    //   checked: boolean;
    //   onChange: (checked: boolean) => void;
    //   badge: string;
    //   badgeBackground: string;
    // }[] = [
    //   {
    //     id: 'existing',
    //     labelId: 'revert.dialog.checkbox.existing.label',
    //     checked: isExistingVisible,
    //     onChange: setIsExistingVisible,
    //     badge: currentLayer.productVersion ? `v${currentLayer.productVersion}` : '',
    //     badgeBackground: EXISTING_COLOR,
    //   },
    //   {
    //     id: 'backup',
    //     labelId: 'revert.dialog.checkbox.backup.label',
    //     checked: isBackupVisible,
    //     onChange: setIsBackupVisible,
    //     badge: backupMetadata?.productVersion ? `v${backupMetadata.productVersion}` : '',
    //     badgeBackground: BACKUP_PP_COLOR,
    //   },
    //   {
    //     id: 'changedArea',
    //     labelId: 'revert.dialog.checkbox.changed-area.label',
    //     checked: isChangedAreaVisible,
    //     onChange: setIsChangedAreaVisible,
    //     badge: `${changedArea.areaSquareKm.toFixed(1)}${intl.formatMessage({
    //       id: 'resolutionConflict.units.km2',
    //     })}`,
    //     badgeBackground: `linear-gradient(to right, ${CHANGES_OVERLAPPED_COLOR} 50%, ${CHANGES_ADDED_COLOR} 50%)`,
    //   },
    // ];

    // const sidePanel = (
    //   <Box className="overlayCheckboxes" role="group">
    //     {overlayCheckboxes.map((cfg) => (
    //       <Box key={cfg.id} className="overlayCheckboxRow">
    //         <Checkbox
    //           className="overlayCheckbox"
    //           label={intl.formatMessage({ id: cfg.labelId })}
    //           checked={cfg.checked}
    //           onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
    //             evt.stopPropagation();
    //             cfg.onChange(evt.currentTarget.checked);
    //           }}
    //         />
    //         <Box className="overlayCheckboxBadge" style={{ background: cfg.badgeBackground }}>
    //           {cfg.badge}
    //         </Box>
    //       </Box>
    //     ))}
    //   </Box>
    // );

    // const mapChildren = (
    //   <>
    //     {isExistingVisible &&
    //       currentLayer.footprint !== undefined &&
    //       currentLayer.footprint !== null && (
    //         <VectorLayer options={{ zIndex: VectorLayerZIndex.EXISTING }}>
    //           <VectorSource>
    //             <GeoJSONFeature
    //               geometry={currentLayer.footprint as Geometry}
    //               featureStyle={EXISTING_STYLE}
    //               fit={false}
    //             />
    //           </VectorSource>
    //         </VectorLayer>
    //       )}
    //     {isBackupVisible && backupMetadata && (
    //       <PolygonPartsExtentQueryVectorLayer
    //         featureType={FeatureType.BACKUP_PP}
    //         queryExecutor={backupQueryExecutor}
    //         outerPerimeter={backupMetadata.footprint as Geometry | undefined}
    //         options={{
    //           properties: { id: FeatureType.BACKUP_PP },
    //           zIndex: VectorLayerZIndex.BACKUP,
    //         }}
    //       />
    //     )}
    //     {isChangedAreaVisible && (
    //       <VectorLayer
    //         options={{
    //           maxZoom: CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL,
    //           zIndex: VectorLayerZIndex.CHANGED_AREA,
    //         }}
    //       >
    //         <VectorSource>
    //           {changedArea.added && (
    //             <GeoJSONFeature
    //               geometry={changedArea.added}
    //               featureStyle={CHANGES_ADDED_STYLE}
    //               fit={false}
    //             />
    //           )}
    //           {changedArea.overlapped && (
    //             <GeoJSONFeature
    //               geometry={changedArea.overlapped}
    //               featureStyle={CHANGES_OVERLAPPED_STYLE}
    //               fit={false}
    //             />
    //           )}
    //         </VectorSource>
    //       </VectorLayer>
    //     )}
    //   </>
    // );
    const FeaturePreview: React.FC<{ stylePP: IStyleByProp | undefined }> = (props: {
      stylePP: IStyleByProp | undefined;
    }) => {
      return (
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            ...getCSSFromOlStyle(props.stylePP),
          }}
        />
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
            showLabels={false}
            style={{ height: '100%' }}
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
              <PolygonPartsExtentQueryVectorLayer
                featureType={FeatureType.CHANGED_AREA_OVERLAPPED_PP}
                queryExecutor={queryExecutorOverlapped}
                showLabels={false}
                outerPerimeter={changedArea.overlapped?.geometry}
                options={{
                  properties: { id: FeatureType.CHANGED_AREA_OVERLAPPED_PP },
                  zIndex: VectorLayerZIndex.CHANGED_AREA,
                }}
              />
              <PolygonPartsExtentQueryVectorLayer
                featureType={FeatureType.CHANGED_AREA_ADDED_PP}
                queryExecutor={queryExecutorAdded}
                showLabels={false}
                outerPerimeter={changedArea.added?.geometry}
                options={{
                  properties: { id: FeatureType.CHANGED_AREA_ADDED_PP },
                  zIndex: VectorLayerZIndex.CHANGED_AREA,
                }}
              />
              <PolygonPartsExtentQueryVectorLayer
                featureType={FeatureType.BACKUP_PP}
                queryExecutor={backupQueryExecutor}
                showLabels={false}
                outerPerimeter={backupMetadata?.footprint}
                options={{
                  properties: { id: FeatureType.BACKUP_PP },
                  zIndex: VectorLayerZIndex.BACKUP,
                }}
              />
            </>
          </OlLayerMap>
        }
        // sidePanel={sidePanel}
        sidePanel={
          <Box style={{ width: '100%', height: '25%', backgroundColor: 'lightgray', color: 'red' }}>
            SWITCHES PLACEHOLDER
            <FeaturePreview stylePP={PPMapStyles.get(FeatureType.CHANGED_AREA_ADDED_PP)} />
            <FeaturePreview stylePP={PPMapStyles.get(FeatureType.CHANGED_AREA_OVERLAPPED_PP)} />
            <FeaturePreview stylePP={PPMapStyles.get(FeatureType.BACKUP_PP)} />
          </Box>
        }
      />
    );
  }
);
