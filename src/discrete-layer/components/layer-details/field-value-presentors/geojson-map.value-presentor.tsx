import { CSSProperties, useEffect, useState } from 'react';
import {
  Box,
  GeoJSONFeature,
  Map,
  VectorLayer,
  VectorSource,
} from '@map-colonies/react-components';
import { Geometry } from 'geojson';
import { FitOptions } from 'ol/View';
import { validateGeoJSONString } from '../../../../common/utils/geojson.validation';
import { Mode } from '../../../../common/models/mode.enum';
import { usePreviewBaseMapTiles } from '../../../../common/components/ol-map/ol-tile-layer.utils';

interface GeoJsonMapValuePresentorProps {
  mode: Mode;
  jsonValue?: string;
  style?: CSSProperties | undefined;
  fitOptions?: FitOptions | undefined;
}

export const GeoJsonMapValuePresentorComponent: React.FC<GeoJsonMapValuePresentorProps> = ({
  mode,
  jsonValue,
  style,
  fitOptions,
}) => {
  const [geoJsonValue, setGeoJsonValue] = useState();
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

  const previewBaseMap = usePreviewBaseMapTiles();

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
