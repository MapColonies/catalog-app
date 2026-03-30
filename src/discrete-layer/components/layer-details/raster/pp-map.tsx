import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import { get, isEmpty } from 'lodash';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { FitOptions } from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style, Text } from 'ol/style';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import {
  Box,
  GeoJSONFeature,
  getWMTSOptions,
  getXYZOptions,
  IBaseMap,
  Legend,
  LegendItem,
  Map,
  TileLayer,
  TileWMTS,
  TileXYZ,
  useMap,
  useVectorLayer,
  useVectorSource,
  VectorLayer,
  VectorSource,
} from '@map-colonies/react-components';
import { Checkbox, IconButton, Typography } from '@map-colonies/react-core';
import { dateFormatter } from '../../../../common/helpers/formatters';
import { Mode } from '../../../../common/models/mode.enum';
import { MapLoadingIndicator } from '../../../../common/components/map/ol-map.loader';
import { ILayerImage } from '../../../models/layerImage';
import { useStore } from '../../../models/RootStore';
import { PolygonPartsVectorLayer as PolygonPartsExtentVectorLayer } from './pp-extent-vector-layer';
import { FeatureType, PPMapStyles } from './pp-map.utils';

import './pp-map.css';

interface GeoFeaturesPresentorProps {
  mode: Mode;
  geoFeatures?: Feature[];
  style?: CSSProperties | undefined;
  fitOptions?: FitOptions | undefined;
  selectedFeatureKey?: string;
  selectedFeatureRequestId?: number;
  selectionStyle?: Style;
  showExistingPolygonParts?: boolean;
  layerRecord?: ILayerImage | null;
  enableFeaturePropertiesPopup?: boolean;
  onMapFeatureClick?: (featureKey: string | undefined) => void;
  onFeaturePropertiesPopupClose?: () => void;
}

const DEFAULT_PROJECTION = 'EPSG:4326';
const MIN_FEATURES_NUMBER = 4; // minimal set of fetures (source, source_marker, perimeter, perimeter_marker)
const RENDERS_TILL_FULL_FEATURES_SET = 1; // first render with source, second with PPs perimeter geometry
const NO_PROPERTIES_MESSAGE_KEY = '__noPropertiesMessage';
const FEATURE_LABEL_KEY = 'featureLabel';
const LOW_RESOLUTION_LAYER_Z_INDEX = 2;
const ISO_DATE_TIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?$/;

const LowResolutionLayerOrder: React.FC = () => {
  const vectorLayer = useVectorLayer();

  useEffect(() => {
    vectorLayer.setZIndex(LOW_RESOLUTION_LAYER_Z_INDEX);
  }, [vectorLayer]);

  return null;
};

const getHighlightedStyle = (baseStyle: Style | undefined, fallbackColor = 'rgb(255, 127, 0)'): Style => {
  return new Style({
    stroke: new Stroke({
      color: baseStyle?.getStroke()?.getColor() ?? fallbackColor,
      width: 5,
    }),
    fill: new Fill({
      color: baseStyle?.getFill()?.getColor() ?? 'rgba(255, 127, 0, 0.4)',
    }),
    image: baseStyle?.getImage() ?? undefined,
    text: baseStyle?.getText() ?? undefined,
  });
};

export const GeoFeaturesPresentorComponent: React.FC<GeoFeaturesPresentorProps> = ({
  mode,
  geoFeatures,
  style,
  fitOptions,
  selectedFeatureKey,
  selectedFeatureRequestId,
  selectionStyle,
  layerRecord,
  enableFeaturePropertiesPopup = false,
  onMapFeatureClick,
  onFeaturePropertiesPopupClose,
}) => {
  const store = useStore();
  const intl = useIntl();
  const renderCount = useRef(0);
  const existingPPFeaturesRef = useRef<Feature[]>([]);
  const showExistingPolygonPartsRef = useRef(false);
  const lastHandledSelectedFeatureKeyRef = useRef<string | undefined>(undefined);
  const lastHandledSelectedFeatureRequestIdRef = useRef<number | undefined>(undefined);
  const [showExistingPolygonParts, setShowExistingPolygonParts] = useState<boolean>(false);
  showExistingPolygonPartsRef.current = showExistingPolygonParts;
  const [selectedExistingFeature, setSelectedExistingFeature] = useState<Feature | undefined>(undefined);
  const [selectedFeatureProperties, setSelectedFeatureProperties] = useState<
    Record<string, unknown> | undefined
  >();

  const getClickedFeatureProperties = (coordinate: number[]): Record<string, unknown> | undefined => {
    const allFeatures = [
      ...(geoFeatures ?? []),
      ...(showExistingPolygonPartsRef.current ? existingPPFeaturesRef.current : []),
    ];

    if (allFeatures.length === 0) {
      return undefined;
    }

    const clickedPoint = point(coordinate as [number, number]);
    const clickedFeature = allFeatures.find((feature) => {
      if (!feature?.geometry) {
        return false;
      }

      const geometryType = feature.geometry.type;
      if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
        return false;
      }

      try {
        return booleanPointInPolygon(clickedPoint, feature as Feature<Polygon | MultiPolygon>);
      } catch {
        return false;
      }
    });

    if (clickedFeature) {
      if (clickedFeature.properties && typeof clickedFeature.properties === 'object') {
        const props = clickedFeature.properties as Record<string, unknown>;
        if (Object.keys(props).length > 0) {
          return props;
        }
      }

      return {
        [NO_PROPERTIES_MESSAGE_KEY]: intl.formatMessage({
          id: 'polygon-parts.map-preview.no-feature-properties',
        }),
      };
    }

    return undefined;
  };

  const getClickedOlFeatureProperties = (olFeature: unknown): Record<string, unknown> | undefined => {
    if (!olFeature || typeof olFeature !== 'object') {
      return undefined;
    }

    const geometry = (olFeature as { getGeometry?: () => { getType?: () => string } }).getGeometry?.();
    const geometryType = geometry?.getType?.();

    if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
      return undefined;
    }

    const properties = (olFeature as { getProperties?: () => Record<string, unknown> }).getProperties?.();

    if (!properties || typeof properties !== 'object') {
      return undefined;
    }

    const { geometry: _geometry, ...rest } = properties;
    if (Object.keys(rest).length > 0) {
      return rest;
    }

    return undefined;
  };

  const isOlPolygonFeature = (olFeature: unknown): boolean => {
    if (!olFeature || typeof olFeature !== 'object') {
      return false;
    }

    const geometry = (olFeature as { getGeometry?: () => { getType?: () => string } }).getGeometry?.();
    const geometryType = geometry?.getType?.();

    return geometryType === 'Polygon' || geometryType === 'MultiPolygon';
  };

  const formatPropertyValue = (value: unknown, key?: string): string => {
    if (value === undefined || value === null) {
      return '';
    }

    if (value instanceof Date) {
      return dateFormatter(value, false);
    }
    if (typeof value === 'string') {
      const isDateKey = key !== undefined && /(date|time|utc)/i.test(key);
      const isIsoDateValue = ISO_DATE_TIME_REGEX.test(value.trim());
      if ((isDateKey || isIsoDateValue) && !Number.isNaN(Date.parse(value))) {
        return dateFormatter(value, false);
      }
      return value;
    }
    if (
      typeof value === 'object' &&
      'toISOString' in (value as Record<string, unknown>) &&
      typeof (value as { toISOString?: unknown }).toISOString === 'function'
    ) {
      return dateFormatter(value as Date, false);
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  const formatPropertyKey = (key: string): string => {
    return intl.formatMessage(
      { id: `polygon-parts.map-preview.feature-property.${key}`, defaultMessage: key },
      {}
    );
  };

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
      setSelectedFeatureProperties(undefined);
    }
  }, [enableFeaturePropertiesPopup]);

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

  const GeoFeaturesInnerComponent: React.FC = () => {
    const source = useVectorSource();
    const map = useMap();

    if (renderCount.current < RENDERS_TILL_FULL_FEATURES_SET) {
      source.once('change', () => {
        if (source.getState() === 'ready') {
          setTimeout(() => {
            map.getView().fit(source.getExtent(), fitOptions);
          }, 0);
        }
      });
    }

    return (
      <>
        {geoFeatures?.map((feat, idx) => {
          let featureStyle = PPMapStyles.get(feat?.properties?.featureType);

          if (feat?.properties?.featureType === FeatureType.LOW_RESOLUTION_PP) {
            const featureLabel = feat.properties?.featureLabel as string | undefined;
            const zoomLevel = feat.properties?.zoomLevel;
            const labelParts: string[] = [];
            if (featureLabel) labelParts.push(featureLabel);
            if (zoomLevel !== undefined && zoomLevel !== null) labelParts.push(`(${String(zoomLevel)})`);

            featureStyle = new Style({
              stroke: featureStyle?.getStroke(),
              fill: featureStyle?.getFill(),
              text: new Text({
                text: labelParts.join('\n'),
                textAlign: 'center',
                textBaseline: 'middle',
                font: 'bold 10px/1 Roboto',
                fill: new Fill({ color: 'rgb(255, 127, 0)' }),
                stroke: new Stroke({ color: '#000', width: 1 }),
                placement: 'point',
                overflow: true,
              }),
            });
          }

          if (selectedFeatureKey && feat?.properties?.key === selectedFeatureKey) {
            featureStyle = selectionStyle ?? getHighlightedStyle(featureStyle);
          }

          return feat && !isEmpty(feat.geometry) ? (
            <GeoJSONFeature
              geometry={{ ...feat.geometry }}
              fit={false}
              key={feat.id ?? idx}
              featureStyle={featureStyle}
            />
          ) : null;
        })}
      </>
    );
  };

  const FeatureSelectionHandler: React.FC = () => {
    const map = useMap();

    useEffect(() => {
      if (!selectedFeatureKey) {
        lastHandledSelectedFeatureKeyRef.current = undefined;
        lastHandledSelectedFeatureRequestIdRef.current = undefined;
        return;
      }

      setSelectedExistingFeature(undefined);

      const selectedFeature = geoFeatures?.find((feature) => feature?.properties?.key === selectedFeatureKey);

      if (!selectedFeature?.geometry) {
        return;
      }

      const shouldFitToSelectedFeature = selectedFeatureRequestId !== undefined
        ? lastHandledSelectedFeatureRequestIdRef.current !== selectedFeatureRequestId
        : lastHandledSelectedFeatureKeyRef.current !== selectedFeatureKey;

      if (shouldFitToSelectedFeature) {
        try {
          const geometry = new GeoJSON().readGeometry(selectedFeature.geometry);
          map.getView().fit(geometry.getExtent(), {
            duration: 250,
            maxZoom: 18,
            padding: [32, 32, 32, 32],
            ...fitOptions,
          });
          lastHandledSelectedFeatureKeyRef.current = selectedFeatureKey;
          lastHandledSelectedFeatureRequestIdRef.current = selectedFeatureRequestId;
        } catch {
          return;
        }
      }

      if (!enableFeaturePropertiesPopup) {
        return;
      }

      const properties = selectedFeature.properties as Record<string, unknown> | null | undefined;
      if (properties && Object.keys(properties).length > 0) {
        setSelectedFeatureProperties(properties);
        return;
      }

      setSelectedFeatureProperties({
        [NO_PROPERTIES_MESSAGE_KEY]: intl.formatMessage({
          id: 'polygon-parts.map-preview.no-feature-properties',
        }),
      });
    }, [map, geoFeatures, selectedFeatureKey, selectedFeatureRequestId, fitOptions, enableFeaturePropertiesPopup]);

    return null;
  };

  const MapFeatureClickHandler: React.FC = () => {
    const map = useMap();

    useEffect(() => {
      if (!enableFeaturePropertiesPopup) {
        setSelectedFeatureProperties(undefined);
        return;
      }

      const onSingleClick = (event: MapBrowserEvent<UIEvent>): void => {
        let clickedProperties: Record<string, unknown> | undefined;
        let clickedPolygonWithoutProperties = false;
        let clickedFeatureKey: string | undefined;
        let clickedExistingFeature = false;

        map.forEachFeatureAtPixel(
          event.pixel,
          (feature) => {
            const featureProperties = getClickedOlFeatureProperties(feature);
            if (featureProperties) {
              clickedProperties = featureProperties;
              clickedFeatureKey = featureProperties.key as string | undefined;
              return feature;
            }

            if (isOlPolygonFeature(feature)) {
              // Geometry-only OL feature (no attached properties) — likely an existing green feature.
              // Only search the existing features ref when the existing PP layer is visible.
              if (showExistingPolygonPartsRef.current) {
                // Do a turf lookup to find its GeoJSON counterpart and stop iteration
                // before it falls through to the orange low-resolution feature below it.
                const clickedPoint = point(event.coordinate as [number, number]);
                const matchingExisting = existingPPFeaturesRef.current.find((f) => {
                  if (!f?.geometry) {
                    return false;
                  }
                  const gType = f.geometry.type;
                  if (gType !== 'Polygon' && gType !== 'MultiPolygon') {
                    return false;
                  }
                  try {
                    return booleanPointInPolygon(clickedPoint, f as Feature<Polygon | MultiPolygon>);
                  } catch {
                    return false;
                  }
                });

                if (matchingExisting) {
                  clickedExistingFeature = true;
                  setSelectedExistingFeature(matchingExisting);
                  if (matchingExisting.properties && Object.keys(matchingExisting.properties).length > 0) {
                    clickedProperties = matchingExisting.properties as Record<string, unknown>;
                  } else {
                    clickedProperties = {
                      [NO_PROPERTIES_MESSAGE_KEY]: intl.formatMessage({
                        id: 'polygon-parts.map-preview.no-feature-properties',
                      }),
                    };
                  }
                  return feature; // stop iteration — do not continue to orange features
                }
              }

              clickedPolygonWithoutProperties = true;
            }

            return undefined;
          },
          { hitTolerance: 4 }
        );

        if (clickedProperties) {
          setSelectedFeatureProperties(clickedProperties);
          if (clickedExistingFeature) {
            // Green existing feature was clicked — clear any orange list selection
            onMapFeatureClick?.(undefined);
          } else if (clickedFeatureKey) {
            setSelectedExistingFeature(undefined);
            onMapFeatureClick?.(clickedFeatureKey);
          }
          return;
        }

        const fallbackProperties = getClickedFeatureProperties(event.coordinate);
        if (fallbackProperties) {
          // Determine whether the hit feature belongs to the list (orange) or existing (green)
          const clickedPoint = point(event.coordinate as [number, number]);
          const matchingExistingFallback = showExistingPolygonPartsRef.current ? existingPPFeaturesRef.current.find((f) => {
            if (!f?.geometry) {
              return false;
            }
            const gType = f.geometry.type;
            if (gType !== 'Polygon' && gType !== 'MultiPolygon') {
              return false;
            }
            try {
              return booleanPointInPolygon(clickedPoint, f as Feature<Polygon | MultiPolygon>);
            } catch {
              return false;
            }
          }) : undefined;

          if (matchingExistingFallback) {
            setSelectedExistingFeature(matchingExistingFallback);
            onMapFeatureClick?.(undefined);
          } else {
            setSelectedExistingFeature(undefined);
            const orangeFeature = (geoFeatures ?? []).find((f) => {
              if (!f?.geometry) {
                return false;
              }
              const gType = f.geometry.type;
              if (gType !== 'Polygon' && gType !== 'MultiPolygon') {
                return false;
              }
              try {
                return booleanPointInPolygon(clickedPoint, f as Feature<Polygon | MultiPolygon>);
              } catch {
                return false;
              }
            });
            const fallbackFeatureKey = orangeFeature?.properties?.key as string | undefined;
            if (fallbackFeatureKey) {
              onMapFeatureClick?.(fallbackFeatureKey);
            }
          }

          setSelectedFeatureProperties(fallbackProperties);
          return;
        }

        if (clickedPolygonWithoutProperties) {
          setSelectedFeatureProperties({
            [NO_PROPERTIES_MESSAGE_KEY]: intl.formatMessage({
              id: 'polygon-parts.map-preview.no-feature-properties',
            }),
          });
        }
      };

      map.on('singleclick', onSingleClick);

      return (): void => {
        map.un('singleclick', onSingleClick);
      };
    }, [map, enableFeaturePropertiesPopup, geoFeatures, onMapFeatureClick]);

    return null;
  };

  const featureLabelValue = selectedFeatureProperties?.[FEATURE_LABEL_KEY];

  return (
    <Box className="geoFeaturesMapContainer" style={{ ...style }}>
      <Map>
        <MapLoadingIndicator />
        <MapFeatureClickHandler />
        <FeatureSelectionHandler />
        {mode === Mode.UPDATE && (
          <Box className="checkbox">
            <Checkbox
              className="flexCheckItem showOnMapContainer"
              label={intl.formatMessage({ id: 'polygon-parts.show-exisitng-parts-on-map.label' })}
              checked={showExistingPolygonParts}
              onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
                setShowExistingPolygonParts(evt.currentTarget.checked);
              }}
            />
          </Box>
        )}
        {previewBaseMap}
        <VectorLayer>
          <LowResolutionLayerOrder />
          <VectorSource>
            <GeoFeaturesInnerComponent />
          </VectorSource>
        </VectorLayer>
        {showExistingPolygonParts && (
          <PolygonPartsExtentVectorLayer
            layerRecord={layerRecord}
            selectedFeature={selectedExistingFeature}
            onFeaturesChange={(features): void => {
              existingPPFeaturesRef.current = features;
            }}
          />
        )}
        <Legend
          legendItems={LegendsArray}
          title={intl.formatMessage({ id: 'polygon-parts.map-preview-legend.title' })}
        />
      </Map>
      {enableFeaturePropertiesPopup && selectedFeatureProperties ? (
        <Box className="featurePropertiesPopup">
          <Box className="featurePropertiesPopupHeader">
            <Typography className="featurePropertiesPopupTitle" tag="span">
              {featureLabelValue !== undefined && featureLabelValue !== null
                ? formatPropertyValue(featureLabelValue)
                : ''}
            </Typography>
            <IconButton
              className="featurePropertiesPopupClose mc-icon-Close"
              label="CLOSE"
              onClick={(): void => {
                setSelectedFeatureProperties(undefined);
                setSelectedExistingFeature(undefined);
                onFeaturePropertiesPopupClose?.();
              }}
            />
          </Box>
          <Box className="featurePropertiesPopupRows">
            {Object.entries(selectedFeatureProperties)
              .filter(([key]) => key !== FEATURE_LABEL_KEY)
              .map(([key, value]) => {
              if (key === NO_PROPERTIES_MESSAGE_KEY) {
                return (
                  <Box className="featurePropertiesPopupRow" key={key}>
                    <Typography className="featurePropertiesPopupValue" tag="span">
                      {formatPropertyValue(value, key)}
                    </Typography>
                  </Box>
                );
              }

              return (
                <Box className="featurePropertiesPopupRow" key={key}>
                  <Typography className="featurePropertiesPopupKey" tag="span">
                    {formatPropertyKey(key)}
                  </Typography>
                  <Typography className="featurePropertiesPopupValue" tag="span">
                    {formatPropertyValue(value, key)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};
