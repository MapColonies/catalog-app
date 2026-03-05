import { useCallback } from 'react';
import { Feature } from 'geojson';
import buffer from '@turf/buffer';
import polygonToLine from '@turf/polygon-to-line';
import { Polygon } from '@turf/turf';
import { useStore } from '../../../models';

const HIGHLIGHT_BUFFER_METERS = 2;

interface IHighlightSelectionUtils {
  onSelectionMouseOver: (selectionId: string) => void;
  onSelectionMouseOut: () => void;
}

const useHighlightSelection = (): IHighlightSelectionUtils => {
  const { exportStore } = useStore();

  const onSelectionMouseOver = useCallback((selectionId: string) => {
    const hoveredSelection = exportStore.getFeatureById(selectionId);
    const bufferedSelection = buffer(
      hoveredSelection as Feature<Polygon>,
      HIGHLIGHT_BUFFER_METERS,
      { units: 'meters' }
    );
    const selectionLine = polygonToLine(bufferedSelection as Feature<Polygon>);

    exportStore.setHighlightedFeature(selectionLine as Feature);
  }, []);

  const onSelectionMouseOut = useCallback(() => {
    exportStore.resetHighlightedFeature();
  }, []);

  return { onSelectionMouseOver, onSelectionMouseOut };
};

export default useHighlightSelection;
