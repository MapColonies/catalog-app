/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useState, useRef } from 'react';
import { isEmpty } from 'lodash';
import { observer } from 'mobx-react-lite';
import { useCesiumMap } from '@map-colonies/react-components';
import { usePrevious } from '../../../common/hooks/previous.hook';
import { ILayerImage } from '../../models/layerImage';
import { useStore } from '../../models/RootStore';
import { generateLayerComponent } from '../helpers/generateLayerComponent';

interface CacheMap {
  [key: string]: JSX.Element | undefined;
}

export const SelectedLayersContainer: React.FC = observer(() => {
  const store = useStore();
  const [layersImages, setlayersImages] = useState<ILayerImage[]>([]);
  const prevLayersImages = usePrevious<ILayerImage[]>(layersImages);
  const cacheRef = useRef({} as CacheMap);
  const mapViewer = useCesiumMap();

  useEffect(() => {
    if (store.discreteLayersStore.layersImages) {
      setlayersImages(
        // @ts-ignore
        store.discreteLayersStore.layersImages.slice().sort((curr, next) => curr.order - next.order)
      );
      if (isEmpty(store.discreteLayersStore.layersImages)) {
        cacheRef.current = {};
      }
    }
  }, [store.discreteLayersStore.layersImages]);

  useEffect(() => {
    if (isEmpty(store.discreteLayersStore.previewedLayers)) {
      cacheRef.current = {};
    }
  }, [store.discreteLayersStore.previewedLayers]);

  const getLayer = (layer: ILayerImage): JSX.Element | null | undefined => {
    const cache = cacheRef.current;
    if (layer.layerImageShown === true) {
      if (cache[layer.id] !== undefined) {
        return cache[layer.id];
      } else {
        if (mapViewer.layersManager?.get(layer.id) === undefined) {
          cache[layer.id] = generateLayerComponent(layer, store.discreteLayersStore.capabilities);
          return cache[layer.id];
        } else {
          return <></>;
        }
      }
    } else {
      const prevLayer = (prevLayersImages as []).find(
        (item: ILayerImage) => item.id === layer.id
      ) as ILayerImage | undefined;
      if (prevLayer?.layerImageShown === true) {
        delete cache[layer.id];
        return null;
      }
    }
  };

  return (
    <>
      {layersImages.map((layer) => {
        return getLayer(layer);
      })}
    </>
  );
});
