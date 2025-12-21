import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Box } from '@map-colonies/react-components';

const PlaceholderCellRenderer: React.FC<ICellRendererParams> = () => {
  return <Box />;
};

export default PlaceholderCellRenderer;