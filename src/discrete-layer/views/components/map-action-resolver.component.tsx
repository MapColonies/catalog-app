import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  ICesiumImageryLayer,
  useCesiumMap,
} from '@map-colonies/react-components';
import { ContextActions } from '../../../common/actions/context.actions';
import { useStore } from '../../models';
import { IDispatchAction } from '../../models/actionDispatcherStore';

export const DEFAULT_LAYER_HUE_FACTOR = 0.0;

export const MapActionResolver: React.FC = observer(() => {
  const store = useStore();
  const mapViewer = useCesiumMap();

  const [highlightedLayer, setHighlightedLayer] =
    useState<ICesiumImageryLayer>();
  const prevHighlightedLayer = useRef<ICesiumImageryLayer>();

  // Preserve last highlighted layer to reset it when new highlighted layer is set.
  useEffect(() => {
    if (highlightedLayer) {
      prevHighlightedLayer.current = highlightedLayer;
    } else {
      if (prevHighlightedLayer.current) {
        prevHighlightedLayer.current.hue = DEFAULT_LAYER_HUE_FACTOR;
        prevHighlightedLayer.current = undefined;
      }
    }
  }, [highlightedLayer]);

  useEffect(() => {
    if (typeof store.actionDispatcherStore?.action === 'undefined') return;

    const { action, data } = store.actionDispatcherStore
      .action as IDispatchAction;

    /**
     * In theory, only context actions are supposed to be catch here.
     */

    const closeContextMenu = data?.handleClose as () => void | undefined;

    switch (action) {
      case ContextActions.MOVE_LAYER_UP: {
        mapViewer.layersManager?.raise(data?.id as string, 1);

        setHighlightedLayer(undefined);
        closeContextMenu();
        break;
      }
      case ContextActions.MOVE_LAYER_DOWN: {
        mapViewer.layersManager?.lower(data?.id as string, 1);

        setHighlightedLayer(undefined);
        closeContextMenu();
        break;
      }
      case ContextActions.MOVE_LAYER_TO_TOP: {
        mapViewer.layersManager?.raiseToTop(data?.id as string);

        setHighlightedLayer(undefined);
        closeContextMenu();
        break;
      }
      case ContextActions.MOVE_LAYER_TO_BOTTOM: {
        mapViewer.layersManager?.lowerToBottom(data?.id as string);

        setHighlightedLayer(undefined);
        closeContextMenu();
        break;
      }
      case ContextActions.HIGHLIGHT_ACTIVE_LAYER: {
        const foundLayer = mapViewer.layersManager?.get(data?.id as string);

        if (foundLayer) {
          if ((data?.hue as number) > DEFAULT_LAYER_HUE_FACTOR) {
            if (highlightedLayer) {
              highlightedLayer.hue = DEFAULT_LAYER_HUE_FACTOR;
            }
            setHighlightedLayer(foundLayer);
          } else if ((data?.hue as number) === DEFAULT_LAYER_HUE_FACTOR) {
            setHighlightedLayer(undefined);
          }
          foundLayer.hue = data?.hue as number;
        }

        break;
      }
      case ContextActions.QUERY_POLYGON_PARTS: {
        setHighlightedLayer(undefined);
        break;
      }
      default:
        break;
    }
  }, [store.actionDispatcherStore.action, store.discreteLayersStore]);

  return <></>;
});
