/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useState, useRef } from 'react';
import {
  Cesium3DTileset,
  CesiumWMTSLayer,
  CesiumXYZLayer,
  ICesiumImageryLayer,
  useCesiumMap
} from '@map-colonies/react-components';
import { observer } from 'mobx-react-lite';
import { get, isEmpty } from 'lodash';
import { usePrevious } from '../../../common/hooks/previous.hook';
import { LinkType } from '../../../common/models/link-type.enum';
import { useStore } from '../../models/RootStore';
import { ILayerImage } from '../../models/layerImage';
import { Layer3DRecordModelType, LayerRasterRecordModelType, LinkModelType } from '../../models';
import {
  getLayerLink,
  generateLayerRectangle,
  getTokenResource,
  getWMTSOptions,
  getLinksArrWithTokens
} from '../helpers/layersUtils';

interface CacheMap {
  [key: string]: JSX.Element | undefined;
}

type SearchLayerPredicate = (layer: ICesiumImageryLayer, idx: number) => boolean;

export const SelectedLayersContainer: React.FC = observer(() => {
  const store = useStore();
  const [layersImages, setlayersImages] = useState<ILayerImage[]>([]);
  const prevLayersImages = usePrevious<ILayerImage[]>(layersImages);
  const cacheRef = useRef({} as CacheMap);
  const mapViewer = useCesiumMap();
  
  useEffect(() => {
    if (store.discreteLayersStore.layersImages) {
      // @ts-ignore
      setlayersImages(store.discreteLayersStore.layersImages.slice().sort((curr, next) => curr.order - next.order));
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

  const generateLayerComponent = (layer: ILayerImage): JSX.Element | undefined  => {
    const layerLink = getLayerLink(layer);

    switch (layerLink.protocol) {
      case LinkType.XYZ_LAYER:
        return (
          <CesiumXYZLayer
            key={layer.id}
            meta={{
              id: layer.id,
              searchLayerPredicate: ((cesiumLayer, idx) => {
                const correctLinkByProtocol = (layer.links as LinkModelType[]).find(link => link.protocol === layerLink.protocol);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                return correctLinkByProtocol?.url === (cesiumLayer as any)._imageryProvider._resource._url
              }) as SearchLayerPredicate,
              layerRecord: {
                ...layer,
                links: getLinksArrWithTokens([...layer.links as LinkModelType[]])
              } as ILayerImage
            }}
            rectangle={generateLayerRectangle(layer as LayerRasterRecordModelType)}
            options={{ url: getTokenResource(layerLink.url as string) }}
          />
        );
      case LinkType.THREE_D_TILES:
      case LinkType.THREE_D_LAYER:
        return (
          <Cesium3DTileset
            key={layer.id}
            url={getTokenResource(layerLink.url as string, (layer as Layer3DRecordModelType).productVersion as string)}
          />
        );
      case LinkType.WMTS_LAYER:
      case LinkType.WMTS: {
        const capability = store.discreteLayersStore.capabilities?.find(item => layerLink.name === item.id);
        const optionsWMTS = {
          ...getWMTSOptions(layer as LayerRasterRecordModelType, layerLink.url as string, capability)
        };
        return (
          <CesiumWMTSLayer
            key={layer.id}
            meta={{
              id: layer.id,
              searchLayerPredicate: ((cesiumLayer, idx) => {
                const linkUrl = (optionsWMTS.url as Record<string, any>)._url as string;
                const cesiumLayerLinkUrl = get(cesiumLayer, '_imageryProvider._resource._url') as string;
                const isLayerFound = (linkUrl.split('?')[0] === cesiumLayerLinkUrl.split('?')[0]);
                return isLayerFound;
              }) as SearchLayerPredicate,
              layerRecord: {
                ...layer,
                links: getLinksArrWithTokens([...layer.links as LinkModelType[]])
              } as ILayerImage
            }}
            rectangle={generateLayerRectangle(layer as LayerRasterRecordModelType)}
            options={optionsWMTS}
          />
        );
      }
      default:
        return undefined;
    }
  };
  
  const getLayer = (layer: ILayerImage): JSX.Element | null | undefined  => {
    const cache = cacheRef.current;
    if (layer.layerImageShown === true) {
      if (cache[layer.id] !== undefined) {
        return cache[layer.id];
      } else {
        if (mapViewer.layersManager?.get(layer.id) === undefined) {
          cache[layer.id] = generateLayerComponent(layer);
          return cache[layer.id];
        } else {
          return <></>;
        }
      }
    } else {
      const prevLayer = (prevLayersImages as []).find((item: ILayerImage) => item.id === layer.id) as ILayerImage | undefined;
      if (prevLayer?.layerImageShown === true) {
        delete cache[layer.id];
        return null;
      }
    }
  };

  return (
    <>
      {
        layersImages.map((layer) => {
          return getLayer(layer);
        })
      }
    </>
  );
});
