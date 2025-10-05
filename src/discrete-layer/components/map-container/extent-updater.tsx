import { get } from 'lodash';
import React, { useEffect } from 'react';
import { CesiumMath, CesiumRectangle, useCesiumMap } from '@map-colonies/react-components';
import bboxPolygon from '@turf/bbox-polygon';
import { useStore } from '../../models';

export const ExtentUpdater: React.FC = (): JSX.Element => {
  const mapViewer = useCesiumMap();
  const store = useStore();
 
  useEffect(() => {
    const updateViewerExtent = () => {
      const scratchRectangle = new CesiumRectangle();
      try {
        const rect = mapViewer.camera.computeViewRectangle(mapViewer.scene.globe.ellipsoid, scratchRectangle);
        if (rect) {
          const west = CesiumMath.toDegrees(rect.west),
            south = CesiumMath.toDegrees(rect.south),
            east = CesiumMath.toDegrees(rect.east),
            north = CesiumMath.toDegrees(rect.north);
    
          const poly = bboxPolygon([west, north, east, south]);
  
          store.discreteLayersStore.setMapViewerExtentPolygon(poly);
        }
      } catch (e) {
        console.log('***** A Cesium Error Occurred *****', e);
      }
    };

    mapViewer.camera.moveEnd.addEventListener(updateViewerExtent);
    
    return (): void => {
      try {
        if (get(mapViewer, '_cesiumWidget') !== undefined) {
          mapViewer.camera.moveEnd.removeEventListener(updateViewerExtent);
        }
      } catch(e) {
        console.log('***** A Cesium Error Occurred *****', e);
      }
    }
  }, []);

  return <></>;
};
