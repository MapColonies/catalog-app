import { CSSProperties, useEffect, useState } from 'react';
import { Box, GeoJSONFeature, VectorLayer, VectorSource } from '@map-colonies/react-components';
import { Geometry } from 'geojson';
import { FitOptions } from 'ol/View';
import { validateGeoJSONString } from '../../../../common/utils/geojson.validation';
import { Mode } from '../../../../common/models/mode.enum';
import { IOLMapBaseMaps, OLMap } from '../../../../common/components/ol-map/ol-map';
import { useStore } from '../../../models/RootStore';

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

  return (
    <Box style={{ ...style, position: 'relative' }}>
      <OLMap
        baseMapsConfig={store.discreteLayersStore.baseMaps as unknown as IOLMapBaseMaps}
        mapLoadingIndicator={false}
        zoomLevelWidget={null}
      >
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
      </OLMap>
    </Box>
  );
};
