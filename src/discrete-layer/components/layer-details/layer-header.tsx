import React from 'react';
import { useIntl } from 'react-intl';
import { Box } from '@map-colonies/react-components';
import { Icon, Typography } from '@map-colonies/react-core';
import { Mode } from '../../../common/models/mode.enum';
import { EntityDescriptorModelType } from '../../models';
import { ILayerImage } from '../../models/layerImage';
import { LayersDetailsComponent } from './layer-details';
import { isEmptyLayerRecord } from './utils';

import './layer-header.css';

interface LayerHeaderProps {
  entityDescriptors: EntityDescriptorModelType[];
  layerRecord?: ILayerImage;
  layerState?: 'locked';
}

export const LayerHeader: React.FC<LayerHeaderProps> = ({
  entityDescriptors,
  layerRecord,
  layerState,
}) => {
  const intl = useIntl();
  const isEmpty = isEmptyLayerRecord(layerRecord);

  return (
    <Box className="layerHeaderContainer">
      <Box className="layerHeaderDetails">
        {isEmpty ? (
          <Box className="emptyLayerRecordError error">
            <Typography tag="span">
              {intl.formatMessage({ id: 'update-layer-header.error.emptyLayerRecord' })}
            </Typography>
          </Box>
        ) : (
          <LayersDetailsComponent
            className="detailsPanelProductView"
            entityDescriptors={entityDescriptors}
            layerRecord={layerRecord}
            isBrief={true}
            mode={Mode.VIEW}
          />
        )}
      </Box>
      {layerState === 'locked' && !isEmpty && (
        <Box className="lockedIcon warning">
          <Icon icon={{ icon: 'lock', size: 'xlarge' }} />
          <Typography tag="span">{intl.formatMessage({ id: 'general.title.locked' })}</Typography>
        </Box>
      )}
    </Box>
  );
};
