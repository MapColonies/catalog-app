import React from 'react';
import { IBaseMap, IBaseMaps } from '@map-colonies/react-components';
import { getOLSourceOptions } from '../../../discrete-layer/components/helpers/olUtils';
import { LinkType } from '../../models/link-type.enum';
import { OlTileLayer } from './ol.tile-layer';

interface OlBaseMapProps {
  baseMaps?: IBaseMaps;
}

export const OlBaseMap: React.FC<OlBaseMapProps> = React.memo((props): JSX.Element => {
  let baseMap = props.baseMaps?.maps.find((map: IBaseMap) => map.isForPreview);

  if (!baseMap) {
    baseMap = props.baseMaps?.maps.find((map: IBaseMap) => map.isCurrent);
  }

  if (!baseMap) {
    return <></>;
  }

  return (
    <>
      {baseMap.baseRasterLayers.map((layer) => {
        const options = getOLSourceOptions(layer.type as unknown as LinkType, {
          options: layer.options,
        });

        if (!options) {
          return null;
        }

        return (
          <OlTileLayer
            key={layer.id}
            layerType={layer.type}
            sourceOptions={options}
            layerOptions={{ opacity: layer.opacity }}
          />
        );
      })}
    </>
  );
});
