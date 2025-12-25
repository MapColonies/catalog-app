import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Feature } from 'geojson';
import { get, isEmpty } from 'lodash';
import { FitOptions } from 'ol/View';
import { Style } from 'ol/style';
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
  VectorSource
} from '@map-colonies/react-components';
import { Checkbox } from '@map-colonies/react-core';
import { Mode } from '../../../../common/models/mode.enum';
import { MapLoadingIndicator } from '../../../../common/components/map/ol-map.loader';
import { ILayerImage } from '../../../models/layerImage';
import { useStore } from '../../../models/RootStore';
import { PolygonPartsVectorLayer as PolygonPartsExtentVectorLayer } from './pp-extent-vector-layer';
import { PPMapStyles } from './pp-map.utils';

import './pp-map.css';

interface GeoFeaturesPresentorProps {
  mode: Mode;
  geoFeatures?: Feature[];
  style?: CSSProperties | undefined,
  fitOptions?: FitOptions | undefined,
  selectedFeatureKey?: string;
  selectionStyle?: Style;
  showExistingPolygonParts?: boolean;
  layerRecord?: ILayerImage | null;
}

const DEFAULT_PROJECTION = 'EPSG:4326';
const MIN_FEATURES_NUMBER = 5; // minimal set of fetures (source, source_marker, perimeter, perimeter_marker, PPs [at least one])
const RENDERS_TILL_FULL_FEATURES_SET = 2; // first render with source, second with all PPs and their perimeter geometries

export const GeoFeaturesPresentorComponent: React.FC<GeoFeaturesPresentorProps> = ({
  mode,
  geoFeatures,
  style,
  fitOptions,
  selectedFeatureKey,
  selectionStyle,
  layerRecord
}) => {
  const store = useStore();
  const intl = useIntl();
  const renderCount = useRef(0);
  const [showExistingPolygonParts, setShowExistingPolygonParts] = useState<boolean>(false);

  useEffect(() => {
    if (geoFeatures && geoFeatures?.length >= MIN_FEATURES_NUMBER) {
      renderCount.current += 1;
    }
  });
 
  const previewBaseMap = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-array-constructor
    const olBaseMap = new Array();
    let baseMap = store.discreteLayersStore.baseMaps?.maps.find((map: IBaseMap) => map.isForPreview);
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
              <TileWMTS options={{
                ...wmtsOptions,
                crossOrigin: 'anonymous'
              }} />
            </TileLayer>
          );
        }
        if (layer.type === 'XYZ_LAYER') {
          const xyzOptions = getXYZOptions({
            url: layer.options.url as string,
          });
          olBaseMap.push(
            <TileLayer key={layer.id} options={{ opacity: layer.opacity }}>
              <TileXYZ options={{
                ...xyzOptions,
                crossOrigin: 'anonymous'
              }} />
            </TileLayer>
          )
        }
      })
    }
    return olBaseMap;
  }, []);
  
  const LegendsArray = useMemo(() => {
    const res: LegendItem[] = [];
    PPMapStyles.forEach((value, key)=>{
      if (!key.includes('MARKER')) {
        res.push({
          title: intl.formatMessage({id: `polygon-parts.map-preview-legend.${key}`}) as string,
          style: value as Style
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
            map.getView().fit(source.getExtent(), fitOptions)
          },0);
        }
      });
    }

    return (
      <>
        {
          geoFeatures?.map((feat, idx) => {
            let featureStyle = PPMapStyles.get(feat?.properties?.featureType);

            if ( selectedFeatureKey && feat?.properties?.key === selectedFeatureKey) {
              featureStyle = selectionStyle;
            }

            return (feat && !isEmpty(feat.geometry)) ?
              <GeoJSONFeature 
                geometry={{...feat.geometry}} 
                fit={false}
                key={feat.id ?? idx}
                featureStyle={featureStyle}
              /> : null
          })
        }
      </>
    );
  };
    
  return (
    <Box style={{...style}}>
      <Map>
        <MapLoadingIndicator/>
        {
          mode === Mode.UPDATE &&
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
        }
        {previewBaseMap}
        <VectorLayer>
          <VectorSource>
            <GeoFeaturesInnerComponent/>
          </VectorSource>
        </VectorLayer>
        {
          showExistingPolygonParts && <PolygonPartsExtentVectorLayer layerRecord={layerRecord}/>
        }
        <Legend legendItems={LegendsArray} title={intl.formatMessage({id: 'polygon-parts.map-preview-legend.title'})}/>
      </Map>
    </Box>
  );
};
