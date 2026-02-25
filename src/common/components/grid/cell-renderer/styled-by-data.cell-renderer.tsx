import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Typography } from '@map-colonies/react-core';
import { getIconStyle } from '../../../helpers/style';

export const StyledByDataRenderer: React.FC<ICellRendererParams> = (props) => {
  return (
    <Typography tag="span" style={getIconStyle(props.data, 'color')}>
      {props.value}
    </Typography>
  );
};
