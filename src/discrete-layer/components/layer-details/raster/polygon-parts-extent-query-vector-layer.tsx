import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { BBox, Feature, GeoJsonProperties, Geometry } from 'geojson';
import { debounce } from 'lodash';
import GeoJSON from 'ol/format/GeoJSON';
import { Options } from 'ol/layer/Base';
import { Size } from 'ol/size';
import { Fill, Stroke, Style, Text } from 'ol/style';
import intersect from '@turf/intersect';
import { polygon } from '@turf/helpers';
import bboxPolygon from '@turf/bbox-polygon';
import {
  GeoJSONFeature,
  useMap,
  VectorLayer,
  VectorSource,
} from '@map-colonies/react-components';
import CONFIG from '../../../../common/config';
import { useStore } from '../../../models';
import { IDispatchAction } from '../../../models/actionDispatcherStore';
import { UserAction } from '../../../models/userStore';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import {
  createTextStyle,
  FeatureType,
  FEATURE_LABEL_CONFIG,
  PPMapStyles,
} from './pp-map.utils';

export interface IQueryExecutorResponse {
  features: Feature<Geometry, GeoJsonProperties>[];
  pageSize: number;
}

interface PolygonPartsExtentQueryVectorLayerProps {
  featureType: FeatureType;
  queryExecutor: (bbox: BBox, startIndex: number) => Promise<IQueryExecutorResponse>;
  outerPerimeter?: Geometry;
  selectedFeature?: Feature;
  onFeaturesChange?: (features: Feature[], isFootprintMode: boolean) => void;
  onQueryError?: (errorMessage: string) => void;
  textStyleFactory?: (feature: Feature) => Text | undefined;
  options?: Options;
}

const START = 0;
const DEBOUNCE_MOUSE_INTERVAL = 300;

const createZoomedOutFootprintFeature = (
  outerPerimeter?: Geometry,
  featureType?: FeatureType
): Feature<Geometry, GeoJsonProperties> | undefined => {
  if (!outerPerimeter) {
    return undefined;
  }

  return {
    type: 'Feature',
    geometry: {
      ...outerPerimeter,
    },
    properties: {
      text: 'hide',
      _showAsFootprint: true,
      _featureType: featureType,
    },
  };
};

export const PolygonPartsExtentQueryVectorLayer: React.FC<PolygonPartsExtentQueryVectorLayerProps> = ({
  featureType,
  queryExecutor,
  outerPerimeter,
  selectedFeature,
  onFeaturesChange,
  onQueryError,
  textStyleFactory,
  options,
}) => {
  const mapOl = useMap();
  const intl = useIntl();
  const store = useStore();
  const activeRequestIdRef = useRef(0);
  const hasEmittedInitialFeaturesRef = useRef(false);
  const onFeaturesChangeRef = useRef<typeof onFeaturesChange>(onFeaturesChange);
  const isFootprintModeRef = useRef(false);
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const [polygonParts, setPolygonParts] = useState<Feature[]>([]);

  useEffect(() => {
    onFeaturesChangeRef.current = onFeaturesChange;
  }, [onFeaturesChange]);

  useEffect(() => {
    if (!hasEmittedInitialFeaturesRef.current) {
      hasEmittedInitialFeaturesRef.current = true;
      return;
    }

    onFeaturesChangeRef.current?.(polygonParts, isFootprintModeRef.current);
  }, [polygonParts]);

  useEffect(() => {
    let initialFetchTimer: number | undefined;

    const requestPolygonPartsByCurrentExtent = (): boolean => {
      void getPolygonParts(getCurrentExtent(), START);
      return true;
    };

    mapOl.once('postrender', () => {
      requestPolygonPartsByCurrentExtent();
    });

    const debounceCall = debounce(requestPolygonPartsByCurrentExtent, DEBOUNCE_MOUSE_INTERVAL);
    mapOl.on('moveend', () => {
      debounceCall();
    });

    return (): void => {
      try {
        if (initialFetchTimer !== undefined) {
          window.clearTimeout(initialFetchTimer);
        }
        mapOl.un('moveend', debounceCall);
      } catch (e) {
        console.log('OL "moveEnd" remove listener failed', e);
      }
    };
  }, []);

  const getCurrentExtent = (): BBox => {
    return mapOl.getView().calculateExtent(mapOl.getSize()) as BBox;
  };

  const showLoadingSpinner = (isShown: boolean) => {
    const targetElement = mapOl.getTargetElement();
    if (!targetElement) {
      return;
    }

    isShown
      ? targetElement.classList.add('olSpinner')
      : targetElement.classList.remove('olSpinner');
  };

  const getPolygonParts = async (bbox: BBox, startIndex: number): Promise<void> => {
    const currentZoomLevel = mapOl.getView().getZoom();

    if (
      currentZoomLevel &&
      currentZoomLevel < CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL
    ) {
      showLoadingSpinner(false);
      isFootprintModeRef.current = true;
      const footprintFeature = createZoomedOutFootprintFeature(outerPerimeter, featureType);
      setPolygonParts(footprintFeature ? [footprintFeature] : []);
      return;
    }

    isFootprintModeRef.current = false;
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    showLoadingSpinner(true);

    try {
      let nextStartIndex = startIndex;

      while (true) {
        const extent = getCurrentExtent();
        const result = await queryExecutor(extent, nextStartIndex);
        const pageStartIndex = nextStartIndex;

        if (activeRequestIdRef.current !== requestId) {
          return;
        }

        const { features, pageSize } = result;

        setPolygonParts((currentFeatures) => {
          const baseFeatures =
            pageStartIndex === START
              ? []
              : currentFeatures;
          if (pageStartIndex === START && features.length === 0) {
            return [];
          }
          return [...baseFeatures, ...features];
        });

        const hasMoreFeatures = pageSize > 0 && features.length === pageSize;
        if (!hasMoreFeatures) {
          break;
        }

        nextStartIndex += CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES;
      }
    } catch {
      if (activeRequestIdRef.current === requestId) {
        const errorMessage = intl.formatMessage({ id: 'resolutionConflict.error.queryFailed' });
        if (onQueryError) {
          onQueryError(errorMessage);
        } else {
          store.actionDispatcherStore.dispatchAction({
            action: UserAction.SYSTEM_CALLBACK_SHOW_PPERROR_ON_UPDATE,
            data: {
              error: [errorMessage],
            },
          } as IDispatchAction);
        }
      }
    } finally {
      if (activeRequestIdRef.current === requestId) {
        showLoadingSpinner(false);
      }
    }
  };

  return (
    <VectorLayer options={options}>
      <VectorSource>
        {polygonParts.map((feat, idx) => {
          const isExceeded = feat.properties?.exceeded === true;
          const baseStyle = PPMapStyles.get(featureType);
          let baseStroke = baseStyle?.getStroke()?.clone();
          let baseFill = baseStyle?.getFill()?.clone();

          if (featureType === FeatureType.LOW_RESOLUTION_PP) {
            const strokeColor = isExceeded ? '#d32f2f' : '#ff7f00';
            const fillColor = isExceeded ? '#d32f2f66' : '#ff7f0066';

            baseStroke = new Stroke({
              width: 2,
              color: strokeColor,
            });
            baseFill = new Fill({
              color: fillColor,
            });
          }

          const featureStyle = new Style({
            text:
              textStyleFactory?.(feat) ??
              createTextStyle(
                feat,
                4,
                FEATURE_LABEL_CONFIG.polygons,
                ZOOM_LEVELS_TABLE,
                intl.formatMessage({ id: 'polygon-parts.map-preview.zoom-before-fetch' })
              ),
            stroke: baseStroke,
            fill: baseFill,
          });

          const selectedFeatureKey = selectedFeature?.properties?._key;
          const isSelectedByKey =
            selectedFeatureKey !== undefined && feat.properties?._key === selectedFeatureKey;

          const selectedFeatureProperties =
            selectedFeature?.properties && typeof selectedFeature.properties === 'object'
              ? selectedFeature.properties as Record<string, unknown>
              : undefined;
          const featProperties =
            feat.properties && typeof feat.properties === 'object'
              ? feat.properties as Record<string, unknown>
              : undefined;
          const selectedFeatureId = selectedFeature?.id ?? selectedFeatureProperties?.id;
          const featureId = feat?.id ?? featProperties?.id;
          const isSelectedById =
            selectedFeatureId !== undefined && featureId !== undefined && selectedFeatureId === featureId;

          if (selectedFeature === feat || isSelectedByKey || isSelectedById) {
            if (baseStroke) {
              const selectedStroke = baseStroke.clone();
              selectedStroke.setWidth(8);
              featureStyle.setStroke(selectedStroke);
            }
          }

          const BUFFER = 2; // Add extra pixels to perimeter around the OL extent in order to discard new geometry boundaries
          const size = mapOl.getSize() as Size;
          const bbox = bboxPolygon(
            mapOl.getView().calculateExtent([size[0] + BUFFER, size[1] + BUFFER]) as BBox
          );
          const extentPolygon = polygon(bbox.geometry.coordinates);

          try {
            // There is some cases when turf.intersect() throws exception, then no need to change geometry
            // @ts-ignore
            const featureClippedPolygon = intersect(feat, extentPolygon);

            if (featureClippedPolygon) {
              const geometry = new GeoJSON().readGeometry(featureClippedPolygon.geometry);
              featureStyle.setGeometry(geometry);
            }
          } catch (e) {
            console.log(
              '*** PP: turf.intersect() failed ***',
              'feat -->',
              feat,
              'extentPolygon -->',
              extentPolygon
            );
          }

          return feat ? (
            <GeoJSONFeature
              key={(feat.properties?._key as string | undefined) ?? `feature-${idx}`}
              // geometry={{ ...feat.geometry }}
              // @ts-ignore
              geometry={{ ...feat }}
              fit={false}
              featureStyle={featureStyle}
            />
          ) : (
            <></>
          );
        })}
      </VectorSource>
    </VectorLayer>
  );
};
