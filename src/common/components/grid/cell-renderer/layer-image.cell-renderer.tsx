import React, { useState } from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { IconButton } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { isBeingDeleted, isExistLayerURL } from '../../../helpers/layer-url';
import { GridRowNode } from '..';

import './layer-image.cell-renderer.css';

interface ILayerImageCellRendererParams extends ICellRendererParams {
  onClick: (id: string, value: boolean, node: GridRowNode) => void;
}

export const LayerImageRenderer: React.FC<ILayerImageCellRendererParams> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const [layerImageShown, setLayerImageShown] = useState<boolean>(props.data.layerImageShown as boolean);
  return (
    <Box style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
      <IconButton
        className={layerImageShown ? 'mc-icon-Show imageChecked' : !isExistLayerURL(props.data) || isBeingDeleted(props.data) ? 'mc-icon-Hide iconNotAllowed' : 'mc-icon-Hide'}
        label="LAYER IMAGE SHOWN ICON"
        onClick={
          (): void => {
            if (isExistLayerURL(props.data) && !isBeingDeleted(props.data)) {
              setLayerImageShown(!layerImageShown);
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              props.onClick(props.data.id, !layerImageShown, props.node);
            }
          }
        }
      />
    </Box>
  );
};
