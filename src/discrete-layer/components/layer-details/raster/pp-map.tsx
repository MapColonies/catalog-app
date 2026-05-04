import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { BBox, Feature, Geometry } from 'geojson';
import { get } from 'lodash';
import bboxPolygon from '@turf/bbox-polygon';
import { FitOptions } from 'ol/View';
import {
  Box,
  getWMTSOptions,
  getXYZOptions,
  IBaseMap,
  Legend,
  LegendItem,
  Map,
  TileLayer,
  TileWMTS,
  TileXYZ,
  VectorLayer,
  VectorSource,
} from '@map-colonies/react-components';
import { Checkbox } from '@map-colonies/react-core';
import CONFIG from '../../../../common/config';
import { useEnums } from '../../../../common/hooks/useEnum.hook';
import { Mode } from '../../../../common/models/mode.enum';
import { MapFeatureClickHandler } from '../../../../common/components/ol-map/map-feature-click-handler';
import { MapLoadingIndicator } from '../../../../common/components/ol-map/map-loading-indicator';
import { SelectedFeatureVectorLayer } from '../../../../common/components/ol-map/selected-feature-vector-layer';
import { ZoomLevelIndicator } from '../../../../common/components/ol-map/zoom-level-indicator';
import { LayerRasterRecordModelType } from '../../../models';
import { ILayerImage } from '../../../models/layerImage';
import { useStore } from '../../../models/RootStore';
import { GeojsonFeatureInput } from '../../../models/RootStore.base';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import { FeaturePropertiesPopupComponent } from './feature-properties-popup.component';
import { GeoFeaturesInnerComponent } from './geo-features-inner.component';
import {
  IQueryExecutorResponse,
  PolygonPartsExtentQueryVectorLayer,
} from './polygon-parts-extent-query-vector-layer';
import {
  FEATURE_LABEL_CONFIG,
  FeatureType,
  getStyleByFeatureType,
  getText,
  getWFSFeatureTypeName,
  PPMapStyles,
} from './pp-map.utils';

import './pp-map.css';

interface GeoFeaturesPresentorProps {
  mode: Mode;
  geoFeatures?: Feature[];
  style?: CSSProperties | undefined;
  fitOptions?: FitOptions | undefined;
  layerRecord?: ILayerImage | null;
  onMapFeatureClick?: (feature: Feature | undefined) => void;
  enableFeaturePropertiesPopup?: boolean;
  selectedItem?: Feature;
  showPolygonParts?: boolean;
  children?: JSX.Element | null;
}

const DEFAULT_PROJECTION = 'EPSG:4326';
const MIN_FEATURES_NUMBER = 4; // minimal set of fetures (source, source_marker, perimeter, perimeter_marker)

export const GeoFeaturesPresentorComponent: React.FC<GeoFeaturesPresentorProps> = ({
  mode,
  geoFeatures,
  style,
  fitOptions,
  layerRecord,
  onMapFeatureClick,
  enableFeaturePropertiesPopup = false,
  selectedItem,
  showPolygonParts = false,
  children,
}) => {
  const store = useStore();
  const ENUMS = useEnums();
  const intl = useIntl();
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const renderCount = useRef(0);
  const [selectedFeature, setSelectedFeature] = useState<Feature | undefined>(undefined);
  const [showExistingPolygonParts, setShowExistingPolygonParts] =
    useState<boolean>(showPolygonParts);

  useEffect(() => {
    setShowExistingPolygonParts(showPolygonParts);
  }, [showPolygonParts]);

  useEffect(() => {
    const definedElements = geoFeatures?.filter((feat) => feat !== undefined);
    if (definedElements?.length === 0) {
      renderCount.current = 0;
    }
    if (definedElements && definedElements?.length >= MIN_FEATURES_NUMBER) {
      renderCount.current += 1;
    }
  });

  useEffect(() => {
    if (!enableFeaturePropertiesPopup) {
      setSelectedFeature(undefined);
    }
  }, [enableFeaturePropertiesPopup]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }
    setSelectedFeature(selectedItem);
  }, [selectedItem]);

  useEffect(() => {
    const selectedFeatureType = selectedFeature?.properties?._featureType;
    const isManagedExternally =
      selectedFeatureType === FeatureType.EXISTING_PP ||
      selectedFeatureType === FeatureType.LOW_RESOLUTION_PP ||
      !!selectedItem;

    if (!isManagedExternally) {
      setSelectedFeature(undefined);
    }
  }, [selectedFeature, selectedItem]);

  const clearSelection = useCallback((): void => {
    setSelectedFeature(undefined);
    onMapFeatureClick?.(undefined);
  }, []);

  const previewBaseMap = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-array-constructor
    const olBaseMap = new Array();
    let baseMap = store.discreteLayersStore.baseMaps?.maps.find(
      (map: IBaseMap) => map.isForPreview
    );
    if (!baseMap) {
      baseMap = store.discreteLayersStore.baseMaps?.maps.find((map: IBaseMap) => map.isCurrent);
    }
    if (baseMap) {
      baseMap.baseRasterLayers.forEach((layer) => {
        if (layer.type === 'WMTS_LAYER') {
          const wmtsOptions = getWMTSOptions({
            url: layer.options.url as string,
            layer: '',
            matrixSet: get(layer.options, 'tileMatrixSetID') as string,
            format: get(layer.options, 'format'),
            projection: DEFAULT_PROJECTION, // Should be taken from map-server capabilities (MAPCO-3780)
            style: get(layer.options, 'style'),
          });
          olBaseMap.push(
            <TileLayer key={layer.id} options={{ opacity: layer.opacity }}>
              <TileWMTS
                options={{
                  ...wmtsOptions,
                  crossOrigin: 'anonymous',
                }}
              />
            </TileLayer>
          );
        }
        if (layer.type === 'XYZ_LAYER') {
          const xyzOptions = getXYZOptions({
            url: layer.options.url as string,
          });
          olBaseMap.push(
            <TileLayer key={layer.id} options={{ opacity: layer.opacity }}>
              <TileXYZ
                options={{
                  ...xyzOptions,
                  crossOrigin: 'anonymous',
                }}
              />
            </TileLayer>
          );
        }
      });
    }
    return olBaseMap;
  }, []);

  const LegendsArray = useMemo(() => {
    const res: LegendItem[] = [];
    PPMapStyles.forEach((value, key) => {
      if (!key.includes('MARKER')) {
        res.push({
          title: intl.formatMessage({ id: `polygon-parts.map-preview-legend.${key}` }) as string,
          style: value.style,
        });
      }
    });
    return res;
  }, []);

  const selectedFeatureStyle = useMemo(() => {
    if (!selectedFeature) {
      return undefined;
    }
    return getStyleByFeatureType(selectedFeature);
  }, [selectedFeature]);

  const queryExecutor = useCallback(
    async (bbox: BBox, startIndex: number): Promise<IQueryExecutorResponse> => {
      const result = await store.queryGetPolygonPartsFeature({
        data: {
          feature: bboxPolygon(bbox) as GeojsonFeatureInput,
          typeName: getWFSFeatureTypeName(layerRecord as LayerRasterRecordModelType, ENUMS),
          count: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES,
          startIndex,
        },
      });
      const fetchedFeatures = get(result, 'getPolygonPartsFeature.features', []);
      const features = (Array.isArray(fetchedFeatures) ? fetchedFeatures : []).map((feature) => ({
        ...feature,
        properties: {
          ...(feature?.properties ?? {}),
          _featureType: FeatureType.EXISTING_PP,
          _featureTitle: getText(feature, 4, FEATURE_LABEL_CONFIG.polygons, ZOOM_LEVELS_TABLE),
        },
      }));
      return { features, pageSize: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES };
    },
    []
  );

  return (
    <Box className="geoFeaturesMapContainer" style={{ ...style }}>
      <Map>
        {previewBaseMap}
        <MapLoadingIndicator />
        <ZoomLevelIndicator />
        <Legend
          legendItems={LegendsArray}
          title={intl.formatMessage({ id: 'polygon-parts.map-preview-legend.title' })}
        />
        <VectorLayer>
          <VectorSource>
            <GeoFeaturesInnerComponent
              geoFeatures={geoFeatures}
              fitOptions={fitOptions}
              renderCount={renderCount}
            />
          </VectorSource>
        </VectorLayer>
        {mode === Mode.UPDATE && (
          <Box className="checkbox">
            <Checkbox
              className="flexCheckItem showOnMapContainer"
              label={intl.formatMessage({ id: 'polygon-parts.show-exisitng-parts-on-map.label' })}
              checked={showExistingPolygonParts}
              onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
                evt.preventDefault();
                evt.stopPropagation();
                const isChecked = evt.currentTarget.checked;
                setShowExistingPolygonParts(isChecked);
                if (!isChecked) {
                  clearSelection();
                }
              }}
            />
          </Box>
        )}
        {showExistingPolygonParts && (
          <PolygonPartsExtentQueryVectorLayer
            featureType={FeatureType.EXISTING_PP}
            queryExecutor={queryExecutor}
            outerPerimeter={layerRecord?.footprint as Geometry | undefined}
            selectedFeature={selectedFeature}
            onClearSelectedFeature={clearSelection}
            options={{ properties: { id: FeatureType.EXISTING_PP }, zIndex: 1 }}
          />
        )}
        {children}
        <MapFeatureClickHandler
          onMapFeatureClick={onMapFeatureClick}
          setSelectedFeature={setSelectedFeature}
        />
        <SelectedFeatureVectorLayer
          feature={selectedFeature}
          featureStyle={selectedFeatureStyle}
          options={{ properties: { id: 'SELECTED_PP' }, zIndex: 3 }}
        />
        {enableFeaturePropertiesPopup && (
          <FeaturePropertiesPopupComponent
            selectedFeature={selectedFeature}
            onClose={clearSelection}
          />
        )}
      </Map>
    </Box>
  );
};
