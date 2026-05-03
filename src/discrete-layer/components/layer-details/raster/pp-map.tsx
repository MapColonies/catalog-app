import React, {
  CSSProperties,
  JSXElementConstructor,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { Feature, Geometry } from 'geojson';
import { get } from 'lodash';
import bboxPolygon from '@turf/bbox-polygon';
import { FitOptions } from 'ol/View';
import { Style } from 'ol/style';
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
import { FeatureSelectionHandler } from '../../../../common/components/ol-map/feature-selection-handler';
import { MapLoadingIndicator } from '../../../../common/components/ol-map/map-loading-indicator';
import { ZoomLevelIndicator } from '../../../../common/components/ol-map/zoom-level-indicator';
import { LayerRasterRecordModelType } from '../../../models';
import { ILayerImage } from '../../../models/layerImage';
import { GeojsonFeatureInput } from '../../../models/RootStore.base';
import { useStore } from '../../../models/RootStore';
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
const CHILDREN_WITH_ZOOM_INDICATION = ['PolygonPartsExtentQueryVectorLayer'];

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
  const [childrenWithZoomIndication, setChildrenWithZoomIndication] = useState<boolean>(false);

  useEffect(() => {
    const childWithZoomIndication = React.Children.toArray(children).find((child) => {
      return (
        React.isValidElement(child) &&
        CHILDREN_WITH_ZOOM_INDICATION.includes((child.type as JSXElementConstructor<any>).name)
      );
    });
    setChildrenWithZoomIndication(childWithZoomIndication ? true : false);
  }, [children]);

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
    const isManagedExternally = selectedFeatureType === FeatureType.EXISTING_PP || !!selectedItem;

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
          style: value as Style,
        });
      }
    });
    return res;
  }, []);

  return (
    <Box className="geoFeaturesMapContainer" style={{ ...style }}>
      <Map>
        {previewBaseMap}
        <MapLoadingIndicator />
        <ZoomLevelIndicator
          indicateTillZoomLevel={
            showExistingPolygonParts || childrenWithZoomIndication
              ? CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL
              : undefined
          }
        />
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
            queryExecutor={async (bbox, startIndex): Promise<IQueryExecutorResponse> => {
              const result = await store.queryGetPolygonPartsFeature({
                data: {
                  feature: bboxPolygon(bbox) as GeojsonFeatureInput,
                  typeName: getWFSFeatureTypeName(layerRecord as LayerRasterRecordModelType, ENUMS),
                  count: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES,
                  startIndex,
                },
              });
              const fetchedFeatures = get(result, 'getPolygonPartsFeature.features', []);
              const features = (Array.isArray(fetchedFeatures) ? fetchedFeatures : []).map(
                (feature) => {
                  return {
                    ...feature,
                    properties: {
                      ...(feature?.properties ?? {}),
                      _featureType: FeatureType.EXISTING_PP,
                      _featureTitle: getText(
                        feature,
                        4,
                        FEATURE_LABEL_CONFIG.polygons,
                        ZOOM_LEVELS_TABLE
                      ),
                    },
                  };
                }
              );
              return { features, pageSize: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES };
            }}
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
        <FeatureSelectionHandler feature={selectedFeature} />
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
