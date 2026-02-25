/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  CesiumColor,
  CesiumConstantProperty,
  CesiumGeojsonLayer,
} from '@map-colonies/react-components';
import { FeatureCollection } from 'geojson';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { useStore } from '../../models';

const HIGHLIGHT_OUTLINE_WIDTH = 5;
const SELECTION_OUTLINE_COLOR = CesiumColor.DODGERBLUE;

const ExportLayerHighLightSelection: React.FC = observer(() => {
  const { exportStore } = useStore();
  const { highlightedSelection } = exportStore;
  const [highlightCollection, setHighlightCollection] =
    useState<FeatureCollection>();

  useEffect(() => {
    const highlightCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };
    if (highlightedSelection) {
      if (highlightedSelection.type === 'FeatureCollection') {
        setHighlightCollection({ ...highlightedSelection });
      } else {
        setHighlightCollection({
          ...highlightCollection,
          features: [highlightedSelection],
        });
      }
    } else {
      setHighlightCollection({ ...highlightCollection });
    }
  }, [highlightedSelection]);

  return (
    <>
      {highlightCollection?.features && (
        <CesiumGeojsonLayer
          clampToGround={true}
          data={highlightCollection}
          onLoad={(geoJsonDataSource): void => {
            geoJsonDataSource.entities.values.forEach((item) => {
              if (item.polyline) {
                (item.polyline.width as CesiumConstantProperty).setValue(
                  HIGHLIGHT_OUTLINE_WIDTH
                );
                // @ts-ignore
                item.polyline.material = SELECTION_OUTLINE_COLOR;
              }
            });
          }}
        />
      )}
    </>
  );
});

export default ExportLayerHighLightSelection;
