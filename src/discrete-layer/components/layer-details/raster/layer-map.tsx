import React, {
  CSSProperties,
  JSXElementConstructor,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { BBox, Feature, Geometry } from 'geojson';
import { get } from 'lodash';
import bboxPolygon from '@turf/bbox-polygon';
import { Box, LegendItem } from '@map-colonies/react-components';
import { Checkbox } from '@map-colonies/react-core';
import CONFIG from '../../../../common/config';
import { useEnums } from '../../../../common/hooks/useEnum.hook';
import { MapFeatureClickHandler } from '../../../../common/components/ol-map/map-feature-click-handler';
import { OLMap } from '../../../../common/components/ol-map/ol-map';
import { SelectedFeatureVectorLayer } from '../../../../common/components/ol-map/selected-feature-vector-layer';
import { FlyTo } from '../../../../common/components/ol-map/fly-to';
import { LayerRasterRecordModelType } from '../../../models';
import { ILayerImage } from '../../../models/layerImage';
import { useStore } from '../../../models/RootStore';
import { GeojsonFeatureInput } from '../../../models/RootStore.base';
import { OlLayer } from '../../map-container/ol.layer-record.tile';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';
import { FeaturePropertiesPopupComponent } from './feature-properties-popup.component';
import {
  IQueryExecutorResponse,
  PolygonPartsExtentQueryVectorLayer,
} from './polygon-parts-extent-query-vector-layer';
import {
  FEATURE_LABEL_CONFIG,
  VectorLayerZIndex,
  getText,
  getWFSFeatureTypeName,
  PPMapStyles,
  START_RASTER_LAYER_ZINDEX,
} from './pp-map.utils';
import { FeatureType } from './feature-type.enum';

import './pp-map.css';

interface LayerMapProps {
  layerRecord: ILayerImage;
  showPolygonParts?: {
    value: boolean;
    showCheckbox: boolean;
  };
  showLayer?: boolean;
  showBaseMap?: {
    value: boolean;
    showToggleButton?: boolean;
  };
  showFeaturePropertiesPopup?: boolean;
  style?: CSSProperties | undefined;
  children?: JSX.Element | null;
}

const CHILDREN_WITH_ZOOM_INDICATION = ['PolygonPartsExtentQueryVectorLayer'];

export const OlLayerMap: React.FC<LayerMapProps> = ({
  layerRecord,
  showPolygonParts = {
    value: false,
    showCheckbox: true,
  },
  showLayer = true,
  showBaseMap = {
    value: true,
    showToggleButton: false,
  },
  showFeaturePropertiesPopup = false,
  style,
  children,
}) => {
  const store = useStore();
  const ENUMS = useEnums();
  const intl = useIntl();
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const [selectedFeature, setSelectedFeature] = useState<Feature | undefined>(undefined);
  const [showExistingPolygonParts, setShowExistingPolygonParts] = useState<boolean>(
    showPolygonParts.value
  );
  const [childrenWithZoomIndication, setChildrenWithZoomIndication] = useState<boolean>(false);
  const [isOpenProperties, setIsOpenProperties] = useState<boolean>(true);

  useEffect(() => {
    const hasZoomIndicationChild = (nodes: React.ReactNode): boolean => {
      return React.Children.toArray(nodes).some((child) => {
        if (!React.isValidElement(child)) return false;

        const typeName =
          typeof child.type === 'string'
            ? child.type
            : (child.type as JSXElementConstructor<any>).name;

        if (CHILDREN_WITH_ZOOM_INDICATION.includes(typeName)) {
          return true;
        }

        return hasZoomIndicationChild(child.props?.children);
      });
    };
    setChildrenWithZoomIndication(hasZoomIndicationChild(children));
  }, [children]);

  useEffect(() => {
    setShowExistingPolygonParts(showPolygonParts.value);
  }, [showPolygonParts.value]);

  useEffect(() => {
    if (selectedFeature) {
      setIsOpenProperties(true);
    } else {
      setIsOpenProperties(false);
    }
  }, [selectedFeature]);

  const closePropertiesPopup = useCallback((): void => {
    setIsOpenProperties(false);
  }, []);

  const LegendsArray = useMemo(() => {
    const res: LegendItem[] = [];
    PPMapStyles.forEach((value, key) => {
      if (!key.includes('MARKER')) {
        res.push({
          title: intl.formatMessage({ id: `polygon-parts.map-preview-legend.${key}` }) as string,
          style: value.style,
        });
      }
    });
    return res;
  }, [intl]);

  const mapLocale = useMemo(
    () => ({
      ZOOM_LABEL: intl.formatMessage({ id: 'map.zoom.label' }),
      LEGEND_TITLE: intl.formatMessage({ id: 'polygon-parts.map-preview-legend.title' }),
      BASE_MAP_TOGGLE_ENABLE_LABEL: intl.formatMessage({
        id: 'polygon-parts.map-preview.without.base-map',
      }),
      BASE_MAP_TOGGLE_DISABLE_LABEL: intl.formatMessage({
        id: 'polygon-parts.map-preview.base-map',
      }),
    }),
    [intl]
  );

  const queryExecutor = async (bbox: BBox, startIndex: number): Promise<IQueryExecutorResponse> => {
    const result = await store.queryGetPolygonPartsFeature({
      data: {
        feature: bboxPolygon(bbox) as GeojsonFeatureInput,
        typeName: getWFSFeatureTypeName(layerRecord as LayerRasterRecordModelType, ENUMS),
        count: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES,
        startIndex,
      },
    });
    const fetchedFeatures = get(result, 'getPolygonPartsFeature.features', []);
    const features = (Array.isArray(fetchedFeatures) ? fetchedFeatures : []).map((feature) => ({
      ...feature,
      properties: {
        ...(feature?.properties ?? {}),
        _featureType: FeatureType.EXISTING_PP,
        _featureTitle: getText(feature, 4, FEATURE_LABEL_CONFIG.polygons, ZOOM_LEVELS_TABLE),
      },
    }));
    return { features, pageSize: CONFIG.POLYGON_PARTS.MAX.WFS_FEATURES };
  };

  const layerCapability = store.discreteLayersStore.getLayerCapability(layerRecord);

  const olLayerOptions = useMemo(() => {
    return {
      extent: layerRecord.footprint?.bbox,
      zIndex: START_RASTER_LAYER_ZINDEX,
    };
  }, [layerRecord.footprint?.bbox]);

  const footprintFeature = useMemo(() => {
    return {
      type: 'Feature',
      properties: {},
      geometry: layerRecord.footprint,
    } as Feature;
  }, [layerRecord.footprint]);

  return (
    <Box id="geoFeaturesMapContainer" style={{ ...style }}>
      <OLMap
        baseMapsConfig={
          store.discreteLayersStore.baseMaps
            ? {
                maps: store.discreteLayersStore.baseMaps.maps,
                showBaseMap: showBaseMap?.value ?? false,
                showToggleButton: showBaseMap?.showToggleButton,
              }
            : undefined
        }
        zoomLevelWidget={{
          indicateTillZoomLevel:
            showExistingPolygonParts || childrenWithZoomIndication
              ? CONFIG.POLYGON_PARTS.MAX.SHOW_FOOTPRINT_ZOOM_LEVEL
              : undefined,
        }}
        legends={LegendsArray}
        locale={mapLocale}
      >
        {showPolygonParts.showCheckbox && (
          <Box className="checkbox">
            <Checkbox
              className="showOnMapContainer"
              label={intl.formatMessage({ id: 'polygon-parts.show-exisitng-parts-on-map.label' })}
              checked={showExistingPolygonParts}
              onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
                evt.preventDefault();
                evt.stopPropagation();
                const isChecked = evt.currentTarget.checked;
                setShowExistingPolygonParts(isChecked);
              }}
            />
          </Box>
        )}
        {showExistingPolygonParts && (
          <PolygonPartsExtentQueryVectorLayer
            featureType={FeatureType.EXISTING_PP}
            queryExecutor={queryExecutor}
            outerPerimeter={layerRecord?.footprint as Geometry | undefined}
            options={{
              properties: { id: FeatureType.EXISTING_PP },
              zIndex: VectorLayerZIndex.EXISTING,
            }}
          />
        )}
        {children}
        <MapFeatureClickHandler setSelectedFeature={setSelectedFeature} />
        <SelectedFeatureVectorLayer
          feature={selectedFeature}
          options={{
            properties: { id: 'SELECTED_PP' },
            zIndex: VectorLayerZIndex.SELECTED,
          }}
        />
        <FlyTo feature={selectedFeature} />
        {showFeaturePropertiesPopup && isOpenProperties && (
          <FeaturePropertiesPopupComponent
            selectedFeature={selectedFeature}
            onClose={closePropertiesPopup}
          />
        )}
        {showLayer && (
          <>
            <OlLayer
              layerRecord={layerRecord}
              capability={layerCapability}
              layerOptions={olLayerOptions}
            />
            <FlyTo feature={footprintFeature} flyOnce={true} />
          </>
        )}
      </OLMap>
    </Box>
  );
};
