import { useEffect, useRef, useState, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { BBox, Feature, GeoJsonProperties, Geometry } from 'geojson';
import { debounce } from 'lodash';
import GeoJSON from 'ol/format/GeoJSON';
import { Options } from 'ol/layer/Base';
import { Size } from 'ol/size';
import { Style } from 'ol/style';
import intersect from '@turf/intersect';
import { polygon } from '@turf/helpers';
import bboxPolygon from '@turf/bbox-polygon';
import { GeoJSONFeature, useMap, VectorLayer, VectorSource } from '@map-colonies/react-components';
import CONFIG from '../../../../common/config';
import { getFirstPoint } from '../../../../common/utils/geo.tools';
import { useStore } from '../../../models';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import { createTextStyle, FEATURE_LABEL_CONFIG, getStyleByFeatureType } from './pp-map.utils';
import { FeatureType } from './feature-type.enum';

export interface IQueryExecutorResponse {
  features: Feature<Geometry, GeoJsonProperties>[];
  pageSize: number;
}

interface PolygonPartsExtentQueryVectorLayerProps {
  featureType: FeatureType;
  queryExecutor: (bbox: BBox, startIndex: number) => Promise<IQueryExecutorResponse>;
  outerPerimeter?: Geometry;
  options?: Options;
  showLabels?: boolean;
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
      text: '',
      _showAsFootprint: true,
      _featureType: featureType,
    },
  };
};

export const PolygonPartsExtentQueryVectorLayer: React.FC<
  PolygonPartsExtentQueryVectorLayerProps
> = ({ featureType, queryExecutor, outerPerimeter, options, showLabels = true }) => {
  const mapOl = useMap();
  const intl = useIntl();
  const store = useStore();
  const activeRequestIdRef = useRef(0);
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const [polygonParts, setPolygonParts] = useState<Feature[]>([]);

  useEffect(() => {
    const requestPolygonPartsByCurrentExtent = (): boolean => {
      const extent = getCurrentExtent();
      void getPolygonParts(extent, START);
      return true;
    };

    const handlePostRender = () => {
      requestPolygonPartsByCurrentExtent();
    };

    mapOl.once('postrender', handlePostRender);

    const debounceCall = debounce(requestPolygonPartsByCurrentExtent, DEBOUNCE_MOUSE_INTERVAL);

    mapOl.on('moveend', debounceCall);

    return (): void => {
      try {
        debounceCall.cancel();
        mapOl.un('moveend', debounceCall);
        mapOl.un('postrender', handlePostRender);
        store.discreteLayersStore.clearCustomValidationError();
      } catch (e) {
        console.log('Failed to unmount PolygonPartsExtentQueryVectorLayer', e);
      }
    };
  }, [queryExecutor]);

  const geoJsonFormat = useMemo(() => new GeoJSON(), []);

  const existingPolygonPartsMarker = useMemo((): Feature | undefined => {
    if (!outerPerimeter) {
      return undefined;
    }
    return {
      type: 'Feature',
      properties: {
        _featureType: FeatureType.EXISTING_PP_FOOTPRINT_MARKER,
      },
      geometry: {
        type: 'Point',
        coordinates: getFirstPoint(outerPerimeter),
      },
    };
  }, [outerPerimeter]);

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

    if (currentZoomLevel && currentZoomLevel < CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL) {
      const invalidatedRequestId = activeRequestIdRef.current + 1;
      activeRequestIdRef.current = invalidatedRequestId;
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
      let hasSuccessfulQuery = false;

      while (true) {
        const result = await queryExecutor(bbox, nextStartIndex);
        hasSuccessfulQuery = true;
        const pageStartIndex = nextStartIndex;
        const { features, pageSize } = result;

        if (activeRequestIdRef.current !== requestId) {
          return;
        }

        setPolygonParts((currentFeatures) => {
          const baseFeatures = pageStartIndex === START ? [] : currentFeatures;
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

      if (activeRequestIdRef.current === requestId && hasSuccessfulQuery) {
        store.discreteLayersStore.clearCustomValidationError();
      }
    } catch (error) {
      if (activeRequestIdRef.current === requestId) {
        const errorMessage = intl.formatMessage({ id: 'resolutionConflict.error.queryFailed' });
        store.discreteLayersStore.setCustomValidationError({ error: [errorMessage] });
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
          const featureKey =
            feat.properties?.id ??
            `${featureType}-${feat.properties?._showAsFootprint ? 'footprint' : 'feature'}-${idx}`;
          const ppStyle = getStyleByFeatureType(feat);
          let ppStroke = ppStyle?.getStroke()?.clone();
          let ppFill = ppStyle?.getFill()?.clone();
          const featureStyle = new Style({
            ...{
              text: showLabels
                ? createTextStyle(
                    feat,
                    4,
                    FEATURE_LABEL_CONFIG.polygons,
                    ZOOM_LEVELS_TABLE,
                    intl.formatMessage({ id: 'polygon-parts.map-preview.zoom-before-fetch' })
                  )
                : undefined,
            },
            stroke: ppStroke,
            fill: ppFill,
          });

          const BUFFER = 2; // Add extra pixels to perimeter around the OL extent in order to discard new geometry boundaries
          const size = mapOl.getSize() as Size;
          const bbox = bboxPolygon(
            mapOl.getView().calculateExtent([size[0] + BUFFER, size[1] + BUFFER]) as BBox
          );
          const extentPolygon = polygon(bbox.geometry.coordinates);

          try {
            // There are some cases when turf.intersect() throws exception, then no need to change geometry
            // @ts-ignore
            const featureClippedPolygon = intersect(feat, extentPolygon);

            if (featureClippedPolygon) {
              const geometry = geoJsonFormat.readGeometry(featureClippedPolygon.geometry);
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
              key={featureKey}
              geometry={feat}
              fit={false}
              featureStyle={featureStyle}
            />
          ) : null;
        })}
        {existingPolygonPartsMarker && polygonParts.length === 1 && (
          <GeoJSONFeature
            key="pp-perimeter-marker"
            geometry={existingPolygonPartsMarker}
            fit={false}
            featureStyle={getStyleByFeatureType(existingPolygonPartsMarker)}
          />
        )}
      </VectorSource>
    </VectorLayer>
  );
};
