import React, { useEffect, useState } from 'react';
import { IconButton } from '@map-colonies/react-core';
import { Box } from '@map-colonies/react-components';
import { ILayerImage } from '../../../../discrete-layer/models/layerImage';
import { isExistLayerURL, isBeingDeleted } from '../../../helpers/layer-url';

import './layer-image.icon-renderer.css';

interface ILayerImageCellRendererParams {
  onClick: (data: ILayerImage, isShown: boolean) => void;
  data: ILayerImage;
}

export const LayerImageRenderer: React.FC<ILayerImageCellRendererParams> = (props) => {
  const [layerImageShown, setLayerImageShown] = useState<boolean>(props.data.layerImageShown as boolean);

  useEffect(() => {
    setLayerImageShown(props.data.layerImageShown as boolean);
  }, [props.data.layerImageShown]);

  return (
    <Box>
      <IconButton 
        className={layerImageShown ? 'mc-icon-Show imageChecked' : !isExistLayerURL(props.data) || isBeingDeleted(props.data) ? 'mc-icon-Hide iconNotAllowed' : 'mc-icon-Hide'}
        label="LAYER IMAGE SHOWN ICON"
        onClick={
          (evt: React.MouseEvent<HTMLButtonElement>): void => {
            if (isExistLayerURL(props.data) && !isBeingDeleted(props.data)) {
              const val = !layerImageShown;
              evt.stopPropagation();
              setLayerImageShown(val);
              props.onClick(props.data, val);
            }
          }
        }
      />
    </Box>
  );
};
