import React from 'react';
import { Box } from '@map-colonies/react-components';
import { ICellRendererParams } from 'ag-grid-community';
import TooltippedValue, { TooltippedValueProps } from '../../../../common/components/form/tooltipped.value';
import './tool-tipped.cell-renderer.css';

export const TooltippedCellRenderer: React.FC<
  ICellRendererParams & TooltippedValueProps
> = (props) => {
  const {
    tag,
    className,
    alwaysTooltip,
    disableTooltip,
    customTooltipText,
  } = props;

  return (
    <Box className='tooltippedCell'>
      <TooltippedValue
        tag={tag}
        alwaysTooltip={alwaysTooltip}
        disableTooltip={disableTooltip}
        customTooltipText={customTooltipText}
        className={className}>
        {props.value}
      </TooltippedValue>
    </Box>
  );
};
