import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { JobModelType } from '../../../../discrete-layer/models';
import { TypeIcon } from '../../shared/type-icon';
import { Box } from '@map-colonies/react-components';

import './job-product-type.cell-renderer.css';
interface IProductTypeCellRendererParams extends ICellRendererParams {
  style?: Record<string, unknown>;
}

export const JobProductTypeRenderer: React.FC<
  IProductTypeCellRendererParams
> = (props) => {
  const data = props.data as JobModelType;

  return (
    <Box
      className="productTypeIconContainer"
      style={{ width: props.colDef?.width }}
    >
      <TypeIcon typeName={data.productType as string} style={props.style} />
    </Box>
  );
};
