import React from 'react';
import { useMap } from '@map-colonies/react-components';
import { adaptToOlLayerExtent, adaptToOlOptions } from '@map-colonies/react-components/bridge';
import { OlTileLayer } from './ol.tile-layer';
import { BasemapOutput } from '../../../discrete-layer/components/basemaps/XXXbasemapMockXXX';
import { getInjectedAuth } from '../../../discrete-layer/components/helpers/cesiumUtils';
import { buildRasterLayerFromBasemapLayer } from '../../../discrete-layer/components/helpers/basemapLayerUtils';

interface OlBaseMapProps {
  basemaps: BasemapOutput[];
}

export const OlBaseMap: React.FC<OlBaseMapProps> = React.memo(({ basemaps }): JSX.Element => {
  const viewProjection = useMap().getView().getProjection().getCode();
  const basemap =
    basemaps.find((item) => item.isForPreview) ?? basemaps.find((item) => item.isCurrent);

  if (!basemap) {
    return <></>;
  }

  return (
    <>
      {basemap.layers
        .slice()
        .sort((curr, next) => curr.order - next.order)
        .map((basemapLayer) => {
          const layer = buildRasterLayerFromBasemapLayer(basemapLayer);
          const options =
            layer &&
            adaptToOlOptions(
              layer.type,
              layer.options,
              layer.noAuth ? undefined : getInjectedAuth()
            );

          if (!layer || !options) {
            return null;
          }

          return (
            <OlTileLayer
              key={layer.id}
              layerType={layer.type}
              sourceOptions={options}
              layerOptions={{
                opacity: layer.opacity,
                zIndex: layer.zIndex,
                extent: adaptToOlLayerExtent(layer.options, viewProjection),
              }}
            />
          );
        })}
    </>
  );
});
