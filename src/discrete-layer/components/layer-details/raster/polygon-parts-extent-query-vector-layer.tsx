import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { BBox, Feature, GeoJsonProperties, Geometry } from 'geojson';
import { debounce, get } from 'lodash';
import { observer } from 'mobx-react';
import { MapEvent } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Size } from 'ol/size';
import { Style, Text } from 'ol/style';
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
import { VectorLayerOrder } from '../../../../common/components/ol-map/vector-layer-order';
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

interface PolygonPartsExtentQueryVectorLayerProps {
  featureType: FeatureType;
  queryExecutor: (bbox: BBox, startIndex: number) => Promise<unknown>;
  outerPerimeter?: Geometry;
  selectedFeature?: Feature;
  selectedFeatureKey?: string;
  onFeaturesChange?: (features: Feature[]) => void;
  textStyleFactory?: (feature: Feature) => Text | undefined;
  layerZIndex?: number;
  enablePagination?: boolean;
}

const START_OFFSET = 0;
const STARTING_PAGE = 0;
const DEBOUNCE_MOUSE_INTERVAL = 300;
const DEFAULT_LAYER_Z_INDEX = 1;

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

export const PolygonPartsExtentQueryVectorLayer: React.FC<PolygonPartsExtentQueryVectorLayerProps> = observer(({
  featureType,
  queryExecutor,
  outerPerimeter,
  selectedFeature,
  selectedFeatureKey,
  onFeaturesChange,
  textStyleFactory,
  layerZIndex = DEFAULT_LAYER_Z_INDEX,
  enablePagination = true,
}) => {
  const mapOl = useMap();
  const intl = useIntl();
  const store = useStore();
  const activeRequestIdRef = useRef(0);
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const [polygonParts, setPolygonParts] = useState<Feature[]>([]);

  useEffect(() => {
    onFeaturesChange?.(polygonParts);
  }, [polygonParts]);

  useEffect(() => {
    const handleMoveEndEvent = (e: MapEvent): void => {
      void getPolygonParts(mapOl.getView().calculateExtent() as BBox, START_OFFSET);
    };

    const debounceCall = debounce(handleMoveEndEvent, DEBOUNCE_MOUSE_INTERVAL);
    mapOl.on('moveend', debounceCall);

    void getPolygonParts(mapOl.getView().calculateExtent() as BBox, START_OFFSET);

    return (): void => {
      try {
        mapOl.un('moveend', debounceCall);
      } catch (e) {
        console.log('OL "moveEnd" remove listener failed', e);
      }
    };
  }, []);

  const showLoadingSpinner = (isShown: boolean) => {
    isShown
      ? mapOl.getTargetElement().classList.add('olSpinner')
      : mapOl.getTargetElement().classList.remove('olSpinner');
  };

  const getPolygonParts = async (bbox: BBox, startIndex: number): Promise<void> => {
    const currentZoomLevel = mapOl.getView().getZoom();

    if (
      currentZoomLevel &&
      currentZoomLevel < CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL
    ) {
      showLoadingSpinner(false);
      const footprintFeature = createZoomedOutFootprintFeature(outerPerimeter, featureType);
      setPolygonParts(footprintFeature ? [footprintFeature] : []);
      return;
    }

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    showLoadingSpinner(true);

    try {
      let nextStartIndex = startIndex;

      while (true) {
        const extent = mapOl.getView().calculateExtent() as BBox;
        const result = await queryExecutor(extent, nextStartIndex);
        const pageStartIndex = nextStartIndex;

        if (activeRequestIdRef.current !== requestId) {
          return;
        }

        const rawFeatures = get(result, 'getPolygonPartsFeature.features', get(result, 'features', []));
        const fetchedFeatures = (Array.isArray(rawFeatures) ? rawFeatures : []) as Feature<Geometry, GeoJsonProperties>[];

        setPolygonParts((currentFeatures) => {
          const baseFeatures =
            pageStartIndex === STARTING_PAGE
              ? []
              : currentFeatures;

          if (pageStartIndex === STARTING_PAGE && fetchedFeatures.length === 0) {
            return [];
          }

          return [...baseFeatures, ...fetchedFeatures];
        });

        const hasMoreFeatures =
          enablePagination && fetchedFeatures.length === CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES;
        if (!hasMoreFeatures) {
          break;
        }

        nextStartIndex += CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES;
      }
    } catch {
      if (activeRequestIdRef.current === requestId) {
        store.actionDispatcherStore.dispatchAction({
          action: UserAction.SYSTEM_CALLBACK_SHOW_PPERROR_ON_UPDATE,
          data: {
            error: [intl.formatMessage({ id: 'resolutionConflict.error.queryFailed' })],
          },
        } as IDispatchAction);
      }
    } finally {
      if (activeRequestIdRef.current === requestId) {
        showLoadingSpinner(false);
      }
    }
  };

  return (
    <VectorLayer>
      <VectorLayerOrder zIndex={layerZIndex} />
      <VectorSource>
        {polygonParts.map((feat, idx) => {
          const baseStyle = PPMapStyles.get(featureType);
          const baseStroke = baseStyle?.getStroke()?.clone();
          const baseFill = baseStyle?.getFill()?.clone();

          if (featureType === FeatureType.LOW_RESOLUTION_PP) {
            baseStroke?.setColor('#ff7f00');
            baseFill?.setColor('#ff7f0066');
          }

          const greenStyle = new Style({
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

          const isSelectedByKey =
            selectedFeatureKey !== undefined && feat.properties?._key === selectedFeatureKey;

          if (selectedFeature === feat || isSelectedByKey) {
            if (baseStroke) {
              const selectedStroke = baseStroke.clone();
              selectedStroke.setWidth(8);
              greenStyle.setStroke(selectedStroke);
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
              greenStyle.setGeometry(geometry);
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
              geometry={{ ...feat.geometry }}
              fit={false}
              featureStyle={greenStyle}
            />
          ) : (
            <></>
          );
        })}
      </VectorSource>
    </VectorLayer>
  );
});
