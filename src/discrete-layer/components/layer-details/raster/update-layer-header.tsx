import React from 'react';
import { useIntl } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { Icon, Typography } from '@map-colonies/react-core';
import { Mode } from '../../../../common/models/mode.enum';
import { EntityDescriptorModelType, Status } from '../../../models';
import { ILayerImage } from '../../../models/layerImage';
import { LayersDetailsComponent } from '../layer-details';
import { RasterWorkflowContext } from './state-machine/context';

import './update-layer-header.css';

interface UpdateLayerHeaderProps {
  entityDescriptors: EntityDescriptorModelType[];
  layerRecord?: ILayerImage | null;
}

export const UpdateLayerHeader: React.FC<UpdateLayerHeaderProps> = ({
  entityDescriptors,
  layerRecord,
}) => {
  const intl = useIntl();
  const state = RasterWorkflowContext.useSelector((s) => s);

  return (
    <Box id="updateLayerHeader">
      <Box className="updateLayer">
        <LayersDetailsComponent
          className="detailsPanelProductView"
          entityDescriptors={entityDescriptors}
          layerRecord={layerRecord}
          isBrief={true}
          mode={Mode.VIEW}
        />
      </Box>
      {
        state.context.selectionMode === 'restore' &&
        state.context.flowType === Mode.UPDATE &&
        ![Status.Completed, Status.Aborted].includes(
          state.context.job?.details?.status as Status
        ) && (
        <Box className="lockedIcon warning">
          <Icon icon={{ icon: 'lock', size: 'xlarge' }} />
          <Typography tag="span">{intl.formatMessage({ id: 'general.title.locked' })}</Typography>
        </Box>
      )}
    </Box>
  );
};
