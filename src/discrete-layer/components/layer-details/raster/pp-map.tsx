import { CSSProperties, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import { get, isEmpty } from 'lodash';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { FitOptions } from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style } from 'ol/style';
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
  useVectorSource,
  VectorLayer,
  VectorSource,
} from '@map-colonies/react-components';
import { Checkbox, IconButton, Typography } from '@map-colonies/react-core';
import { dateFormatter } from '../../../../common/helpers/formatters';
import { Mode } from '../../../../common/models/mode.enum';
import { MapLoadingIndicator } from '../../../../common/components/ol-map/map-loading-indicator';
import { ILayerImage } from '../../../models/layerImage';
import { useStore } from '../../../models/RootStore';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import { PolygonPartsVectorLayer as PolygonPartsExtentVectorLayer } from './polygon-parts-vector-layer';
import { FEATURE_LABEL_CONFIG, FeatureType, getText, PPMapStyles } from './pp-map.utils';

import './pp-map.css';

interface GeoFeaturesPresentorProps {
  mode: Mode;
  geoFeatures?: Feature[];
  children?: JSX.Element | null;
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
  externalFeaturesRef?: MutableRefObject<Feature[]>;
  pendingSelectionFeatureRef?: MutableRefObject<Feature | null>;
}

const DEFAULT_PROJECTION = 'EPSG:4326';
const MIN_FEATURES_NUMBER = 4; // minimal set of fetures (source, source_marker, perimeter, perimeter_marker)
const RENDERS_TILL_FULL_FEATURES_SET = 1; // first render with source, second with PPs perimeter geometry
const NO_PROPERTIES_MESSAGE_KEY = '__noPropertiesMessage';
const FEATURE_LABEL_KEY = '_featureLabel';
const ISO_DATE_TIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?$/;

const getHighlightedStyle = (baseStyle: Style | undefined): Style => {
  return new Style({
    stroke: new Stroke({
      color: baseStyle?.getStroke()?.getColor() ?? '#ff7f00',
      width: 5,
    }),
    fill: new Fill({
      color: baseStyle?.getFill()?.getColor() ?? '#ff7f0066',
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
  children,
  selectedFeatureKey,
  selectedFeatureRequestId,
  selectionStyle,
  layerRecord,
  enableFeaturePropertiesPopup = false,
  onMapFeatureClick,
  onFeaturePropertiesPopupClose,
  externalFeaturesRef,
  pendingSelectionFeatureRef,
}) => {
  const store = useStore();
  const intl = useIntl();
  const renderCount = useRef(0);
  const existingPPFeaturesRef = useRef<Feature[]>([]);
  const showExistingPolygonPartsRef = useRef(false);
  const previousShowExistingPolygonPartsRef = useRef(false);
  const lastCheckboxClickTimestampRef = useRef(0);
  const previousGeoFeaturesLengthRef = useRef(geoFeatures?.length ?? 0);
  const lastHandledSelectedFeatureKeyRef = useRef<string | undefined>(undefined);
  const lastHandledSelectedFeatureRequestIdRef = useRef<number | undefined>(undefined);
  const [showExistingPolygonParts, setShowExistingPolygonParts] = useState<boolean>(false);
  showExistingPolygonPartsRef.current = showExistingPolygonParts;
  const [selectedExistingFeature, setSelectedExistingFeature] = useState<Feature | undefined>(undefined);
  const [selectedFeatureProperties, setSelectedFeatureProperties] = useState<Record<string, unknown> | undefined>();
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const resolutionDegreeToZoomLevel = useMemo(() => {
    const table = Object.values(ZOOM_LEVELS_TABLE);
    return Object.fromEntries(table.map((value, index) => [String(value), index]));
  }, [ZOOM_LEVELS_TABLE]);

  const getClickedFeatureProperties = (coordinate: number[]): Record<string, unknown> | undefined => {
    const allFeatures = [
      ...(geoFeatures ?? []),
      ...(externalFeaturesRef?.current ?? []),
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
        if (props._showAsFootprint) {
          return undefined;
        }

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
    if (rest._showAsFootprint) {
      return undefined;
    }

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
    if (key === 'resolutionDegree') {
      const zoomLevel = resolutionDegreeToZoomLevel[String(value)];
      return zoomLevel !== undefined ? `${String(value)} (${String(zoomLevel)})` : String(value);
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

  const addExistingFeatureLabelToProperties = (
    properties: Record<string, unknown>,
    existingFeature: Feature
  ): Record<string, unknown> => {
    const existingLabel = getText(
      existingFeature,
      4,
      FEATURE_LABEL_CONFIG.polygons,
      ZOOM_LEVELS_TABLE
    );

    return {
      ...properties,
      [FEATURE_LABEL_KEY]: existingLabel,
    };
  };

  const addFeatureLabelToProperties = (
    properties: Record<string, unknown>
  ): Record<string, unknown> => {
    const featureLabel = properties._featureLabel as string | undefined;
    if (!featureLabel) {
      return properties;
    }

    const zoomLevel = properties._zoomLevel;

    const labelParts: string[] = [];

    if (featureLabel) {
      labelParts.push(featureLabel);
    }

    if (zoomLevel !== undefined && zoomLevel !== null) {
      labelParts.push(`(${String(zoomLevel)})`);
    }

    return {
      ...properties,
      [FEATURE_LABEL_KEY]: labelParts.join(' '),
    };
  };

  const isFootprintProperties = (properties?: Record<string, unknown>): boolean => {
    return Boolean(properties?._showAsFootprint);
  };

  const isFootprintOnlyDisplay = (features?: Feature[]): boolean => {
    if (!features || features.length !== 1) {
      return false;
    }

    const properties = features[0]?.properties;
    return Boolean(
      properties &&
      typeof properties === 'object' &&
      (properties as Record<string, unknown>)._showAsFootprint
    );
  };

  const clearPreviewSelection = (): void => {
    setSelectedExistingFeature(undefined);
    setSelectedFeatureProperties(undefined);
    onMapFeatureClick?.(undefined);
    onFeaturePropertiesPopupClose?.();
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

  useEffect(() => {
    if (!selectedFeatureKey && !selectedExistingFeature) {
      setSelectedFeatureProperties(undefined);
    }
  }, [selectedFeatureKey, selectedExistingFeature]);

  useEffect(() => {
    const wasShown = previousShowExistingPolygonPartsRef.current;

    if (wasShown && !showExistingPolygonParts) {
      clearPreviewSelection();
    }

    previousShowExistingPolygonPartsRef.current = showExistingPolygonParts;
  }, [showExistingPolygonParts, onMapFeatureClick, onFeaturePropertiesPopupClose]);

  useEffect(() => {
    const currentGeoFeaturesLength = geoFeatures?.length ?? 0;

    if (previousGeoFeaturesLengthRef.current > 0 && currentGeoFeaturesLength === 0) {
      clearPreviewSelection();
    }

    previousGeoFeaturesLengthRef.current = currentGeoFeaturesLength;
  }, [geoFeatures, onMapFeatureClick, onFeaturePropertiesPopupClose]);

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
          let featureStyle = PPMapStyles.get(feat?.properties?._featureType);
          const featureKey = (feat?.properties?._key as string | undefined) ?? (feat?.properties?.key as string | undefined);

          if (selectedFeatureKey && featureKey === selectedFeatureKey) {
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

      const selectedFeature = [...(geoFeatures ?? []), ...(externalFeaturesRef?.current ?? [])].find((feature) => {
        return feature?.properties?._key === selectedFeatureKey;
      });

      // If not in viewport, fall back to pendingSelectionFeatureRef (set by list click)
      let featureToFit = selectedFeature;
      if (!featureToFit) {
        const pending = pendingSelectionFeatureRef?.current;
        const pendingKey = pending?.properties?._key;
        if (pendingSelectionFeatureRef && pendingKey === selectedFeatureKey) {
          featureToFit = pending ?? undefined;
          pendingSelectionFeatureRef.current = null;
        }
      }

      if (!featureToFit?.geometry) {
        return;
      }

      const shouldFitToSelectedFeature = selectedFeatureRequestId !== undefined
        ? lastHandledSelectedFeatureRequestIdRef.current !== selectedFeatureRequestId
        : lastHandledSelectedFeatureKeyRef.current !== selectedFeatureKey;

      if (shouldFitToSelectedFeature) {
        try {
          const geometry = new GeoJSON().readGeometry(featureToFit.geometry);
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

        if (!enableFeaturePropertiesPopup) {
          return;
        }

        const properties = featureToFit.properties as Record<string, unknown> | null | undefined;
        if (properties && Object.keys(properties).length > 0) {
          setSelectedFeatureProperties(addFeatureLabelToProperties(properties));
          return;
        }

        setSelectedFeatureProperties({
          [NO_PROPERTIES_MESSAGE_KEY]: intl.formatMessage({
            id: 'polygon-parts.map-preview.no-feature-properties',
          }),
        });
      }
    }, [
      map,
      geoFeatures,
      externalFeaturesRef,
      pendingSelectionFeatureRef,
      selectedFeatureKey,
      selectedFeatureRequestId,
      fitOptions,
      enableFeaturePropertiesPopup,
    ]);

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
        if (Date.now() - lastCheckboxClickTimestampRef.current < 150) {
          return;
        }

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
              clickedFeatureKey = (featureProperties._key as string | undefined) ?? (featureProperties.key as string | undefined);
              return feature;
            }

            if (isOlPolygonFeature(feature)) {
              // Geometry-only OL feature (no attached properties) - likely an existing feature.
              // Only search the existing features ref when the existing PP layer is visible.
              if (showExistingPolygonPartsRef.current) {
                // Do a turf lookup to find its GeoJSON counterpart and stop iteration
                // before it falls through to the external features.
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
                  if (
                    isFootprintProperties(
                      matchingExisting.properties as Record<string, unknown> | undefined
                    )
                  ) {
                    return undefined;
                  }

                  clickedExistingFeature = true;
                  setSelectedExistingFeature(matchingExisting);
                  if (matchingExisting.properties && Object.keys(matchingExisting.properties).length > 0) {
                    clickedProperties = addExistingFeatureLabelToProperties(
                      matchingExisting.properties as Record<string, unknown>,
                      matchingExisting
                    );
                  } else {
                    clickedProperties = addExistingFeatureLabelToProperties({
                      [NO_PROPERTIES_MESSAGE_KEY]: intl.formatMessage({
                        id: 'polygon-parts.map-preview.no-feature-properties',
                      }),
                    }, matchingExisting);
                  }
                  return feature; // stop iteration — do not continue to external features
                }
              }

              clickedPolygonWithoutProperties = true;
            }

            return undefined;
          },
          { hitTolerance: 4 }
        );

        if (clickedProperties) {
          setSelectedFeatureProperties(addFeatureLabelToProperties(clickedProperties));
          if (clickedExistingFeature) {
            // Existing feature was clicked - clear any external list selection
            onMapFeatureClick?.(undefined);
          } else if (clickedFeatureKey) {
            setSelectedExistingFeature(undefined);
            onMapFeatureClick?.(clickedFeatureKey);
          }
          return;
        }

        const fallbackProperties = getClickedFeatureProperties(event.coordinate);
        if (fallbackProperties) {
          if (isFootprintProperties(fallbackProperties)) {
            setSelectedExistingFeature(undefined);
            setSelectedFeatureProperties(undefined);
            return;
          }

          // Determine whether the hit feature belongs to the existing features or external features
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
            if (
              isFootprintProperties(
                matchingExistingFallback.properties as Record<string, unknown> | undefined
              )
            ) {
              setSelectedExistingFeature(undefined);
              setSelectedFeatureProperties(undefined);
              return;
            }

            setSelectedExistingFeature(matchingExistingFallback);
            onMapFeatureClick?.(undefined);
            setSelectedFeatureProperties(
              addExistingFeatureLabelToProperties(fallbackProperties, matchingExistingFallback)
            );
            return;
          }

          setSelectedExistingFeature(undefined);
          const external = [...(geoFeatures ?? []), ...(externalFeaturesRef?.current ?? [])].find((f) => {
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
          const fallbackFeatureKey = external?.properties?._key;
          if (fallbackFeatureKey) {
            onMapFeatureClick?.(fallbackFeatureKey);
          }

          setSelectedFeatureProperties(addFeatureLabelToProperties(fallbackProperties));
          return;
        }

        if (clickedPolygonWithoutProperties) {
          setSelectedExistingFeature(undefined);
          setSelectedFeatureProperties(undefined);
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

  const featureTitleColor = useMemo(() => {
    const toCssColor = (color: unknown): string | undefined => {
      if (typeof color === 'string') {
        return color;
      }

      if (Array.isArray(color)) {
        return color.length === 4 ? `rgba(${color.join(',')})` : `rgb(${color.join(',')})`;
      }

      return undefined;
    };

    if (selectedExistingFeature) {
      return toCssColor(PPMapStyles.get(FeatureType.EXISTING_PP)?.getStroke()?.getColor());
    }

    if (selectedFeatureProperties?._featureType === FeatureType.LOW_RESOLUTION_PP) {
      return toCssColor(PPMapStyles.get(FeatureType.LOW_RESOLUTION_PP)?.getStroke()?.getColor());
    }

    return undefined;
  }, [selectedExistingFeature, selectedFeatureProperties?._featureType]);

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
                evt.preventDefault();
                evt.stopPropagation();
                lastCheckboxClickTimestampRef.current = Date.now();

                const isChecked = evt.currentTarget.checked;
                setShowExistingPolygonParts(isChecked);

                if (!isChecked) {
                  clearPreviewSelection();
                }
              }}
            />
          </Box>
        )}
        {previewBaseMap}
        <VectorLayer>
          <VectorSource>
            <GeoFeaturesInnerComponent />
          </VectorSource>
        </VectorLayer>
        {children}
        {showExistingPolygonParts && (
          <PolygonPartsExtentVectorLayer
            layerRecord={layerRecord}
            selectedFeature={selectedExistingFeature}
            onFeaturesChange={(features): void => {
              existingPPFeaturesRef.current = features;

              if (isFootprintOnlyDisplay(features)) {
                clearPreviewSelection();
              }
            }}
          />
          ///////WFS RASTER PARTS LAYER///////
          // <PolygonPartsExtentQueryVectorLayer
          //   style={PPMapStyles.get(FeatureType.EXISTING_PP)}
          //   outterPrimeter={layerRecord.footprint}
          //   queryExecutor={async (extent_bbox): Promise<void>  => {
          //     return await store.queryGetPolygonPartsFeature({
          //       data: {
          //         feature: bboxPolygon(bbox) as GeojsonFeatureInput,
          //         typeName: getWFSFeatureTypeName(layerRecord as LayerRasterRecordModelType, ENUMS),
          //         count: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES,
          //         startIndex,
          //       },
          //     })
          //   }}
          //   selectedFeature={selectedExistingFeature}
          //   onFeaturesChange={(features): void => {
          //     existingPPFeaturesRef.current = features;

          //     if (isFootprintOnlyDisplay(features)) {
          //       clearPreviewSelection();
          //     }
          //   }}
          // />

          // ///////REPORT PARTS LAYER///////
          // <PolygonPartsExtentQueryVectorLayer
          //   style={PPMapStyles.get(FeatureType.LOW_RESOLUTION_PP)}
          //   outterPrimeter={api.perimeter}
          //   queryExecutor={async (extent_bbox): Promise<void>  => {
          //     return await api.query(bbox)
          //   }}
          //   selectedFeature={selectedExistingFeature}
          //   onFeaturesChange={(features): void => {
          //     existingPPFeaturesRef.current = features;

          //     if (isFootprintOnlyDisplay(features)) {
          //       clearPreviewSelection();
          //     }
          //   }}
          // />
        )}
        <Legend
          legendItems={LegendsArray}
          title={intl.formatMessage({ id: 'polygon-parts.map-preview-legend.title' })}
        />
      </Map>
      {enableFeaturePropertiesPopup && selectedFeatureProperties ? (
        <Box className="featurePropertiesPopup">
          <Box className="featurePropertiesPopupHeader">
            <Typography className="featurePropertiesPopupTitle" tag="span" style={{ color: featureTitleColor }}>
              {featureLabelValue !== undefined && featureLabelValue !== null
                ? formatPropertyValue(featureLabelValue)
                : ''}
            </Typography>
            <IconButton
              className="featurePropertiesPopupClose mc-icon-Close"
              label="CLOSE"
              onClick={(): void => {
                clearPreviewSelection();
              }}
            />
          </Box>
          <Box className="featurePropertiesPopupRows">
            {Object.entries(selectedFeatureProperties)
              .filter(([key]) => {
                if (key === NO_PROPERTIES_MESSAGE_KEY) {
                  return true;
                }
                return key !== FEATURE_LABEL_KEY && !key.startsWith('_');
              })
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
