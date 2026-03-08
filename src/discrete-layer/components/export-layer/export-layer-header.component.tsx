import React from 'react';
import { isEmpty } from 'lodash';
import { observer } from 'mobx-react-lite';
import { Box } from '@map-colonies/react-components';
import { Mode } from '../../../common/models/mode.enum';
import { EntityDescriptorModelType, useStore } from '../../models';
import { LayersDetailsComponent } from '../layer-details/layer-details';
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
      <Box className="exportLayerDetails">
        <Box id="exportLayerHeaderContent">
          <LayersDetailsComponent
            className="detailsPanelProductView"
            entityDescriptors={entityDescriptors}
            layerRecord={layerToExport}
            isBrief={true}
            mode={Mode.EXPORT}
          />
        </Box>
      </Box>
    </Box>
  );
});

export default ExportLayerHeader;
