import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { isEmpty } from 'lodash';
import {
  CesiumCartesian3,
  CesiumCartographic,
  CesiumEntity,
  cesiumSampleTerrainMostDetailed,
  CesiumVerticalOrigin,
  useCesiumMap,
} from '@map-colonies/react-components';

const DEFAULT_HEIGHT = 100;
const CAMERA_HEIGHT_OFFSET = 500;

interface PoiEntityProps {
  longitude: number;
  latitude: number;
}

export const PoiEntity: React.FC<PoiEntityProps> = ({
  longitude,
  latitude,
}) => {
  const intl = useIntl();
  const mapViewer = useCesiumMap();
  const [position, setPosition] = useState<CesiumCartesian3 | undefined>();
  const [height, setHeight] = useState<number>(DEFAULT_HEIGHT);

  /* eslint-disable */
  useEffect(() => {
    setHeight(DEFAULT_HEIGHT);
    void cesiumSampleTerrainMostDetailed(mapViewer.terrainProvider, [
      CesiumCartographic.fromDegrees(longitude, latitude),
    ]).then((updatedPositions) => {
      if (!isEmpty(updatedPositions)) {
        setHeight(updatedPositions[0].height);
      }
    });
  }, [longitude, latitude]);
  /* eslint-enable */

  useEffect(() => {
    setPosition(CesiumCartesian3.fromDegrees(longitude, latitude, height));
    mapViewer.camera.flyTo({
      destination: CesiumCartesian3.fromDegrees(
        longitude,
        latitude,
        height + CAMERA_HEIGHT_OFFSET
      ),
    }); //TODO: extract to a generic component
  }, [height, longitude, latitude]);

  return (
    <>
      {position !== undefined && (
        <CesiumEntity
          name={intl.formatMessage({ id: 'poi.dialog.description.title' })}
          position={position}
          billboard={{
            verticalOrigin: CesiumVerticalOrigin.BOTTOM,
            scale: 0.7,
            image: 'assets/img/map-marker.gif',
          }}
          description={`
          ${intl.formatMessage(
            { id: 'poi.dialog.description.longitude' },
            { value: longitude }
          )}</br>
          ${intl.formatMessage(
            { id: 'poi.dialog.description.latitude' },
            { value: latitude }
          )}</br>
          ${intl.formatMessage(
            { id: 'poi.dialog.description.height' },
            { value: height }
          )}
        `}
        />
      )}
    </>
  );
};
