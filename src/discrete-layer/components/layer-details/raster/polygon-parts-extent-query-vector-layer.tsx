import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { BBox, Feature, GeoJsonProperties, Geometry } from 'geojson';
import { debounce, get } from 'lodash';
import { observer } from 'mobx-react';
import { MapEvent } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Size } from 'ol/size';
import { Style } from 'ol/style';
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
  outerPerimeter?: Geometry;
  queryExecutor: (bbox: BBox, startIndex: number) => Promise<unknown>;
  featureType: FeatureType;
  selectedFeature?: Feature;
  onFeaturesChange?: (features: Feature[]) => void;
}

const START_OFFSET = 0;
const STARTING_PAGE = 0;
const DEBOUNCE_MOUSE_INTERVAL = 500;
const LAYER_Z_INDEX = 1;

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
  outerPerimeter,
  queryExecutor,
  featureType,
  selectedFeature,
  onFeaturesChange,
}) => {
  const store = useStore();
  const mapOl = useMap();
  const intl = useIntl();
  const [existingPolygonParts, setExistingPolygonParts] = useState<Feature[]>([]);
  const activeRequestIdRef = useRef(0);

  useEffect(() => {
    onFeaturesChange?.(existingPolygonParts);
  }, [existingPolygonParts]);
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();

  const showLoadingSpinner = (isShown: boolean) => {
    isShown
      ? mapOl.getTargetElement().classList.add('olSpinner')
      : mapOl.getTargetElement().classList.remove('olSpinner');
  };

  useEffect(() => {
    const handleMoveEndEvent = (e: MapEvent): void => {
      const footprintFeature = createZoomedOutFootprintFeature(outerPerimeter, featureType);
      setExistingPolygonParts(footprintFeature ? [footprintFeature] : []);
      void getExistingPolygonParts(mapOl.getView().calculateExtent() as BBox, START_OFFSET);
    };

    const debounceCall = debounce(handleMoveEndEvent, DEBOUNCE_MOUSE_INTERVAL);
    mapOl.on('moveend', debounceCall);

    void getExistingPolygonParts(mapOl.getView().calculateExtent() as BBox, START_OFFSET);

    return (): void => {
      try {
        mapOl.un('moveend', debounceCall);
      } catch (e) {
        console.log('OL "moveEnd" remove listener failed', e);
      }
    };
  }, []);

  const getExistingPolygonParts = async (bbox: BBox, startIndex: number): Promise<void> => {
    const currentZoomLevel = mapOl.getView().getZoom();

    if (
      currentZoomLevel &&
      currentZoomLevel < CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL
    ) {
      showLoadingSpinner(false);
      const footprintFeature = createZoomedOutFootprintFeature(outerPerimeter, featureType);
      setExistingPolygonParts(footprintFeature ? [footprintFeature] : []);
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

        setExistingPolygonParts((currentFeatures) => {
          const baseFeatures =
            pageStartIndex === STARTING_PAGE
              ? currentFeatures.filter(
                (feature) => !(feature.properties as GeoJsonProperties | null)?._showAsFootprint
              )
              : currentFeatures;

          if (pageStartIndex === STARTING_PAGE && fetchedFeatures.length === 0) {
            return [];
          }

          return [...baseFeatures, ...fetchedFeatures];
        });

        const hasMoreFeatures = fetchedFeatures.length === CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES;
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
            error: [intl.formatMessage({ id: 'validation-general.polygonParts.wfsServerError' })],
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
      <VectorLayerOrder zIndex={LAYER_Z_INDEX} />
      <VectorSource>
        {existingPolygonParts.map((feat, idx) => {
          const greenStyle = new Style({
            text: createTextStyle(
              feat,
              4,
              FEATURE_LABEL_CONFIG.polygons,
              ZOOM_LEVELS_TABLE,
              intl.formatMessage({ id: 'polygon-parts.map-preview.zoom-before-fetch' })
            ),
            stroke: PPMapStyles.get(featureType)?.getStroke(),
            fill: PPMapStyles.get(featureType)?.getFill(),
          });

          if (selectedFeature === feat) {
            const baseStroke = PPMapStyles.get(featureType)?.getStroke();
            if (baseStroke) {
              const selectedStroke = baseStroke.clone();
              selectedStroke.setWidth(5);
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
