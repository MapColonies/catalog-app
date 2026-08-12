import React from 'react';
import { isEmpty } from 'lodash';
import { observer } from 'mobx-react-lite';
import { Box } from '@map-colonies/react-components';
import { EntityDescriptorModelType, useStore } from '../../models';
import { LayerHeader } from '../layer-details/layer-header';
import ExportLayerToolbar from './export-layer-toolbar.component';

import './export-layer.component.css';

interface ExportLayerHeaderProps {}

const ExportLayerHeader: React.FC<ExportLayerHeaderProps> = observer(() => {
  const store = useStore();
  const layerToExport = store.exportStore.layerToExport;
  const entityDescriptors = store.discreteLayersStore
    .entityDescriptors as EntityDescriptorModelType[];

  return (
    <Box id="exportLayerHeader">
      <ExportLayerToolbar disableAll={!isEmpty(store.exportStore.finalJobId)} />
      <LayerHeader entityDescriptors={entityDescriptors} layerRecord={layerToExport} />
    </Box>
  );
});

export default ExportLayerHeader;
