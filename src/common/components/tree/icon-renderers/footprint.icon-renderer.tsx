import React, { useState, useEffect } from 'react';
import { Checkbox } from '@map-colonies/react-core';
import { ILayerImage } from '../../../../discrete-layer/models/layerImage';

import './footprint.icon-renderer.css';

interface IFootprintCellRendererParams {
  onClick: (data: ILayerImage, isShown: boolean) => void;
  data: ILayerImage;
}

export const FootprintRenderer: React.FC<IFootprintCellRendererParams> = (
  props
) => {
  const [checked, setChecked] = useState<boolean>(
    props.data.footprintShown as boolean
  );

  useEffect(() => {
    setChecked(props.data.footprintShown as boolean);
  }, [props.data.footprintShown]);

  return (
    <Checkbox
      className="footprintIcon"
      checked={checked}
      onClick={(evt: React.MouseEvent<HTMLInputElement>): void => {
        evt.stopPropagation();
        setChecked(evt.currentTarget.checked);
        props.onClick(props.data, evt.currentTarget.checked);
      }}
    />
  );
};
