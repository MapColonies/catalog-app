/* eslint-disable @typescript-eslint/naming-convention */
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Feature, LineString, MultiPolygon, Polygon } from 'geojson';
import { useIntl } from 'react-intl';
import { CesiumRectangle, useCesiumMap } from '@map-colonies/react-components';
import bboxPolygon from '@turf/bbox-polygon';
import CONFIG from '../../../../common/config';
import { useStore } from '../../../models';
import { IFeatureConfig } from '../../../views/components/data-fetchers/wfs-features-fetcher.component';
import { GeojsonFeatureWithInfoBox } from './geojson-feature-with-infobox.component';
import { IPosition } from '../../../../common/hooks/useHeightFromTerrain';
import { crossesMeridian, ZERO_MERIDIAN } from '../../../../common/utils/geo.tools';
import useZoomLevelsTable from '../../export-layer/hooks/useZoomLevelsTable';


export const PolygonPartsFeature: React.FC = observer(() => {
  const store = useStore();
  const intl = useIntl();
  const cesiumViewer = useCesiumMap();
  const ZOOM_LEVELS_TABLE = useZoomLevelsTable();
  const valuesZoomLevelInDeg = Object.values(ZOOM_LEVELS_TABLE);
  const polygonPartsFeature = store.mapMenusManagerStore.currentPolygonPartsInfo;
  const lastMenuPosition = store.mapMenusManagerStore.lastMenuCoordinate;

  const [markerPosition, setMarkerPosition] = useState<IPosition>();

  const enrichWFSData = (geoJsonFeature : Feature) => {
    const resolutionDegree = geoJsonFeature?.properties?.['resolutionDegree'];
    if (isNaN(resolutionDegree)) {
      return;
    }

    const indexOfCurrentDeg = valuesZoomLevelInDeg.indexOf(resolutionDegree);
    if (indexOfCurrentDeg >= 0) {
      // @ts-ignore
      geoJsonFeature.properties['resolutionDegree'] = `${resolutionDegree} (${indexOfCurrentDeg})`;
    }
  };

  useEffect(() => {
      if (lastMenuPosition) {
        setMarkerPosition(lastMenuPosition);
      }
  }, [polygonPartsFeature]);

  useEffect(() => {
    // Fly to polygon parts features after data received.
    if (store.mapMenusManagerStore.multiplePolygonPartsBBox) {
      const ppPolygon = bboxPolygon(store.mapMenusManagerStore.multiplePolygonPartsBBox);
      const isCrossesMeridian = crossesMeridian(ppPolygon.geometry as Polygon, ZERO_MERIDIAN);

      if (!isCrossesMeridian){
        const polygonPartsFeaturesRect = CesiumRectangle.fromDegrees(
          ...store.mapMenusManagerStore.multiplePolygonPartsBBox
        ) as CesiumRectangle;
  
        cesiumViewer.camera.flyTo({ destination: polygonPartsFeaturesRect });
      }
    }
  }, [store.mapMenusManagerStore.multiplePolygonPartsBBox]);

  if (!polygonPartsFeature) return null;

  // If there are no features, use array with an empty object instead so that `GeojsonFeatureWithInfoBox` component will render no data found message
  const polygonPartsFeatures = polygonPartsFeature.features?.length ? polygonPartsFeature.features : [{}];

  return (
    <>
      {polygonPartsFeatures?.map((feature) => {
        const geoJsonFeature = feature as Feature;
        const polygonPartsFeatureConfig: IFeatureConfig = CONFIG.CONTEXT_MENUS.MAP.POLYGON_PARTS_FEATURE_CONFIG;
        const isCrossesMeridian = crossesMeridian(geoJsonFeature.geometry as Polygon | MultiPolygon, ZERO_MERIDIAN);

        enrichWFSData(geoJsonFeature);

        return (
          <GeojsonFeatureWithInfoBox
            feature={geoJsonFeature as Feature<LineString | Polygon>}
            featureConfig={polygonPartsFeatureConfig}
            isPolylined={false} // Polygon parts will be displayed as 2D polygon, meaning that optimal is a Cesium 2D mode
            infoBoxTitle={intl.formatMessage({ id: 'map-context-menu.polygon-parts.title' })}
            noInfoMessage={intl.formatMessage({ id: 'polygonParts-info.no-data.message' })}
            markerIconPath={'assets/img/app/polygon-parts-marker.png'}
            shouldFocusOnCreation={polygonPartsFeatures.length === 1}
            shouldVisualize={!isCrossesMeridian}
            markerPosition={markerPosition}
          />
        );
      })}
    </>
  );
});