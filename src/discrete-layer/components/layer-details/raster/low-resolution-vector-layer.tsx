import React, { useEffect, useRef, useState } from 'react';
import { BBox, Feature, GeoJsonProperties } from 'geojson';
import { debounce, get } from 'lodash';
import { MapEvent } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Size } from 'ol/size';
import { FitOptions } from 'ol/View';
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
import { VectorLayerOrder } from '../../../../common/components/ol-map/vector-layer-order';
import { FeatureType, PPMapStyles } from './pp-map.utils';

export interface LowResolutionVectorLayerProps {
  outerPerimeter?: Feature;
  featureType: FeatureType;
  queryExecutor: (bbox: BBox) => Promise<unknown>;
  selectedFeatureKey?: string;
  fitOptions?: FitOptions;
  onFeaturesChange?: (features: Feature[]) => void;
}

const DEBOUNCE_INTERVAL = 300;
const LAYER_Z_INDEX = 2;
const EXTENT_BUFFER = 2;

export const LowResolutionVectorLayer: React.FC<LowResolutionVectorLayerProps> = ({
  outerPerimeter,
  featureType,
  queryExecutor,
  selectedFeatureKey,
  fitOptions,
  onFeaturesChange,
}) => {
  const mapOl = useMap();
  const [visibleFeatures, setVisibleFeatures] = useState<Feature[]>([]);
  const activeRequestIdRef = useRef(0);

  const footprint = useRef<Feature | undefined>(undefined);

  useEffect(() => {
    if (!outerPerimeter?.geometry) {
      footprint.current = undefined;
      return;
    }

    footprint.current = {
      ...outerPerimeter,
      properties: {
        ...(outerPerimeter.properties as GeoJsonProperties | undefined),
        _showAsFootprint: true,
        _featureType: featureType,
      },
    };
  }, [outerPerimeter, featureType]);

  const computeVisibleFeatures = async (): Promise<void> => {
    if (!outerPerimeter?.geometry) {
      setVisibleFeatures([]);
      return;
    }

    const currentZoomLevel = mapOl.getView().getZoom();

    if (
      currentZoomLevel !== undefined &&
      currentZoomLevel < CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL
    ) {
      if (footprint.current) {
        setVisibleFeatures([footprint.current]);
      } else {
        setVisibleFeatures([]);
      }
      return;
    }

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;

    try {
      const size = mapOl.getSize() as Size;
      const extentBbox = mapOl
        .getView()
        .calculateExtent([size[0] + EXTENT_BUFFER, size[1] + EXTENT_BUFFER]) as BBox;

      const result = await queryExecutor(extentBbox);
      if (activeRequestIdRef.current !== requestId) {
        return;
      }

      const rawFeatures = get(result, 'features', get(result, 'getPolygonPartsFeature.features', []));
      const queriedFeatures = (Array.isArray(rawFeatures) ? rawFeatures : []) as Feature[];
      setVisibleFeatures(queriedFeatures);
    } catch {
      if (activeRequestIdRef.current === requestId) {
        setVisibleFeatures([]);
      }
    }
  };

  useEffect(() => {
    onFeaturesChange?.(visibleFeatures);
  }, [visibleFeatures]);

  useEffect(() => {
    void computeVisibleFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outerPerimeter]);

  // Subscribe to map moveend to re-filter features on pan/zoom
  useEffect(() => {
    const debouncedHandler = debounce((_e: MapEvent) => {
      void computeVisibleFeatures();
    }, DEBOUNCE_INTERVAL);

    mapOl.on('moveend', debouncedHandler);

    return (): void => {
      try {
        mapOl.un('moveend', debouncedHandler);
      } catch (e) {
        console.log('OL "moveEnd" remove listener failed', e);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VectorLayer>
      <VectorLayerOrder zIndex={LAYER_Z_INDEX} />
      <VectorSource>
        {visibleFeatures.map((feat, idx) => {
          const isFootprint = Boolean(feat.properties?._showAsFootprint);
          const featureLabel = feat.properties?._featureLabel as string | undefined;
          const zoomLevel = feat.properties?._zoomLevel;
          const isSelected =
            !isFootprint &&
            selectedFeatureKey !== undefined &&
            feat.properties?._key === selectedFeatureKey;

          const labelParts: string[] = [];
          if (!isFootprint) {
            if (featureLabel) {
              labelParts.push(featureLabel);
            }
            if (zoomLevel !== undefined && zoomLevel !== null) {
              labelParts.push(`(${String(zoomLevel)})`);
            }
          }

          const baseStroke = PPMapStyles.get(featureType)?.getStroke();
          const featureStyle = new Style({
            stroke: (() => {
              const s = baseStroke?.clone();
              if (s && isSelected) {
                s.setWidth(5);
              }
              return s;
            })(),
            fill: PPMapStyles.get(featureType)?.getFill(),
            text:
              isFootprint || labelParts.length === 0
                ? undefined
                : new Text({
                  text: labelParts.join('\n'),
                  textAlign: 'center',
                  textBaseline: 'middle',
                  font: 'bold 10px/1 Roboto',
                  fill: new Fill({ color: '#ff7f00' }),
                  stroke: new Stroke({ color: '#000', width: 3 }),
                  placement: 'point',
                  overflow: true,
                }),
          });

          // Clip geometry to viewport extent (same technique as pp-extent-vector-layer.tsx)
          if (!isFootprint) {
            try {
              const size = mapOl.getSize() as Size;
              const extentBbox = mapOl
                .getView()
                .calculateExtent([size[0] + EXTENT_BUFFER, size[1] + EXTENT_BUFFER]) as BBox;
              const extentPoly = polygon(bboxPolygon(extentBbox).geometry.coordinates);
              // @ts-ignore
              const clipped = intersect(feat, extentPoly);
              if (clipped) {
                const olGeometry = new GeoJSON().readGeometry(clipped.geometry);
                featureStyle.setGeometry(olGeometry);
              }
            } catch {
              /* Keep original geometry */
            }
          }

          return (
            <GeoJSONFeature
              key={isFootprint ? `footprint-${idx}` : (feat.properties?._key ?? idx)}
              geometry={{ ...feat.geometry }}
              fit={false}
              featureStyle={featureStyle}
            />
          );
        })}
      </VectorSource>
    </VectorLayer>
  );
};
