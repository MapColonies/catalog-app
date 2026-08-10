import React from 'react';
import { Box } from '@map-colonies/react-components';
import { Mode } from '../../../common/models/mode.enum';
import { EntityDescriptorModelType, useStore } from '../../models';
import { ILayerImage } from '../../models/layerImage';
import { LayersDetailsComponent } from './layer-details';

interface LayerHeaderProps {
  layerRecord: ILayerImage;
}

export const LayerHeader: React.FC<LayerHeaderProps> = ({ layerRecord }) => {
  const store = useStore();

  return (
    <Box className="layerHeaderContainer">
      <Box className="layerHeaderDetails">
        <LayersDetailsComponent
          className="detailsPanelProductView"
          entityDescriptors={
            store.discreteLayersStore.entityDescriptors as EntityDescriptorModelType[]
          }
          layerRecord={layerRecord}
          isBrief={true}
          mode={Mode.VIEW}
        />
      </Box>
    </Box>
  );
};
