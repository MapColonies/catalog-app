import { CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  Box,
  GeoJSONFeature,
  getWMTSOptions,
  getXYZOptions,
  IBaseMap,
  Map,
  TileLayer,
  TileWMTS,
  TileXYZ,
  VectorLayer,
  VectorSource,
} from '@map-colonies/react-components';
import { Geometry } from 'geojson';
import { FitOptions } from 'ol/View';
import { validateGeoJSONString } from '../../../../common/utils/geojson.validation';
import { Mode } from '../../../../common/models/mode.enum';
import { useStore } from '../../../models/RootStore';
import { get } from 'lodash';

interface GeoJsonMapValuePresentorProps {
  mode: Mode;
  jsonValue?: string;
  style?: CSSProperties | undefined;
  fitOptions?: FitOptions | undefined;
}

const DEFAULT_PROJECTION = 'EPSG:4326';

export const GeoJsonMapValuePresentorComponent: React.FC<
  GeoJsonMapValuePresentorProps
> = ({ mode, jsonValue, style, fitOptions }) => {
  const [geoJsonValue, setGeoJsonValue] = useState();
  const store = useStore();
  useEffect(() => {
    if (jsonValue && validateGeoJSONString(jsonValue).valid) {
      //Postpone feature generation till OL-viewer present in DOM
      setTimeout(
        () => {
          setGeoJsonValue(JSON.parse(jsonValue as string));
        },
        [Mode.VIEW, Mode.EDIT].includes(mode) ? 300 : 0
      );
    } else {
      setGeoJsonValue(undefined);
    }
  }, [mode, jsonValue]);

  const previewBaseMap = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-array-constructor
    const olBaseMap = new Array();
    let baseMap = store.discreteLayersStore.baseMaps?.maps.find(
      (map: IBaseMap) => map.isForPreview
    );
    if (!baseMap) {
      baseMap = store.discreteLayersStore.baseMaps?.maps.find(
        (map: IBaseMap) => map.isCurrent
      );
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

  return (
    <Box style={{ ...style }}>
      <Map>
        {previewBaseMap}
        {geoJsonValue && (
          <VectorLayer>
            <VectorSource>
              <GeoJSONFeature
                geometry={geoJsonValue as Geometry}
                fitOptions={{ ...fitOptions }}
                fit={true}
              />
            </VectorSource>
          </VectorLayer>
        )}
      </Map>
    </Box>
  );
};
