import React, { useEffect, useRef, useState } from 'react';
import { BBox, Feature, GeoJsonProperties, Geometry } from 'geojson';
import { debounce } from 'lodash';
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
  useVectorLayer,
  VectorLayer,
  VectorSource,
} from '@map-colonies/react-components';
import CONFIG from '../../../../common/config';
import { FeatureType, PPMapStyles } from './pp-map.utils';

export interface LowResolutionVectorLayerProps {
  features: Feature[];
  selectedFeatureKey?: string;
  fitOptions?: FitOptions;
  onFeaturesChange?: (features: Feature[]) => void;
}

const DEBOUNCE_INTERVAL = 300;
const LOW_RESOLUTION_LAYER_Z_INDEX = 2;
const EXTENT_BUFFER = 2;

const LayerOrder: React.FC = () => {
  const vectorLayer = useVectorLayer();

  useEffect(() => {
    vectorLayer.setZIndex(LOW_RESOLUTION_LAYER_Z_INDEX);
  }, [vectorLayer]);

  return null;
};

export const LowResolutionVectorLayer: React.FC<LowResolutionVectorLayerProps> = ({
  features,
  selectedFeatureKey,
  fitOptions,
  onFeaturesChange,
}) => {
  const mapOl = useMap();
  const [visibleFeatures, setVisibleFeatures] = useState<Feature[]>([]);
  const featuresRef = useRef<Feature[]>(features);
  featuresRef.current = features;
  const hasFitRef = useRef(false);

  const lowResolutionFootprint = useRef<Feature | undefined>(undefined);

  useEffect(() => {
    if (features.length === 0) {
      lowResolutionFootprint.current = undefined;
      return;
    }

    try {
      const olFormat = new GeoJSON();
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      features.forEach((feat) => {
        if (!feat?.geometry) {
          return;
        }

        try {
          const olGeom = olFormat.readGeometry(feat.geometry);
          const ext = olGeom.getExtent();
          if (ext && ext.length === 4) {
            minX = Math.min(minX, ext[0]);
            minY = Math.min(minY, ext[1]);
            maxX = Math.max(maxX, ext[2]);
            maxY = Math.max(maxY, ext[3]);
          }
        } catch {
          /* ignore invalid feature geometry */
        }
      });

      if (isFinite(minX)) {
        lowResolutionFootprint.current = {
          type: 'Feature',
          geometry: bboxPolygon([minX, minY, maxX, maxY]).geometry as Geometry,
          properties: { _showAsFootprint: true } as GeoJsonProperties,
        };
      } else {
        lowResolutionFootprint.current = undefined;
      }
    } catch {
      lowResolutionFootprint.current = undefined;
    }
  }, [features]);

  const computeVisibleFeatures = (): void => {
    const currentFeatures = featuresRef.current;

    if (currentFeatures.length === 0) {
      setVisibleFeatures([]);
      return;
    }

    const currentZoomLevel = mapOl.getView().getZoom();

    if (
      currentZoomLevel !== undefined &&
      currentZoomLevel < CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL
    ) {
      if (lowResolutionFootprint.current) {
        setVisibleFeatures([lowResolutionFootprint.current]);
      } else {
        setVisibleFeatures([]);
      }
      return;
    }

    try {
      const size = mapOl.getSize() as Size;
      const extentBbox = mapOl
        .getView()
        .calculateExtent([size[0] + EXTENT_BUFFER, size[1] + EXTENT_BUFFER]) as BBox;
      const extentPoly = polygon(bboxPolygon(extentBbox).geometry.coordinates);

      const filtered = currentFeatures.filter((feat) => {
        if (!feat?.geometry) {
          return false;
        }
        const gType = feat.geometry.type;
        if (gType !== 'Polygon' && gType !== 'MultiPolygon') {
          return false;
        }
        try {
          // @ts-ignore
          return intersect(feat, extentPoly) !== null;
        } catch {
          return false;
        }
      });

      setVisibleFeatures(filtered);
    } catch {
      // If extent computation fails, show all features
      setVisibleFeatures(currentFeatures);
    }
  };

  useEffect(() => {
    onFeaturesChange?.(visibleFeatures);
  }, [visibleFeatures]);

  // Fit to features extent on first load, then compute visible features
  useEffect(() => {
    if (features.length === 0) {
      hasFitRef.current = false;
      setVisibleFeatures([]);
      return;
    }

    if (!hasFitRef.current) {
      hasFitRef.current = true;
      try {
        const olFormat = new GeoJSON();
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        features.forEach((feat) => {
          if (!feat?.geometry) {
            return;
          }
          try {
            const olGeom = olFormat.readGeometry(feat.geometry);
            const ext = olGeom.getExtent();
            if (ext && ext.length === 4) {
              minX = Math.min(minX, ext[0]);
              minY = Math.min(minY, ext[1]);
              maxX = Math.max(maxX, ext[2]);
              maxY = Math.max(maxY, ext[3]);
            }
          } catch {
            /* ignore */
          }
        });

        if (isFinite(minX)) {
          mapOl.getView().fit([minX, minY, maxX, maxY], {
            duration: 250,
            padding: [32, 32, 32, 32],
            ...fitOptions,
          });
          // Compute visible features after the fit animation completes
          setTimeout(computeVisibleFeatures, 300);
          return;
        }
      } catch {
        /* ignore */
      }
    }

    computeVisibleFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features]);

  // Subscribe to map moveend to re-filter features on pan/zoom
  useEffect(() => {
    const debouncedHandler = debounce((_e: MapEvent) => {
      computeVisibleFeatures();
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
      <LayerOrder />
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

          const baseStroke = PPMapStyles.get(FeatureType.LOW_RESOLUTION_PP)?.getStroke();
          const featureStyle = new Style({
            stroke: (() => {
              const s = baseStroke?.clone();
              if (s && isSelected) {
                s.setWidth(5);
              }
              return s;
            })(),
            fill: PPMapStyles.get(FeatureType.LOW_RESOLUTION_PP)?.getFill(),
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
