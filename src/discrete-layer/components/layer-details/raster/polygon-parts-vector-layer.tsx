import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { BBox, Feature, GeoJsonProperties, Geometry } from 'geojson';
import { debounce } from 'lodash';
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
import { useEnums } from '../../../../common/hooks/useEnum.hook';
import {
  GetFeatureModelType,
  LayerRasterRecordModelType,
  useQuery,
  useStore,
} from '../../../models';
import { IDispatchAction } from '../../../models/actionDispatcherStore';
import { ILayerImage } from '../../../models/layerImage';
import { GeojsonFeatureInput } from '../../../models/RootStore.base';
import { UserAction } from '../../../models/userStore';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import {
  createTextStyle,
  FeatureType,
  FEATURE_LABEL_CONFIG,
  getWFSFeatureTypeName,
  PPMapStyles,
} from './pp-map.utils';

interface PolygonPartsExtentQueryVectorLayerProps {
  layerRecord?: ILayerImage | null;
  selectedFeature?: Feature;
  onFeaturesChange?: (features: Feature[]) => void;
}

const START_OFFSET = 0;
const STARTING_PAGE = 0;
const DEBOUNCE_MOUSE_INTERVAL = 500;
const LAYER_Z_INDEX = 1;

const createZoomedOutFootprintFeature = (
  layerRecord?: ILayerImage | null
): Feature<Geometry, GeoJsonProperties> => ({
  type: 'Feature',
  geometry: {
    ...layerRecord?.footprint,
  },
  properties: {
    text: 'hide',
    _showAsFootprint: true,
    _featureType: FeatureType.EXISTING_PP,
  },
});

export const PolygonPartsExtentQueryVectorLayer: React.FC<PolygonPartsExtentQueryVectorLayerProps> = observer(({
  layerRecord, selectedFeature, onFeaturesChange
}) => {
  const store = useStore();
  const mapOl = useMap();
  const intl = useIntl();
  const [existingPolygonParts, setExistingPolygonParts] = useState<Feature[]>([]);
  const requestedStartIndexRef = useRef(START_OFFSET);

  useEffect(() => {
    onFeaturesChange?.(existingPolygonParts);
  }, [existingPolygonParts]);
  const { data, error, loading, setQuery } = useQuery<{
    getPolygonPartsFeature: GetFeatureModelType;
  }>();
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const ENUMS = useEnums();

  const showLoadingSpinner = (isShown: boolean) => {
    isShown
      ? mapOl.getTargetElement().classList.add('olSpinner')
      : mapOl.getTargetElement().classList.remove('olSpinner');
  };

  useEffect(() => {
    const handleMoveEndEvent = (e: MapEvent): void => {
      requestedStartIndexRef.current = START_OFFSET;
      setExistingPolygonParts([createZoomedOutFootprintFeature(layerRecord)]);
      getExistingPolygonParts(mapOl.getView().calculateExtent() as BBox, START_OFFSET);
    };

    const debounceCall = debounce(handleMoveEndEvent, DEBOUNCE_MOUSE_INTERVAL);
    mapOl.on('moveend', debounceCall);

    getExistingPolygonParts(mapOl.getView().calculateExtent() as BBox, START_OFFSET);

    return (): void => {
      try {
        mapOl.un('moveend', debounceCall);
      } catch (e) {
        console.log('OL "moveEnd" remove listener failed', e);
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && data) {
      const currentStartIndex = requestedStartIndexRef.current;
      const fetchedFeatures =
        data.getPolygonPartsFeature.features as Feature<Geometry, GeoJsonProperties>[];
      const hasMoreFeatures =
        fetchedFeatures.length === CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES;

      setExistingPolygonParts((currentFeatures) => {
        const nextFeatures =
          currentStartIndex === STARTING_PAGE
            ? currentFeatures.filter(
              (feature) => !(feature.properties as GeoJsonProperties | null)?._showAsFootprint
            )
            : currentFeatures;

        if (currentStartIndex === STARTING_PAGE && fetchedFeatures.length === 0) {
          return [];
        }

        return [...nextFeatures, ...fetchedFeatures];
      });

      if (hasMoreFeatures) {
        const nextStartIndex = currentStartIndex + CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES;
        requestedStartIndexRef.current = nextStartIndex;
        getExistingPolygonParts(
          mapOl.getView().calculateExtent() as BBox,
          nextStartIndex
        );
      }
    }
    if (loading) {
      showLoadingSpinner(true);
    } else {
      showLoadingSpinner(false);
    }
  }, [data, loading]);

  useEffect(() => {
    if (!loading && error) {
      store.actionDispatcherStore.dispatchAction({
        action: UserAction.SYSTEM_CALLBACK_SHOW_PPERROR_ON_UPDATE,
        data: {
          error: [intl.formatMessage({ id: 'validation-general.polygonParts.wfsServerError' })],
        },
      } as IDispatchAction);
    }
  }, [error, loading]);

  const getExistingPolygonParts = (bbox: BBox, startIndex: number) => {
    const currentZoomLevel = mapOl.getView().getZoom();

    if (
      currentZoomLevel &&
      currentZoomLevel < CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL
    ) {
      requestedStartIndexRef.current = START_OFFSET;
      showLoadingSpinner(false);
      setExistingPolygonParts([createZoomedOutFootprintFeature(layerRecord)]);
    } else {
      requestedStartIndexRef.current = startIndex;
      showLoadingSpinner(true);
      setQuery(
        store.queryGetPolygonPartsFeature({
          data: {
            feature: bboxPolygon(bbox) as GeojsonFeatureInput,
            typeName: getWFSFeatureTypeName(layerRecord as LayerRasterRecordModelType, ENUMS),
            count: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES,
            startIndex,
          },
        })
      );
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
            stroke: PPMapStyles.get(FeatureType.EXISTING_PP)?.getStroke(),
            fill: PPMapStyles.get(FeatureType.EXISTING_PP)?.getFill(),
          });

          if (selectedFeature === feat) {
            const baseStroke = PPMapStyles.get(FeatureType.EXISTING_PP)?.getStroke();
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
