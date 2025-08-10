import React, { useEffect } from 'react';
import { CesiumColor, CesiumRectangle, CesiumSceneMode, useCesiumMap } from '@map-colonies/react-components';
import { LayerMetadataMixedUnion, RecordType } from '../../models';
import { generateFactoredLayerRectangle, generateLayerRectangle } from '../helpers/layersUtils';

const IMMEDIATELY = 0;
const TRANSPARENT = 0.0;

interface FlyToProps {
  setRect: (rect: CesiumRectangle | undefined) => void;
  layer: LayerMetadataMixedUnion;
}

export const FlyTo: React.FC<FlyToProps> = ({ setRect, layer}): JSX.Element => {
  const mapViewer = useCesiumMap();
  let rect;
  
  useEffect(() => {
    if (mapViewer.scene.mode !== CesiumSceneMode.SCENE3D && layer.type === RecordType.RECORD_3D) {
      mapViewer.scene.morphTo3D(IMMEDIATELY);
    }
    
    if (layer.type === RecordType.RECORD_3D) {
      
      rect = generateLayerRectangle(layer);

      const rectangle = mapViewer.entities.add({
        rectangle: {
          coordinates: rect,
          material: CesiumColor.PURPLE.withAlpha(TRANSPARENT)
        },
      });
      
      void mapViewer.flyTo(
        rectangle,
      ).then(() => {
        mapViewer.entities.remove(rectangle);
      });
    } else {
      rect = generateFactoredLayerRectangle(layer);
      mapViewer.camera.flyTo({ destination: rect });
    }

    setRect(undefined);
  }, []);

  return <></>;
};
